---
name: restore
description: >
  Restore the latest checkpoint from a previous session. Shows what was done,
  key decisions, current state, and what's next. Use at the start of a new session.
user-invocable: true
allowed-tools:
  - Read(*)
  - Bash(ls *)
  - Bash(cat *)
  - Bash(grep *)
  - Bash(git rev-parse *)
---

## Latest checkpoint

!`DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/uv-out/checkpoints"; if [ -f "$DIR/latest.md" ]; then cat "$DIR/latest.md"; else echo "No checkpoint found at $DIR. Run /checkpoint to create one."; fi`

## All checkpoints

!`DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/uv-out/checkpoints"; if [ -d "$DIR" ]; then matches=$(ls -la "$DIR"/ 2>/dev/null | grep '\.md$' | tail -10); if [ -n "$matches" ]; then echo "$matches"; else echo "No checkpoints in $DIR"; fi; else echo "No checkpoints directory at $DIR"; fi`

## Instructions

Read the checkpoint above. Summarize it to the user in 3-4 sentences: what was done, what's the current state, and what's next. Then ask: "Ready to pick up from here, or do you want to take a different direction?"
