// UV Suite — Tier B auto-checkpoint runner.
// Called from watchtower/server.js on a setInterval. For each active session
// whose interval has elapsed, reads the Claude Code transcript JSONL at
// ~/.claude/projects/<encoded-cwd>/<session_id>.jsonl, extracts the
// conversation in the window, and writes a self-contained checkpoint:
//
//   ## Summary       — one paragraph from `claude -p --bare --model haiku`
//                      using the transcript as input
//   ## Conversation  — raw extract: user prompts verbatim + assistant
//                      response openings (~250 chars each) + tool calls
//   ## Mechanical    — git state + tool counts + files touched
//
// The transcript is copied into our checkpoint, so the file stands alone
// even if Claude Code later deletes its source JSONL.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const PROMPT_TEMPLATE_PATH = path.join(__dirname, "auto-checkpoint-prompt.md");
const DEFAULT_INTERVAL_MIN = 10;
const POLL_INTERVAL_MS = 60 * 1000;
const MAX_BUDGET_USD = "0.05";
const MODEL = "haiku";
const MAX_ASSISTANT_PREVIEW_CHARS = 250;
const MAX_CONVERSATION_LINES = 200;

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function readStringSafe(p) {
  try {
    return fs.readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

// Returns { mode, interval_minutes } — defaults if state file missing.
function readAutoCheckpointState(projectDir) {
  const f = path.join(projectDir, ".uv-suite-state", "auto-checkpoint.json");
  const d = readJsonSafe(f);
  return {
    mode: d?.mode ?? "on",
    interval_minutes: d?.interval_minutes ?? DEFAULT_INTERVAL_MIN,
  };
}

// Group events by session, keep the most recent set per session.
function groupActiveSessions(events, windowMs) {
  const cutoff = Date.now() - windowMs;
  const bySession = new Map();
  for (const ev of events) {
    const sid = ev.uvs_session_id || ev.session_id;
    if (!sid) continue;
    if ((ev._ts || 0) < cutoff) continue;
    if (!bySession.has(sid)) {
      bySession.set(sid, {
        sid,
        cwd: ev.cwd,
        session_name: ev.session_name || "",
        session_kind: ev.session_kind || "",
        session_priority: ev.session_priority || "",
        session_purpose: ev.session_purpose || "",
        persona: ev.persona || "",
        events: [],
      });
    }
    bySession.get(sid).events.push(ev);
  }
  return [...bySession.values()];
}

// Claude Code stores transcripts at ~/.claude/projects/<encoded>/<sid>.jsonl
// where <encoded> is the project path with "/" replaced by "-".
function transcriptPathFor(cwd, ccSessionId) {
  if (!ccSessionId) return null;
  const encoded = cwd.replace(/\//g, "-");
  return path.join(
    os.homedir(),
    ".claude",
    "projects",
    encoded,
    `${ccSessionId}.jsonl`,
  );
}

// Defensive parser: Claude Code's JSONL format is internal and may change.
// We pull out user prompts, assistant responses, and tool calls — skipping
// anything we can't interpret rather than blowing up.
function extractTextFromContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && block.type === "text" && typeof block.text === "string")
          return block.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

// Read transcript messages whose timestamp falls in [sinceMs, +inf).
// Returns a flat array of { role, text, ts, tool? } records, oldest first.
function readTranscriptMessages(transcriptPath, sinceMs) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    if (transcriptPath) {
      console.warn(`[auto-checkpoint] transcript not found: ${transcriptPath}`);
    }
    return null;
  }
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, "utf-8");
  } catch (err) {
    console.warn(`[auto-checkpoint] failed to read transcript: ${err.message}`);
    return null;
  }
  const out = [];
  let totalLines = 0;
  let parseFailures = 0;
  let recognizedShapes = 0;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    totalLines++;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      parseFailures++;
      continue;
    }
    const tsStr = msg.timestamp || msg.ts || msg.createdAt || msg.created_at;
    const ts = tsStr ? Date.parse(tsStr) : NaN;
    if (Number.isFinite(ts) && ts < sinceMs) continue;

    // Tolerate several shapes Claude Code has used:
    //   { type: "user"|"assistant", message: { role, content } }
    //   { role, content }
    //   { sender: "user"|"assistant", text }                  (older)
    //   { event: "message", role, content }                   (variant)
    const role =
      msg.role ||
      msg.message?.role ||
      msg.sender ||
      (msg.type === "user" || msg.type === "assistant" ? msg.type : null);
    const content = msg.message?.content ?? msg.content ?? msg.text ?? msg.body;
    const text = extractTextFromContent(content).trim();

    if (role === "user" && text) {
      out.push({ role: "user", text, ts });
      recognizedShapes++;
    } else if (role === "assistant" && text) {
      out.push({ role: "assistant", text, ts });
      recognizedShapes++;
    }
  }
  // Surface format drift loudly: if the file has content but nothing parsed
  // as a recognizable message, the Claude Code schema has probably changed.
  if (totalLines > 0 && recognizedShapes === 0) {
    console.warn(
      `[auto-checkpoint] transcript at ${transcriptPath}: ${totalLines} lines, ` +
        `${parseFailures} JSON-parse failures, 0 recognized user/assistant messages. ` +
        `Claude Code's transcript format may have changed — please file an issue.`,
    );
  }
  return out;
}

