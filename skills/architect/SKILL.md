---
name: architect
description: >
  Design system architecture and decompose work into Acts with tasks, dependencies, and cycle budgets.
  Use after a spec is approved, before coding begins.
argument-hint: "[spec-file-or-description]"
user-invocable: true
context: fork
agent: architect
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(uv-out/**)
  - AskUserQuestion
  - Bash(git log *)
---

## Input

$ARGUMENTS

## Session output directory

Write architecture artifacts under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Step 0 — Confirm the input spec (do this FIRST, before designing)

- If `$ARGUMENTS` names a spec file or describes the work, use it.
- Otherwise consult the "Available specs" list below (current session first, then prior
  sessions, then legacy flat files):
  - A spec exists in the **current** session → use it, no prompt.
  - No current-session spec but one or more **prior** specs → ask the user with
    `AskUserQuestion` which to architect from. List them with their session + date,
    default to the newest.
  - No specs anywhere and no argument → ask the user to point you at a spec or describe
    the work. Do not invent requirements.
- Once the spec is chosen, read it **in full** with `Read` before designing.

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Available specs (current session first, then prior, then legacy)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-collect.sh 'specs/*.md' || echo "No specs found"`

## Prior analysis

### Codebase map (current session first)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-collect.sh 'map-codebase.md' || echo "No codebase map"`

### Session checkpoint

!`cat uv-out/current/checkpoints/latest.md 2>/dev/null | head -40 || echo "No checkpoint"`
