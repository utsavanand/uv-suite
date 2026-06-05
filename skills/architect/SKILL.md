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
  - Write(uv-out/*)
  - AskUserQuestion
  - Bash(git log *)
---

## Input

$ARGUMENTS

## Step 0 — Confirm the input spec (do this FIRST, before designing)

- If `$ARGUMENTS` names a spec file or describes the work, use it.
- Otherwise look in `uv-out/specs/`:
  - Exactly one spec → use it, no prompt.
  - More than one spec → ask the user with `AskUserQuestion` which spec to architect
    from. List them, default to the most recently modified.
  - No specs and no argument → ask the user to point you at a spec or describe the work.
    Do not invent requirements.
- Once the spec is chosen, read it **in full** with `Read` before designing — the preload
  below is truncated.

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Prior analysis

### Codebase map

!`cat uv-out/map-codebase.md 2>/dev/null | head -100 || echo "No codebase map — run /map-codebase first for better architecture context"`

### Spec (if written)

!`ls uv-out/specs/*.md 2>/dev/null | head -5 || echo "No specs found"`

!`cat $(ls -t uv-out/specs/*.md 2>/dev/null | head -1) 2>/dev/null | head -80 || echo ""`

### Session checkpoint

!`cat uv-out/checkpoints/latest.md 2>/dev/null | head -40 || echo "No checkpoint"`
