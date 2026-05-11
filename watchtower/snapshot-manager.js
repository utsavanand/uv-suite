// UV Suite Watchtower — snapshot + restore.
//
// A "snapshot" bundles the manifest of every active session at a moment in
// time (sid, cwd, persona, latest checkpoint path) plus a copy of the
// watchtower's recent event store. It also triggers an immediate Tier B
// auto-checkpoint for each session so the latest summary is captured.
//
// "Restore" doesn't restart Claude Code (we can't — processes are dead).
// On macOS / Linux it spawns a new terminal tab per session via the OS's
// AppleScript or terminal-emulator command, passing UVS_RESTORE_FROM=<old-sid>.
// The next `uvs` launch picks that up and auto-runs `/restore <old-sid>` on
// turn 1 via the SessionStart hook.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const SNAPSHOTS_DIR = path.join(os.homedir(), ".uv-suite", "snapshots");
const ACTIVE_WINDOW_MS = 60 * 60 * 1000; // sessions with activity in last 1h

function ensureSnapshotsDir() {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Group recent events by uvs_session_id, take the most recent metadata for
// each. Returns one record per active session.
function activeSessionsFromEvents(events) {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  const bySession = new Map();
  for (const ev of events) {
    const sid = ev.uvs_session_id || ev.session_id;
    if (!sid) continue;
    if ((ev._ts || 0) < cutoff) continue;
    // Skip if session was explicitly terminated
    if (ev.lifecycle === "terminated") {
      bySession.delete(sid);
      continue;
    }
    const existing = bySession.get(sid) || {
      uvs_session_id: sid,
      session_id: ev.session_id || sid,
      cwd: ev.cwd,
      name: ev.session_name || "",
      kind: ev.session_kind || "",
      purpose: ev.session_purpose || "",
      priority: ev.session_priority || "",
      persona: ev.persona || "",
      first_event_ts: ev._ts,
      last_event_ts: ev._ts,
      event_count: 0,
    };
    existing.last_event_ts = Math.max(existing.last_event_ts || 0, ev._ts || 0);
    existing.first_event_ts = Math.min(
      existing.first_event_ts || Infinity,
      ev._ts || Infinity,
    );
    existing.event_count++;
    // Refresh metadata fields from latest event (in case /session-init relabeled)
    if (ev.session_name) existing.name = ev.session_name;
    if (ev.session_kind) existing.kind = ev.session_kind;
    if (ev.session_purpose) existing.purpose = ev.session_purpose;
    if (ev.session_priority) existing.priority = ev.session_priority;
    if (ev.persona) existing.persona = ev.persona;
    if (ev.session_id) existing.session_id = ev.session_id;
    bySession.set(sid, existing);
  }
  return [...bySession.values()];
}

// Find each session's latest checkpoint file (auto-* or final-*)
function findLatestCheckpoint(cwd, sid) {
  const dir = path.join(cwd, "uv-out", "checkpoints", sid);
  if (!fs.existsSync(dir)) return null;
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f !== "latest.md");
    if (files.length === 0) return null;
    // Sort by mtime, newest first
    files.sort((a, b) => {
      const ma = fs.statSync(path.join(dir, a)).mtimeMs;
      const mb = fs.statSync(path.join(dir, b)).mtimeMs;
      return mb - ma;
    });
    return path.join(dir, files[0]);
  } catch {
    return null;
  }
}