// Build the ## Conversation extract markdown block. Trims long assistant
// turns; caps total lines.
function buildConversationExtract(messages) {
  if (!messages || messages.length === 0) return "";
  const lines = [];
  for (const m of messages) {
    if (m.role === "user") {
      lines.push(`**You:**`);
      for (const ln of m.text.split("\n")) lines.push(`> ${ln}`);
    } else {
      let preview = m.text;
      if (preview.length > MAX_ASSISTANT_PREVIEW_CHARS) {
        preview =
          preview.slice(0, MAX_ASSISTANT_PREVIEW_CHARS).trimEnd() + " …";
      }
      lines.push(`**Claude:** ${preview.replace(/\n+/g, " ")}`);
    }
    lines.push("");
  }
  if (lines.length > MAX_CONVERSATION_LINES) {
    const trimmed = lines.slice(-MAX_CONVERSATION_LINES);
    trimmed.unshift(
      `_(earlier turns truncated; showing last ${MAX_CONVERSATION_LINES} lines)_`,
      "",
    );
    return trimmed.join("\n");
  }
  return lines.join("\n");
}

function eventToCompactLine(ev) {
  const t = ev.event_type || ev.hook_event_name || "?";
  const tool = ev.tool_name || "";
  const input = ev.tool_input || {};
  const target =
    input.file_path ||
    input.command ||
    input.pattern ||
    input.url ||
    input.description ||
    "";
  const ts = new Date(ev._ts || Date.now()).toISOString().slice(11, 19);
  let label = t;
  if (tool) label += ` ${tool}`;
  if (target) label += ` ${String(target).slice(0, 80)}`;
  return `  ${ts}  ${label}`;
}

function gitState(cwd) {
  return new Promise((resolve) => {
    const out = { branch: "", status: "", log: "" };
    let pending = 3;
    const done = () => {
      if (--pending === 0) resolve(out);
    };
    const run = (args, key) => {
      const child = spawn("git", args, { cwd });
      let buf = "";
      child.stdout.on("data", (d) => (buf += d));
      child.on("close", () => {
        out[key] = buf.trim();
        done();
      });
      child.on("error", () => done());
    };
    run(["branch", "--show-current"], "branch");
    run(["status", "--short"], "status");
    run(["log", "--oneline", "-5"], "log");
  });
}

function buildPrompt(template, ctx) {
  let out = template;
  for (const [k, v] of Object.entries(ctx)) {
    out = out.split(`{{${k}}}`).join(v ?? "");
  }
  return out;
}

