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
  - Write(uv-out/**)
  - Grep(*)
  - Glob(*)
  - Bash(git diff *)
  - Bash(git log *)
---

## Target

$ARGUMENTS

## Session output directory

Write the slop report under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Changes to scan

!`git diff --cached --stat 2>/dev/null || git diff --stat 2>/dev/null || echo "No changes — scan target files directly"`

### Full diff

!`git diff --cached 2>/dev/null || git diff 2>/dev/null || echo ""`

## Prior analysis

### Architecture decisions (check code against stated rationale)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'architecture/decisions.md' 40 || echo "No architecture decisions found"`

### Recent review findings

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'review/state.md' 40 || echo "No prior review found"`
