---
name: checkpoint
description: >
  Save a checkpoint of the current session — what was done, key decisions, current state,
  and what's next. Use before ending a session, before /compact, or at any natural breakpoint.
  The next session auto-loads the latest checkpoint.
argument-hint: "[optional-label]"
user-invocable: true
allowed-tools:
  - Write(*)
  - Read(*)
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(date *)
  - Bash(ls *)
---

## Write a checkpoint to uv-out/checkpoints/

Create the directory `uv-out/checkpoints/` if it doesn't exist.

Write a file named `uv-out/checkpoints/YYYY-MM-DD-HHMM.md` (using the current timestamp).

Also write/overwrite **both**:
- `uv-out/checkpoints/latest.md` — the global "most recent checkpoint" pointer.
- `uv-out/checkpoints/latest-[branch].md` — the per-branch pointer, where `[branch]` is the current git branch (slashes replaced with `-`). Skip this one if not in a git repo.

Both pointers get the same content as the timestamped file. The per-branch pointer lets `/restore` find the right handoff when you switch between branches/worktrees.

## Label

$ARGUMENTS

If a label was provided, include it in the filename: `uv-out/checkpoints/YYYY-MM-DD-HHMM-[label].md`

## What to capture

Review the full conversation so far and write a structured checkpoint with these exact sections:

```markdown
# Checkpoint: [date] [time] [label if provided]

## What was accomplished
- [Bullet list of concrete things done this session]
- [Be specific: "Added webhook retry logic to PaymentService" not "worked on payments"]

## Key decisions made
- [Decision]: [Why] — [What was considered and rejected]
- [Only include decisions that affect future work]

## Current state
- Branch: [current git branch]
- Uncommitted changes: [yes/no, summary if yes]
- Tests: [passing/failing/not run]
- Blockers: [any unresolved issues]

## Files modified
- [List key files changed, not every file]

## What's next
- [Immediate next step — what the next session should start with]
- [Remaining tasks from the current Act/plan]

## Context the next session needs
- [Anything non-obvious that would be lost without this checkpoint]
- [Workarounds in place, temporary decisions, "this looks wrong but it's intentional because..."]
- [Environment setup notes if relevant]
```

## Git state to capture

!`git branch --show-current 2>/dev/null || echo "not a git repo"`

!`git status --short 2>/dev/null | head -20 || echo "no git"`

!`git log --oneline -5 2>/dev/null || echo "no git history"`

## Rules

- Be specific. "Worked on auth" is useless. "Added JWT refresh token rotation with 7-day expiry" is useful.
- Capture WHY decisions were made, not just what. The next session needs the rationale.
- Keep it under 80 lines. This isn't a novel — it's a handoff.
- Every checkpoint overwrites `latest.md` so the next session always finds the freshest state.
