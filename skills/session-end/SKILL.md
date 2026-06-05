---
name: session-end
description: >
  Cleanly close the current UV Suite session: write a final manual checkpoint
  (full conversation context), then mark the session as terminated so the
  Watchtower dashboard flips its lifecycle badge to Terminated. Use before
  closing the terminal when you want a deliberate end-of-session beat.
argument-hint: "[optional-label]"
user-invocable: true
allowed-tools:
  - Write(*)
  - Read(*)
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git branch *)
  - Bash(git rev-parse *)
  - Bash(date *)
  - Bash(ls *)
  - Bash(mkdir *)
  - Bash(cat *)
  - Bash(echo *)
  - Bash(*/.claude/hooks/checkpoint-helper.sh *)
  - Bash(*/.claude/hooks/session-end-helper.sh *)
---

## Resolve checkpoint directory + session metadata

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/checkpoint-helper.sh dir`

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/checkpoint-helper.sh frontmatter`

## Git state

!`git branch --show-current 2>/dev/null || echo "(not a git repo)"`

!`git status --short 2>/dev/null | head -20 || echo "(no git)"`

!`git log --oneline -5 2>/dev/null || echo "(no git history)"`

## Step 1 — Write the final checkpoint

Write a file at `<checkpoint-dir>/final-YYYY-MM-DD-HHMM.md` using the current
timestamp. **Override** the frontmatter line `checkpoint_kind: auto-mechanical`
to read `checkpoint_kind: final-manual` so it's distinguishable from the
auto-checkpoints. Also write/overwrite `<checkpoint-dir>/latest.md` with the
same content so `/restore` picks it up.

If a label was provided, include it in the filename:
`<checkpoint-dir>/final-YYYY-MM-DD-HHMM-[label].md`

### Label

$ARGUMENTS

### Body structure (after the frontmatter)

```markdown
# Final checkpoint: [date] [time] [label if provided]

## What was accomplished
- Concrete things done across the whole session — files, commits, decisions
- One bullet per significant artifact; don't pad

## Key decisions made
- Decision: Why — what was considered, what was rejected

## Current state
- Branch / uncommitted changes / tests status / blockers

## Open threads
- Anything left in flight that the next session needs to pick up
- Pending reviews, awaiting input, deferred work

## Context the next session needs
- Non-obvious facts, workarounds, "this looks wrong but it's intentional because…"
```

Be specific. This is the last record before the session closes — anything
not written here is lost unless it's in code or the auto-checkpoints.

## Step 2 — Mark the session terminated

Once the file is written, run:

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-end-helper.sh`

Show the user the two-line output. Don't add commentary — the file write
and the termination signal together speak for themselves.

## Notes

- `/session-end` does **not** close the terminal or exit Claude Code. After
  it runs, the badge flips to Terminated in the Watchtower; the user
  closes the terminal manually.
- The final checkpoint uses the live session's full conversation context —
  higher fidelity than the auto-checkpoint summaries because Claude has
  everything in working memory at this moment.
- If you only want to terminate without a checkpoint, run
  `hooks/session-end-helper.sh` directly from bash and skip this skill.
