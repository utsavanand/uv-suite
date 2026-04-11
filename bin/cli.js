#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const UV_SUITE_DIR = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const command = args[0];

function usage() {
  console.log(`
  uv-suite - AI-assisted development framework

  Usage:
    npx uv-suite install [--persona sport|professional|auto|spike] [--global]
    npx uv-suite info

  Commands:
    install   Install agents, skills, hooks, guardrails, and personas
    info      Show what would be installed

  Personas:
    spike          Research & documentation (Opus, max effort)
    sport          New projects, prototyping (Sonnet, high effort)
    professional   Production code (default, all hooks + guardrails)
    auto           Fully autonomous (max effort, everything approved)

  Examples:
    npx uv-suite install                        Install with Professional persona
    npx uv-suite install --persona sport        Install with Sport persona
    npx uv-suite install --global               Install to ~/.claude/
  `);
}

function info() {
  console.log(`
  UV Suite v0.1.0

  Contents:
    10 agents      Claude Code (.md), Cursor (.mdc), Codex (.toml)
    9  skills      Slash commands for Claude Code
    4  hooks       auto-lint, slop-check, danger-zone, block-destructive
    6  guardrails  Anti-slop rules (comment, overengineering, error, test, doc, architecture)
    4  personas    Spike, Sport, Professional, Auto
    1  launcher    uv.sh (session launcher with persona selection)

  Source: ${UV_SUITE_DIR}
  `);
}

function install() {
  const installScript = path.join(UV_SUITE_DIR, 'install.sh');
  if (!fs.existsSync(installScript)) {
    console.error('Error: install.sh not found at', installScript);
    process.exit(1);
  }

  // Pass through all args after "install"
  const installArgs = args.slice(1).join(' ');
  try {
    execSync(`bash "${installScript}" ${installArgs}`, { stdio: 'inherit' });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

switch (command) {
  case 'install':
    install();
    break;
  case 'info':
    info();
    break;
  case '--help':
  case '-h':
  case undefined:
    usage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    usage();
    process.exit(1);
}
