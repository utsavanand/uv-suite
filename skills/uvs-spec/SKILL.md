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
  - Write(uv-out/**)
  - AskUserQuestion
---

## Requirements

$ARGUMENTS

## Session output directory

Write the spec under this directory (it is scoped to the current session, so artifacts
are attributable to the session that produced them):

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-session.sh`

## Step 0 — Gather context (do this FIRST, before writing)

The codebase map, prior specs, and decisions for this project are auto-loaded below (from
`uv-out/`). Read them first — they are the indexed view of the existing codebase. Then use
`AskUserQuestion` to ask the user only for what those don't cover: specific files, modules,
API contracts, or data models the spec must account for. Read every file they name before
drafting. Greenfield (no map, no relevant code) → proceed without. Don't guess at relevant
files — ground in the map or ask.

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Existing architecture

!`ls -la docs/architecture* 2>/dev/null || echo "No architecture docs found"`

## What we already know about this codebase (from uv-out)

Prior UV Suite artifacts for THIS project. Ground the spec in them — reference real modules
and patterns from the map, reuse existing conventions, and build on (don't re-spec) what's
already captured.

### Codebase map (architecture, domains, entry points)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-best.sh map-codebase.md 120 || echo "No codebase map — run /understand first for a grounded spec"`

### Stack map (if a multi-service system)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-best.sh map-stack.md 80 || echo "No stack map"`

### Prior specs (build on these; don't duplicate)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-best.sh 'specs/*.md' 80 || echo "No prior specs"`

### Architecture decisions

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-best.sh 'architecture/decisions.md' 60 || echo "No architecture decisions found"`

## Today's date

!`date +%Y-%m-%d`
