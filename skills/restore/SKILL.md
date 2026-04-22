---
name: restore
description: >
  Restore a checkpoint from a previous session. With no argument, loads the
  checkpoint for the current git branch (or the global latest). Pass a label,
  branch name, or date fragment to pick a specific one. Use at session start.
argument-hint: "[label | branch | date-fragment]"
user-invocable: true
allowed-tools:
  - Read(*)
  - Bash(ls *)
  - Bash(git branch *)
---

## Argument

$ARGUMENTS

## Current git branch

!`git branch --show-current 2>/dev/null || echo ""`

## All checkpoints (most recent first)

!`ls -t uv-out/checkpoints/ 2>/dev/null | grep '\.md$' | head -20 || echo "No checkpoints directory"`

## How to pick the right file

Resolve in this order and read exactly one file with the `Read` tool:

1. **If `$ARGUMENTS` is non-empty:** find the newest file in `uv-out/checkpoints/` whose name contains the argument string (matches labels, branch names, or date fragments like `2026-04-21`). If none match, tell the user and stop.
2. **Else if the current branch (shown above) is non-empty:** read `uv-out/checkpoints/latest-[branch].md` — with slashes in the branch name replaced by `-`.
3. **Else:** read `uv-out/checkpoints/latest.md`.
4. If none of the above exist: tell the user "No checkpoint found. Run `/checkpoint` to create one." and stop.

## After reading

Summarize the checkpoint to the user in 3–4 sentences: what was done, current state, what's next. Name the file you loaded so the user knows which session you picked. Then ask: "Ready to pick up from here, or do you want to take a different direction?"
