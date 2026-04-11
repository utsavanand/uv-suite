---
name: review
description: >
  Code review for correctness, security, performance, maintainability, and AI slop.
  Use before merging or as self-review.
argument-hint: "[file-or-branch]"
user-invocable: true
context: fork
agent: reviewer
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git show *)
---

## Changes to review

!`git diff --cached --stat 2>/dev/null || git diff --stat 2>/dev/null || echo "No staged or unstaged changes found"`

### Full diff

!`git diff --cached 2>/dev/null || git diff 2>/dev/null || echo "No diff available"`

## Additional target

$ARGUMENTS

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Danger zones

!`cat DANGER-ZONES.md 2>/dev/null || echo "No DANGER-ZONES.md found"`
