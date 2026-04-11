---
name: slop-check
description: >
  Detect AI-generated slop in code, tests, docs, and architecture.
  Run before merging any AI-generated changes.
argument-hint: "[file-or-directory]"
user-invocable: true
context: fork
agent: anti-slop-guard
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Bash(git diff *)
  - Bash(git log *)
---

## Target

$ARGUMENTS

## Changes to scan

!`git diff --cached --stat 2>/dev/null || git diff --stat 2>/dev/null || echo "No changes — scan target files directly"`

### Full diff

!`git diff --cached 2>/dev/null || git diff 2>/dev/null || echo ""`
