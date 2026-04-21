#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const UV_SUITE_DIR = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const command = args[0];
const pkg = require(path.join(UV_SUITE_DIR, 'package.json'));

const PERSONAS = ['spike', 'sport', 'pro', 'professional', 'auto'];
const TOOLS = ['claude', 'codex'];

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
  const installScript = path.join(UV_SUITE_DIR, 'install.sh');
  if (!fs.existsSync(installScript)) {
    console.error('Error: install.sh not found at', installScript);
    process.exit(1);
  }
  const installArgs = args.slice(1).join(' ');
  try {
    execSync(`bash "${installScript}" ${installArgs}`, { stdio: 'inherit' });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

function normPersona(p) {
  if (p === 'pro' || p === 'professional') return 'professional';
  if (PERSONAS.includes(p)) return p;
  return null;
}

function personaLabel(p) {
  const labels = {
    spike: 'Spike — research & docs (Opus, max)',
    sport: 'Sport — lightweight (Sonnet, high)',
    professional: 'Professional — full rigor (all hooks, all guardrails)',
    auto: 'Auto — autonomous (max, everything approved)',
  };
  return labels[p] || p;
}

function ensureInstalled(persona) {
  const settings = path.resolve('.claude/personas', `${persona}.json`);
  if (!fs.existsSync(settings)) {
    console.log('UV Suite not installed in this project. Installing...');
    console.log('');
    const installScript = path.join(UV_SUITE_DIR, 'install.sh');
    try {
      execSync(`bash "${installScript}" --persona ${persona}`, { stdio: 'inherit', timeout: 60000 });
    } catch (e) {
      // Install may timeout on pip installs but core files are already copied
    }
    console.log('');
  }
}

function launchClaude(persona, extra) {
  ensureInstalled(persona);
  const settings = path.resolve('.claude/personas', `${persona}.json`);
  if (!fs.existsSync(settings)) {
    console.error(`Error: installation failed. Run 'uvs install --persona ${persona}' manually.`);
    process.exit(1);
  }
  console.log(`UV Suite | Claude Code | ${personaLabel(persona)}`);
  console.log('');
  const child = spawn('claude', ['--settings', settings, ...extra], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
}

function launchCodex(persona, extra) {
  const approvalMap = {
    spike: ['--model', 'o3', '--approval-mode', 'suggest'],
    sport: ['--approval-mode', 'auto-edit'],
    professional: ['--approval-mode', 'suggest'],
    auto: ['--approval-mode', 'full-auto'],
  };
  const codexArgs = approvalMap[persona] || ['--approval-mode', 'suggest'];
  console.log(`UV Suite | Codex | ${personaLabel(persona)}`);
  console.log('');
  const child = spawn('codex', [...codexArgs, ...extra], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
}

function watch() {
  const serverScript = path.join(UV_SUITE_DIR, 'watchtower', 'server.js');
  if (!fs.existsSync(serverScript)) {
    console.error('Error: watchtower server not found at', serverScript);
    process.exit(1);
  }

  const bg = args.includes('--bg') || args.includes('--background');
  console.log('UV Suite Watchtower starting...');
  console.log('Dashboard: http://localhost:' + (process.env.UVS_WATCHTOWER_PORT || 4200));
  console.log('');

  if (bg) {
    const child = spawn('node', [serverScript], {
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
    console.log(`Running in background (PID: ${child.pid})`);
    console.log('Stop with: kill ' + child.pid);

    // Open browser
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(opener, ['http://localhost:' + (process.env.UVS_WATCHTOWER_PORT || 4200)], { stdio: 'ignore' });
  } else {
    // Foreground — open browser after a short delay
    setTimeout(() => {
      const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(opener, ['http://localhost:' + (process.env.UVS_WATCHTOWER_PORT || 4200)], { stdio: 'ignore' });
    }, 1000);

    const child = spawn('node', [serverScript], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code || 0));
  }
}

// --- Parse and route ---

if (!command || command === '--help' || command === '-h') {
  usage();
  process.exit(0);
}

if (command === 'watch') {
  watch();
} else if (command === 'install') {
  install();
} else if (command === 'info') {
  info();
} else if (TOOLS.includes(command)) {
  // uv claude pro, uv codex auto
  const persona = normPersona(args[1] || 'pro');
  if (!persona) {
    console.error(`Unknown persona: ${args[1]}`);
    console.error('Available: spike, sport, pro, auto');
    process.exit(1);
  }
  const extra = args.slice(2);
  if (command === 'claude') launchClaude(persona, extra);
  else launchCodex(persona, extra);
} else if (normPersona(command)) {
  // uv pro (shorthand for uv claude pro)
  const persona = normPersona(command);
  const extra = args.slice(1);
  launchClaude(persona, extra);
} else {
  console.error(`Unknown command: ${command}`);
  usage();
  process.exit(1);
}
