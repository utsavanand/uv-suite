---
name: restore
description: >
  Restore the latest checkpoint from a previous session. Shows what was done,
  key decisions, current state, and what's next. Use at the start of a new session.
user-invocable: true
allowed-tools:
  - Read(*)
  - Bash(ls *)
---

## Latest checkpoint

!`cat uv-out/checkpoints/latest.md 2>/dev/null || echo "No checkpoint found. Run /checkpoint to create one."`

## All checkpoints

!`ls -la uv-out/checkpoints/*.md 2>/dev/null | tail -10 || echo "No checkpoints directory"`

## Instructions

Read the checkpoint above. Summarize it to the user in 3-4 sentences: what was done, what's the current state, and what's next. Then ask: "Ready to pick up from here, or do you want to take a different direction?"
