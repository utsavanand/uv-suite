// UV Suite — Tier B auto-checkpoint runner.
// Called from watchtower/server.js on a setInterval. For each active session
// (one with at least one event in the last interval), shells out to
// `claude -p --bare --model haiku` to write a semantic summary.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PROMPT_TEMPLATE_PATH = path.join(__dirname, "auto-checkpoint-prompt.md");
const DEFAULT_INTERVAL_MIN = 10;
const POLL_INTERVAL_MS = 60 * 1000; // wake up every 60s; per-session cadence is honored individually
const MAX_BUDGET_USD = "0.05";
const MODEL = "haiku";

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

  const template = loadPromptTemplate();
  if (!template) {
    console.warn("[auto-checkpoint] prompt template missing; skipping");
    return;
  }

  const git = await gitState(cwd);
  const eventList = recent.slice(-40).map(eventToCompactLine).join("\n");
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
    event_list: eventList,
    git_branch: git.branch ? `Branch: ${git.branch}` : "(not a git repo)",
    git_status: git.status || "(no changes)",
    git_log: git.log || "",
    timestamp: new Date(now).toISOString(),
  });

  const result = await runClaudeP(prompt);
  if (!result.ok || !result.stdout.trim()) {
    console.warn(
      `[auto-checkpoint] claude -p failed for ${sid.slice(0, 8)}:`,
      result.error || result.stderr?.slice(0, 200) || `exit ${result.code}`,
    );
    return;
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
    "---",
    "",
  ].join("\n");

  fs.writeFileSync(cpFile, frontmatter + result.stdout.trim() + "\n");
  fs.writeFileSync(lastFile, String(Math.floor(now / 1000)));

  // Broadcast as AutoCheckpoint event
  const preview = (frontmatter + result.stdout).slice(0, 2000);
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
    checkpoint_preview: preview,
    interval_minutes: state.interval_minutes,
    tool_calls_in_window: recent.length,
    _ts: now,
  };
  broadcast(event);
}

// Public API: start the runner. `getEvents` returns the watchtower's event
// store; `broadcast` injects an AutoCheckpoint event into the SSE stream.
function start({ getEvents, broadcast }) {
  const tick = async () => {
    try {
      const events = getEvents();
      // Use the longest configured interval to find candidate sessions; we'll
      // re-check each session's actual interval inside processSession.
      const window = 60 * 60 * 1000; // 1h lookback for active sessions
      const sessions = groupActiveSessions(events, window);
      for (const s of sessions) {
        await processSession(s, broadcast);
      }
    } catch (err) {
      console.warn("[auto-checkpoint] tick error:", err.message);
    }
  };
  // First tick after one minute; subsequent ticks every minute.
  const handle = setInterval(tick, POLL_INTERVAL_MS);
  return () => clearInterval(handle);
}

module.exports = { start };