function runClaudeP(prompt) {
  return new Promise((resolve) => {
    const child = spawn(
      "claude",
      ["-p", "--bare", "--model", MODEL, "--max-budget-usd", MAX_BUDGET_USD],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) =>
      resolve({ ok: false, stdout, stderr, error: err.message }),
    );
    child.on("close", (code) =>
      resolve({ ok: code === 0, stdout, stderr, code }),
    );
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

let promptTemplate = null;
function loadPromptTemplate() {
  if (promptTemplate) return promptTemplate;
  try {
    promptTemplate = fs.readFileSync(PROMPT_TEMPLATE_PATH, "utf-8");
  } catch {
    promptTemplate = null;
  }
  return promptTemplate;
}

async function processSession(session, broadcast) {
  const { sid, cwd, events } = session;
  if (!cwd || !sid) return;

  const state = readAutoCheckpointState(cwd);
  if (state.mode !== "on") return;
  const intervalMs = state.interval_minutes * 60 * 1000;

  const lastFile = path.join(
    cwd,
    ".uv-suite-state",
    "sessions",
    `${sid}.last-semantic-checkpoint.txt`,
  );
  const lastTs = parseInt(readStringSafe(lastFile) || "0", 10);
  const now = Date.now();
  if (now - lastTs * 1000 < intervalMs) return;

  // Activity since last checkpoint
  const recent = events
    .filter((e) => (e._ts || 0) > lastTs * 1000)
    .sort((a, b) => (a._ts || 0) - (b._ts || 0));
  if (recent.length === 0) return;

  // Find the Claude Code session id from the most recent event (it differs
  // from uvs_session_id) and read the conversation transcript.
  const ccSessionId =
    [...recent].reverse().find((e) => e.session_id)?.session_id || null;
  const transcriptPath = transcriptPathFor(cwd, ccSessionId);
  const sinceMs = lastTs > 0 ? lastTs * 1000 : now - intervalMs;
  const transcriptMessages = readTranscriptMessages(transcriptPath, sinceMs);

  const conversationExtract =
    buildConversationExtract(transcriptMessages) ||
    "_(no transcript content found; only mechanical activity captured below)_";

  // Mechanical breakdown — tool counts and files touched.
  const toolCounts = {};
  const fileCounts = {};
  for (const e of recent) {
    const t = e.tool_name;
    if (t) toolCounts[t] = (toolCounts[t] || 0) + 1;
    const fp = e.tool_input?.file_path;
    if (fp && (t === "Edit" || t === "Write" || t === "Read")) {
      fileCounts[fp] = (fileCounts[fp] || 0) + 1;
    }
  }
  const mechanicalLines = [];
  mechanicalLines.push("### Tool calls");
  Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([t, n]) => mechanicalLines.push(`- ${n}× ${t}`));
  if (Object.keys(fileCounts).length) {
    mechanicalLines.push("", "### Files touched");
    Object.entries(fileCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([f, n]) => mechanicalLines.push(`- ${f} (${n})`));
  }
  const mechanicalBlock = mechanicalLines.join("\n");

  const git = await gitState(cwd);
  const gitBlock = [
    git.branch ? `**Branch:** ${git.branch}` : "_(not a git repo)_",
    git.status
      ? "**Status:**\n```\n" + git.status + "\n```"
      : "**Status:** clean",
    git.log ? "**Recent commits:**\n```\n" + git.log + "\n```" : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  // Summary via claude -p, fed the actual conversation extract instead of
  // just the event log. Falls back to a one-line stub if the call fails or
  // the transcript is empty.
  let summary = "";
  const template = loadPromptTemplate();
  if (template && transcriptMessages && transcriptMessages.length > 0) {
    const elapsedMin =
      lastTs === 0
        ? state.interval_minutes
        : Math.round((now - lastTs * 1000) / 60000);
    const prompt = buildPrompt(template, {
      name: session.session_name || "(unset)",
      kind: session.session_kind || "(unset)",
      priority: session.session_priority || "(unset)",
      persona: session.persona || "(unset)",
      purpose: session.session_purpose || "(unset)",
      elapsed_min: String(elapsedMin),
      interval_min: String(state.interval_minutes),
      conversation: conversationExtract,
      mechanical: mechanicalBlock,
      git_branch: git.branch || "(not a git repo)",
      git_status: git.status || "(no changes)",
      git_log: git.log || "",
      timestamp: new Date(now).toISOString(),
    });
    const result = await runClaudeP(prompt);
    if (result.ok && result.stdout.trim()) {
      summary = result.stdout.trim();
    } else {
      console.warn(
        `[auto-checkpoint] summary call failed for ${sid.slice(0, 8)}:`,
        result.error || result.stderr?.slice(0, 200) || `exit ${result.code}`,
      );
    }
  }
  if (!summary) {
    summary = transcriptMessages
      ? "_(summary generation failed; raw conversation below)_"
      : "_(no conversation transcript available; only mechanical activity below)_";
  }

  // Write the checkpoint file
  const cpDir = path.join(cwd, "uv-out", "checkpoints", sid);
  fs.mkdirSync(cpDir, { recursive: true });
  const tsFile = new Date(now)
    .toISOString()
    .slice(0, 16)
    .replace(/[T:]/g, "-")
    .replace(/-(\d\d)$/, "$1");
  const cpFile = path.join(cpDir, `auto-${tsFile}-semantic.md`);

  const frontmatter = [
    "---",
    `uvs_session_id: ${sid}`,
    `session_name: ${session.session_name || ""}`,
    `session_kind: ${session.session_kind || ""}`,
    `session_purpose: ${session.session_purpose || ""}`,
    `session_priority: ${session.session_priority || ""}`,
    `persona: ${session.persona || ""}`,
    `checkpoint_at: ${new Date(now).toISOString()}`,
    `checkpoint_kind: auto-semantic`,
    `transcript_messages: ${transcriptMessages ? transcriptMessages.length : 0}`,
    `tool_calls_in_window: ${recent.length}`,
    "---",
    "",
  ].join("\n");

  const body = [
    `# Auto-checkpoint (semantic): ${new Date(now).toISOString()}`,
    "",
    "## Summary",
    "",
    summary,
    "",
    "## Conversation",
    "",
    conversationExtract,
    "",
    "## Mechanical",
    "",
    mechanicalBlock,
    "",
    "## Git",
    "",
    gitBlock,
    "",
  ].join("\n");

  fs.writeFileSync(cpFile, frontmatter + body);
  fs.writeFileSync(lastFile, String(Math.floor(now / 1000)));

  // Broadcast — the dashboard's expand-on-click body uses the summary.
  const event = {
    event_type: "AutoCheckpoint",
    source_app: path.basename(cwd),
    cwd,
    uvs_session_id: sid,
    session_id: sid,
    session_name: session.session_name,
    session_kind: session.session_kind,
    session_priority: session.session_priority,
    persona: session.persona,
    checkpoint_kind: "auto-semantic",
    checkpoint_path: cpFile,
    checkpoint_summary: summary,
    checkpoint_preview: (frontmatter + body).slice(0, 2000),
    interval_minutes: state.interval_minutes,
    tool_calls_in_window: recent.length,
    transcript_messages: transcriptMessages ? transcriptMessages.length : 0,
    _ts: now,
  };
  broadcast(event);
}

// One pass over all sessions with recent activity. Exposed so tests (and
// any future "force a checkpoint now" command) can drive a single tick.
async function tick({ getEvents, broadcast }) {
  try {
    const events = getEvents();
    const window = 60 * 60 * 1000; // 1h lookback for active sessions
    const sessions = groupActiveSessions(events, window);
    for (const s of sessions) {
      await processSession(s, broadcast);
    }
  } catch (err) {
    console.warn("[auto-checkpoint] tick error:", err.message);
  }
}

// Public API: start the runner. `getEvents` returns the watchtower's event
// store; `broadcast` injects an AutoCheckpoint event into the SSE stream.
// First tick after POLL_INTERVAL_MS; subsequent ticks every POLL_INTERVAL_MS.
function start({ getEvents, broadcast }) {
  const handle = setInterval(
    () => tick({ getEvents, broadcast }),
    POLL_INTERVAL_MS,
  );
  return () => clearInterval(handle);
}

module.exports = { start, tick };
