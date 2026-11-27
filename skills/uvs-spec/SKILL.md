---
name: uvs-spec
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

This session's output folder is `uv-out/sessions/<id>/`, where `<id>` is the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset. Create it if it does not exist. Below, `<session-output-dir>` means this folder.

## Step 0 — Gather context (do this FIRST, before writing)

The codebase map, prior specs, and decisions for this project are the files named below (under
`uv-out/`). Read them first — they are the indexed view of the existing codebase. Then use
`AskUserQuestion` to ask the user only for what those don't cover: specific files, modules,
API contracts, or data models the spec must account for. Read every file they name before
drafting. Greenfield (no map, no relevant code) → proceed without. Don't guess at relevant
files — ground in the map or ask.

## Project context

Read `CLAUDE.md` or `AGENTS.md` at the project root, if present.

## Existing architecture

List `docs/architecture*` if present and read what is relevant.

## What we already know about this codebase (from uv-out)

Prior UV Suite artifacts for THIS project. Ground the spec in them — reference real modules
and patterns from the map, reuse existing conventions, and build on (don't re-spec) what's
already captured.

### Codebase map (architecture, domains, entry points)

Read the newest `uv-out/**/map-codebase.md` if there is one; its first 120 lines are enough to orient. If none: No codebase map — run /uvs-map-codebase first for a grounded spec.

### Stack map (if a multi-service system)

Read the newest `uv-out/**/map-stack.md` if there is one; its first 80 lines are enough to orient. If none: No stack map.

### Prior specs (build on these; don't duplicate)

Read the newest `uv-out/**/specs/*.md` if there is one; its first 80 lines are enough to orient. If none: No prior specs.

### Architecture decisions

Read the newest `uv-out/**/architecture/decisions.md` if there is one; its first 60 lines are enough to orient. If none: No architecture decisions found.

## Today's date

Use today's date.
