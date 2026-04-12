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
  uv v${pkg.version} — AI-assisted development framework

  Launch a session:
    uv claude pro          Claude Code, Professional persona
    uv claude auto         Claude Code, Auto persona
    uv codex pro           Codex, Professional persona
    uv codex sport         Codex, Sport persona
    uv pro                 Shorthand (defaults to Claude Code)
    uv                     Claude Code, Professional

  Setup:
    uv install             Install UV Suite into current project
    uv install --persona sport
    uv info                Show what's installed

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

function launchClaude(persona, extra) {
  const settings = path.resolve('.claude/personas', `${persona}.json`);
  if (!fs.existsSync(settings)) {
    console.error(`Error: ${settings} not found. Run 'uv install' first.`);
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

// --- Parse and route ---

if (!command || command === '--help' || command === '-h') {
  usage();
  process.exit(0);
}

if (command === 'install') {
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
