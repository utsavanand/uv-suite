#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const readline = require("readline");

const UV_SUITE_DIR = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const command = args[0];
const pkg = require(path.join(UV_SUITE_DIR, "package.json"));

const PERSONAS = ["spike", "sport", "pro", "professional", "auto"];
const TOOLS = ["claude", "codex"];

function usage() {
  console.log(`
  uvs v${pkg.version} — AI-assisted development framework

  Launch a session:
    uvs claude pro          Claude Code, Professional persona
    uvs claude auto         Claude Code, Auto persona
    uvs codex pro           Codex, Professional persona
    uvs codex sport         Codex, Sport persona
    uvs pro                 Shorthand (defaults to Claude Code)
    uvs                    Claude Code, Professional

  Setup:
    uvs install             Install UV Suite into current project
    uvs install --persona sport
    uvs info                Show what's installed

  Monitoring:
    uvs watch               Start Watchtower dashboard (open browser)
    uvs watch --bg          Start Watchtower in background
    uvs watch --legacy      Start the legacy Node Watchtower

  Personas:
    spike        Research & docs (Opus, max effort)
    sport        New projects (Sonnet, high effort)
    pro          Production code (all hooks, all guardrails)
    auto         Fully autonomous (max effort, everything approved)
  `);
}

function info() {
  // Count from disk so these never drift out of sync with the actual contents.
  const countDir = (sub, ext) => {
    try {
      return fs.readdirSync(path.join(UV_SUITE_DIR, sub)).filter((f) => f.endsWith(ext)).length;
    } catch {
      return "?";
    }
  };
  let skills = "?";
  try {
    skills = fs
      .readdirSync(path.join(UV_SUITE_DIR, "skills"))
      .filter((d) => fs.existsSync(path.join(UV_SUITE_DIR, "skills", d, "SKILL.md"))).length;
  } catch {}
  console.log(`
  UV Suite v${pkg.version}

  Contents:
    ${countDir("agents/claude-code", ".md")} agents      Claude Code (.md), Cursor (.mdc), Codex (.toml)
    ${skills} skills      Slash commands for Claude Code
    ${countDir("hooks", ".sh")} hooks       Lifecycle automation
    ${countDir("guardrails", ".md")} guardrails  Anti-slop rules
    ${countDir("personas", ".json")} personas    Spike, Sport, Professional, Auto

  Source: ${UV_SUITE_DIR}
  `);
}

