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

  Personas:
    spike        Research & docs (Opus, max effort)
    sport        New projects (Sonnet, high effort)
    pro          Production code (all hooks, all guardrails)
    auto         Fully autonomous (max effort, everything approved)
  `);
}

function info() {
  console.log(`
  UV Suite v${pkg.version}

  Contents:
    10 agents      Claude Code (.md), Cursor (.mdc), Codex (.toml)
    9  skills      Slash commands for Claude Code
    5  hooks       auto-lint, slop-check, danger-zone, block-destructive, review-reminder
    6  guardrails  Anti-slop rules
    4  personas    Spike, Sport, Professional, Auto

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

function normalizeKind(s) {
  const v = (s || "").toLowerCase().trim();
  if (["l", "long", "long-running"].includes(v)) return "long-running";
  if (["o", "outcome"].includes(v)) return "outcome";
  return "";
}

function normalizePriority(s) {
  const v = (s || "").toLowerCase().trim();
  if (["l", "low"].includes(v)) return "low";
  if (["m", "med", "medium"].includes(v)) return "med";
  if (["h", "high"].includes(v)) return "high";
  return "";
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
    name = (await prompt(rl, "  name:                     ")).trim();
    const kindRaw = await prompt(rl, "  kind [long/outcome]:      ");
    purpose = (await prompt(rl, "  purpose:                  ")).trim();
    const priorityRaw = await prompt(rl, "  priority [low/med/high]:  ");
    rl.close();
    kind = normalizeKind(kindRaw);
    priority = normalizePriority(priorityRaw);
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

// Backwards-compat shim — older code in this file still references this name.
function ensureInstalled(persona) {
  syncPackageFiles(persona);
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
  const child = spawn("claude", ["--settings", settings, ...extra], {
    stdio: "inherit",
    env: { ...process.env, UVS_SESSION_ID: sid },
  });
  child.on("exit", (code) => process.exit(code || 0));
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
  const child = spawn("codex", [...codexArgs, ...extra], {
    stdio: "inherit",
    env: { ...process.env, UVS_SESSION_ID: sid },
  });
  child.on("exit", (code) => process.exit(code || 0));
}

function watch() {
  const serverScript = path.join(UV_SUITE_DIR, "watchtower", "server.js");
  if (!fs.existsSync(serverScript)) {
    console.error("Error: watchtower server not found at", serverScript);
    process.exit(1);
  }

  const bg = args.includes("--bg") || args.includes("--background");
  console.log("UV Suite Watchtower starting...");
  console.log(
    "Dashboard: http://localhost:" + (process.env.UVS_WATCHTOWER_PORT || 4200),
  );
  console.log("");

  if (bg) {
    const child = spawn("node", [serverScript], {
      stdio: "ignore",
      detached: true,
    });
    child.unref();
    console.log(`Running in background (PID: ${child.pid})`);
    console.log("Stop with: kill " + child.pid);

    // Open browser
    const opener =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    spawn(
      opener,
      ["http://localhost:" + (process.env.UVS_WATCHTOWER_PORT || 4200)],
      { stdio: "ignore" },
    );
  } else {
    // Foreground — open browser after a short delay
    setTimeout(() => {
      const opener =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
            ? "start"
            : "xdg-open";
      spawn(
        opener,
        ["http://localhost:" + (process.env.UVS_WATCHTOWER_PORT || 4200)],
        { stdio: "ignore" },
      );
    }, 1000);

    const child = spawn("node", [serverScript], { stdio: "inherit" });
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