// Read first few lines of summary section from a checkpoint file for the
// snapshot's per-session preview.
function readCheckpointSummary(cpPath) {
  if (!cpPath || !fs.existsSync(cpPath)) return "";
  try {
    const content = fs.readFileSync(cpPath, "utf-8");
    // Strip frontmatter
    const body = content.replace(/^---[\s\S]*?---\s*/m, "");
    // Look for ## Summary section
    const m = body.match(/##\s*Summary\s*\n+([\s\S]*?)(?=\n##\s|\n#\s|$)/);
    if (m) return m[1].trim().slice(0, 600);
    // Fallback: first 400 chars of body
    return body.trim().slice(0, 400);
  } catch {
    return "";
  }
}

async function takeSnapshot({ runner, getEvents, broadcast }) {
  ensureSnapshotsDir();

  // Trigger an immediate Tier B tick so the snapshot bundles the freshest
  // possible summaries. We don't block on broadcast; just await the tick.
  if (runner && runner.tick) {
    await runner.tick({ getEvents, broadcast });
  }

  const events = getEvents();
  const sessions = activeSessionsFromEvents(events);

  const ts = new Date();
  const id = ts
    .toISOString()
    .replace(/[T:]/g, "-")
    .replace(/\.\d+Z$/, "")
    .replace(/-(\d\d)$/, "$1");
  const dir = path.join(SNAPSHOTS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });

  for (const s of sessions) {
    s.latest_checkpoint = findLatestCheckpoint(s.cwd, s.uvs_session_id);
    s.summary_preview = readCheckpointSummary(s.latest_checkpoint);
  }

  const manifest = {
    id,
    created_at: ts.toISOString(),
    created_at_epoch: Math.floor(ts.getTime() / 1000),
    sessions,
    event_count: events.length,
  };

  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  fs.writeFileSync(
    path.join(dir, "events.json"),
    JSON.stringify(events, null, 2),
  );

  // Broadcast a SnapshotTaken event so it shows up in the timeline
  const event = {
    event_type: "SnapshotTaken",
    snapshot_id: id,
    session_count: sessions.length,
    _ts: ts.getTime(),
  };
  broadcast(event);

  return manifest;
}

function listSnapshots() {
  ensureSnapshotsDir();
  const entries = [];
  for (const name of fs.readdirSync(SNAPSHOTS_DIR).sort().reverse()) {
    const manifestPath = path.join(SNAPSHOTS_DIR, name, "manifest.json");
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      entries.push({
        id: m.id,
        created_at: m.created_at,
        session_count: m.sessions?.length || 0,
      });
    } catch {
      // skip unreadable bundles
    }
  }
  return entries;
}

function getSnapshot(id) {
  const manifestPath = path.join(SNAPSHOTS_DIR, id, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

// Spawn a new terminal tab restoring the given session.
//   macOS: AppleScript drives Terminal.app
//   Linux: prefers gnome-terminal then x-terminal-emulator
//   Other: returns { ok: false, command: <copy-paste string> }
function buildRestoreCommand(session) {
  const persona = session.persona || "professional";
  const sid = session.uvs_session_id;
  const cwd = session.cwd;
  // The new uvs launch reads UVS_RESTORE_FROM and the SessionStart hook
  // injects "run /restore <sid>" on turn 1.
  return `cd ${shellEscape(cwd)} && UVS_RESTORE_FROM=${shellEscape(sid)} uvs claude ${shellEscape(persona)}`;
}

function shellEscape(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

function openTerminalForSession(session) {
  const command = buildRestoreCommand(session);
  const platform = process.platform;

  if (platform === "darwin") {
    // Escape for AppleScript string (double-quotes + backslashes)
    const escaped = command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const script = `tell app "Terminal" to do script "${escaped}"`;
    const child = spawn("osascript", ["-e", script], {
      stdio: "ignore",
      detached: true,
    });
    child.unref();
    return { ok: true, platform, command };
  }

  if (platform === "linux") {
    // Try gnome-terminal first, fall back to x-terminal-emulator
    const tryEmulator = (cmd, args) => {
      try {
        const child = spawn(cmd, args, { stdio: "ignore", detached: true });
        child.unref();
        return true;
      } catch {
        return false;
      }
    };
    if (
      tryEmulator("gnome-terminal", [
        "--",
        "bash",
        "-c",
        command + "; exec bash",
      ]) ||
      tryEmulator("x-terminal-emulator", [
        "-e",
        "bash",
        "-c",
        command + "; exec bash",
      ])
    ) {
      return { ok: true, platform, command };
    }
  }

  // Windows or unsupported — return the command so the dashboard can offer
  // a "copy to clipboard" fallback.
  return { ok: false, platform, command };
}

module.exports = {
  takeSnapshot,
  listSnapshots,
  getSnapshot,
  openTerminalForSession,
  buildRestoreCommand,
  SNAPSHOTS_DIR,
};
