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
  - Write(*)
  - Bash(git log *)
---

## Input

$ARGUMENTS

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`
