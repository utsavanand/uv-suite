---
name: spec
description: >
  Convert requirements into a structured technical specification. Use when starting a new feature
  or receiving vague requirements.
argument-hint: "[requirements-description]"
user-invocable: true
context: fork
agent: spec-writer
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(uv-out/*)
  - AskUserQuestion
---

## Requirements

$ARGUMENTS

## Step 0 — Gather context (do this FIRST, before writing)

Ask the user with `AskUserQuestion` which existing files, modules, or docs the spec
should account for — related code, prior specs, API contracts, data models. Read every
file they name before drafting. If they say there are none (greenfield), proceed without.
Do not guess at relevant files; ask.

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Existing architecture

!`ls -la docs/architecture* 2>/dev/null || echo "No architecture docs found"`

## Today's date

!`date +%Y-%m-%d`