function install() {
  const installScript = path.join(UV_SUITE_DIR, "install.sh");
  if (!fs.existsSync(installScript)) {
    console.error("Error: install.sh not found at", installScript);
    process.exit(1);
  }
  const installArgs = args.slice(1).join(" ");
  try {
    execSync(`bash "${installScript}" ${installArgs}`, { stdio: "inherit" });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

function normPersona(p) {
  if (p === "pro" || p === "professional") return "professional";
  if (PERSONAS.includes(p)) return p;
  return null;
}

function personaLabel(p) {
  const labels = {
    spike: "Spike — research & docs (Opus, max)",
    sport: "Sport — lightweight (Sonnet, high)",
    professional: "Professional — full rigor (all hooks, all guardrails)",
    auto: "Auto — autonomous (max, everything approved)",
  };
  return labels[p] || p;
}

// Sync package-owned files (hooks, skills, personas, agents, optional guardrails)
// from the installed npm package into the project's .claude/. Idempotent — runs
// every launch so users on older versions pick up new hooks and slash commands
// after `npm install -g uv-suite@latest` without needing `uvs install` again.
// settings.json is preserved if it exists (user customizations).
function syncPackageFiles(persona) {
  const srcDir = UV_SUITE_DIR;
  const targetDir = path.resolve(".claude");
  const hooksDir = path.join(targetDir, "hooks");
  const personasDir = path.join(targetDir, "personas");
  const wasFreshInstall =
    !fs.existsSync(personasDir) || !fs.existsSync(hooksDir);

  for (const dir of ["agents", "skills", "hooks", "rules", "personas"]) {
    fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
  }

  const agentsSrc = path.join(srcDir, "agents", "claude-code");
  if (fs.existsSync(agentsSrc)) {
    for (const f of fs.readdirSync(agentsSrc)) {
      fs.copyFileSync(
        path.join(agentsSrc, f),
        path.join(targetDir, "agents", f),
      );
    }
  }

  const hooksSrc = path.join(srcDir, "hooks");
  if (fs.existsSync(hooksSrc)) {
    for (const f of fs.readdirSync(hooksSrc)) {
      const dest = path.join(targetDir, "hooks", f);
      fs.copyFileSync(path.join(hooksSrc, f), dest);
      fs.chmodSync(dest, 0o755);
    }
  }

  const skillsSrc = path.join(srcDir, "skills");
  if (fs.existsSync(skillsSrc)) {
    for (const d of fs.readdirSync(skillsSrc)) {
      const skillFile = path.join(skillsSrc, d, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        const destDir = path.join(targetDir, "skills", d);
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(skillFile, path.join(destDir, "SKILL.md"));
      }
    }
  }

  if (persona === "professional" || persona === "auto") {
    const guardSrc = path.join(srcDir, "guardrails");
    if (fs.existsSync(guardSrc)) {
      for (const f of fs.readdirSync(guardSrc)) {
        fs.copyFileSync(
          path.join(guardSrc, f),
          path.join(targetDir, "rules", f),
        );
      }
    }
  }

  const personasSrc = path.join(srcDir, "personas");
  if (fs.existsSync(personasSrc)) {
    for (const f of fs.readdirSync(personasSrc)) {
      fs.copyFileSync(
        path.join(personasSrc, f),
        path.join(targetDir, "personas", f),
      );
    }
  }

  // settings.json is user-owned. Only seed it on fresh install.
  const personaFile = path.join(targetDir, "personas", `${persona}.json`);
  const settingsFile = path.join(targetDir, "settings.json");
  if (
    wasFreshInstall &&
    fs.existsSync(personaFile) &&
    !fs.existsSync(settingsFile)
  ) {
    fs.copyFileSync(personaFile, settingsFile);
  }

  if (wasFreshInstall) {
    console.log(
      "UV Suite not installed in this project. Installing core files...",
    );
    console.log(`  Installed: agents, skills, hooks, guardrails, personas`);
    console.log("");
  }
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Prompt for one of a fixed set of values (enum). Accepts the number, the full
// value, or a unique prefix; Enter skips (returns ""). Re-prompts on invalid input.
async function promptChoice(rl, label, options) {
  const menu = options.map((o, i) => `${i + 1}=${o}`).join("  ");
  for (;;) {
    const raw = (await prompt(rl, `${label} (${menu}, Enter to skip): `)).trim().toLowerCase();
    if (!raw) return "";
    const n = parseInt(raw, 10);
    if (n >= 1 && n <= options.length) return options[n - 1];
    const matches = options.filter((o) => o === raw || o.startsWith(raw));
    if (matches.length === 1) return matches[0];
    console.log(`  ? pick one of: ${options.join(", ")} (or its number)`);
  }
}

// Generate a UVS_SESSION_ID, prompt for metadata (name/kind/purpose/priority),
// write it to .uv-suite-state/sessions/<sid>.json, and return the id + name.
// Skipping (Enter) leaves a field empty; the session-label-nag.sh hook will
// remind the user to run /session-init mid-flight.
async function setupSession(persona) {
  const projectDir = process.cwd();
  const stateDir = path.join(projectDir, ".uv-suite-state");
  const sessionsDir = path.join(stateDir, "sessions");
  fs.mkdirSync(sessionsDir, { recursive: true });

  const sid = crypto.randomUUID();
  let name = "";
  let kind = "";
  let purpose = "";
  let priority = "";

  if (process.stdin.isTTY && !process.env.UVS_NO_PROMPT) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log("");
    console.log("Label this session (Enter to skip — you'll be reminded):");
    name = (await prompt(rl, "  name:     ")).trim();
    kind = await promptChoice(rl, "  kind", ["long-running", "outcome"]);
    purpose = (await prompt(rl, "  purpose:  ")).trim();
    priority = await promptChoice(rl, "  priority", ["low", "med", "high"]);
    rl.close();
  }

  const meta = {
    uvs_session_id: sid,
    name,
    kind,
    purpose,
    priority,
    persona,
    cwd: projectDir,
    started_at: Math.floor(Date.now() / 1000),
  };
  fs.writeFileSync(
    path.join(sessionsDir, `${sid}.json`),
    JSON.stringify(meta, null, 2),
  );
  fs.writeFileSync(path.join(stateDir, "current-session.txt"), sid);

  return { sid, name };
}

// Launch `tool` so Watchtower can control it: wrap it in a transparent tmux session
// (dedicated socket `uvs`) and register the handle, so the dashboard can checkpoint /
// close / approve it. Falls back to a direct spawn when tmux is unavailable, UVS_NO_TMUX
// is set, or we're already inside the wrapper.
function launchWrapped(tool, toolArgs, sid) {
  const { spawnSync } = require("child_process");
  const env = { ...process.env, UVS_SESSION_ID: sid };
  const canTmux =
    !process.env.UVS_NO_TMUX &&
    !process.env.UVS_IN_TMUX &&
    spawnSync("tmux", ["-V"], { stdio: "ignore" }).status === 0;

  if (canTmux) {
    const tname = "uvs_" + sid;
    const wtUrl = process.env.UVS_WATCHTOWER_URL || "http://localhost:4200";
    const shq = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
    const inner =
      "UVS_SESSION_ID=" + shq(sid) + " UVS_IN_TMUX=1 exec " + [tool, ...toolArgs].map(shq).join(" ");
    const mk = spawnSync(
      "tmux", ["-L", "uvs", "new-session", "-d", "-s", tname, "-c", process.cwd(), inner],
      { stdio: "ignore" },
    );
    if (mk.status === 0) {
      spawnSync("tmux", ["-L", "uvs", "set", "-t", tname, "status", "off"], { stdio: "ignore" });
      spawnSync(
        "curl", ["-s", "-m", "2", wtUrl + "/sessions/register",
          "-H", "Content-Type: application/json",
          "-d", JSON.stringify({ id: sid, tmux_target: tname, pid: process.pid, cwd: process.cwd() })],
        { stdio: "ignore" },
      );
      const att = spawn("tmux", ["-L", "uvs", "attach", "-t", tname], { stdio: "inherit" });
      att.on("exit", (code) => process.exit(code || 0));
      return;
    }
    // tmux new-session failed — fall through to a direct spawn.
  }

  const child = spawn(tool, toolArgs, { stdio: "inherit", env });
  child.on("exit", (code) => process.exit(code || 0));
}

async function launchClaude(persona, extra) {
  syncPackageFiles(persona);
  const settings = path.resolve(".claude/personas", `${persona}.json`);
  if (!fs.existsSync(settings)) {
    console.error(
      `Error: installation failed. Run 'uvs install --persona ${persona}' manually.`,
    );
    process.exit(1);
  }
  const { sid, name } = await setupSession(persona);
  console.log("");
  console.log(`UV Suite | Claude Code | ${personaLabel(persona)}`);
  console.log(`Session: ${sid.slice(0, 8)}${name ? " — " + name : ""}`);
  console.log("");
  launchWrapped("claude", ["--settings", settings, ...extra], sid);
}

async function launchCodex(persona, extra) {
  const approvalMap = {
    spike: ["--model", "o3", "--approval-mode", "suggest"],
    sport: ["--approval-mode", "auto-edit"],
    professional: ["--approval-mode", "suggest"],
    auto: ["--approval-mode", "full-auto"],
  };
  const codexArgs = approvalMap[persona] || ["--approval-mode", "suggest"];
  const { sid, name } = await setupSession(persona);
  console.log("");
  console.log(`UV Suite | Codex | ${personaLabel(persona)}`);
  console.log(`Session: ${sid.slice(0, 8)}${name ? " — " + name : ""}`);
  console.log("");
  launchWrapped("codex", [...codexArgs, ...extra], sid);
}

// Resolve how to run the Python app, provisioning deps on first run.
// Prefers `uv` (astral) if present; otherwise a venv at watchtower/.venv.
// Returns the argv prefix to which we append `uvicorn` args.
function ensurePyEnv(wtDir) {
  const { spawnSync } = require("child_process");
  const hasUv = spawnSync("uv", ["--version"], { stdio: "ignore" }).status === 0;
  if (hasUv) {
    // --native-tls: use the OS cert store so corporate SSL-inspection proxies don't break pypi.
    return ["uv", "run", "--native-tls", "--python", "3.12", "--no-project", "--with-requirements", "requirements.txt", "--", "python", "-m"];
  }
  const venv = path.join(wtDir, ".venv");
  const py =
    process.platform === "win32"
      ? path.join(venv, "Scripts", "python.exe")
      : path.join(venv, "bin", "python");
  if (!fs.existsSync(py)) {
    const python3 = spawnSync("python3", ["--version"], { stdio: "ignore" }).status === 0 ? "python3" : "python";
    console.log("First run: creating Python env in watchtower/.venv (one-time)...");
    if (spawnSync(python3, ["-m", "venv", ".venv"], { cwd: wtDir, stdio: "inherit" }).status !== 0) {
      console.error("Failed to create venv. Install Python 3 (python3) and retry.");
      process.exit(1);
    }
    console.log("Installing dependencies (fastapi, uvicorn, aiosqlite)...");
    if (spawnSync(py, ["-m", "pip", "install", "-q", "-r", "requirements.txt"], { cwd: wtDir, stdio: "inherit" }).status !== 0) {
      console.error("pip install failed (see output above).");
      process.exit(1);
    }
  }
  return [py, "-m"];
}

// If a Watchtower is already running on this port, stop it so we start fresh —
// uvicorn doesn't hot-reload, so a long-running process serves stale routes while
// the (disk-served) dashboard updates. Only kills a process that answers /health
// like a Watchtower, so we never kill an unrelated app on the port.
function restartIfRunning(port) {
  const { spawnSync } = require("child_process");
  if (process.platform === "win32") return;
  const health = spawnSync("curl", ["-s", "-m", "1", `http://localhost:${port}/health`], { encoding: "utf8" });
  if (!(health.stdout || "").includes("status")) return;
  const pids = (spawnSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" }).stdout || "")
    .trim().split(/\s+/).filter(Boolean);
  if (!pids.length) return;
  spawnSync("kill", pids);
  console.log(`Restarting Watchtower (stopped existing PID ${pids.join(", ")})`);
  spawnSync("sleep", ["1"]);  // let the port free up before rebinding
}

function watch() {
  const wtDir = path.join(UV_SUITE_DIR, "watchtower");

  // Legacy fallback: the original Node Watchtower (no Postgres/Docker). `uvs watch --legacy`.
  if (args.includes("--legacy")) {
    const serverScript = path.join(wtDir, "legacy", "server.js");
    if (!fs.existsSync(serverScript)) {
      console.error("Error: legacy watchtower not found at", serverScript);
      process.exit(1);
    }
    const lbg = args.includes("--bg") || args.includes("--background");
    const lurl = "http://localhost:" + (process.env.UVS_WATCHTOWER_PORT || 4200);
    const lopener =
      process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    console.log("UV Suite Watchtower (legacy Node) starting...");
    console.log("Dashboard: " + lurl);
    console.log("");
    setTimeout(() => spawn(lopener, [lurl], { stdio: "ignore" }), 1000);
    const lchild = spawn("node", [serverScript], { stdio: lbg ? "ignore" : "inherit", detached: lbg });
    if (lbg) {
      lchild.unref();
      console.log(`Running in background (PID: ${lchild.pid}). Stop with: kill ${lchild.pid}`);
    } else {
      lchild.on("exit", (code) => process.exit(code || 0));
    }
    return;
  }
  const bg = args.includes("--bg") || args.includes("--background");
  const port = process.env.UVS_WATCHTOWER_PORT || 4200;
  const url = "http://localhost:" + port;
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";

  // Python + SQLite, run locally (no Docker, no database to install).
  restartIfRunning(port);
  console.log("UV Suite Watchtower starting...");
  console.log("Dashboard: " + url);
  console.log("");
  const argv = [...ensurePyEnv(wtDir), "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port)];
  setTimeout(() => spawn(opener, [url], { stdio: "ignore" }), 1500);
  const child = spawn(argv[0], argv.slice(1), { cwd: wtDir, stdio: bg ? "ignore" : "inherit", detached: bg });
  if (bg) {
    child.unref();
    console.log(`Running in background (PID: ${child.pid}). Stop with: kill ${child.pid}`);
  } else {
    child.on("exit", (code) => process.exit(code || 0));
  }
}

// --- Parse and route ---

if (!command || command === "--help" || command === "-h") {
  usage();
  process.exit(0);
}

(async () => {
  if (command === "watch") {
    watch();
  } else if (command === "install") {
    install();
  } else if (command === "info") {
    info();
  } else if (TOOLS.includes(command)) {
    // uvs claude pro, uvs codex auto
    const persona = normPersona(args[1] || "pro");
    if (!persona) {
      console.error(`Unknown persona: ${args[1]}`);
      console.error("Available: spike, sport, pro, auto");
      process.exit(1);
    }
    const extra = args.slice(2);
    if (command === "claude") await launchClaude(persona, extra);
    else await launchCodex(persona, extra);
  } else if (normPersona(command)) {
    // uvs pro (shorthand for uvs claude pro)
    const persona = normPersona(command);
    const extra = args.slice(1);
    await launchClaude(persona, extra);
  } else {
    console.error(`Unknown command: ${command}`);
    usage();
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
