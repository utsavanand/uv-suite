# checkpoint — save a checkpoint

Using the checkpoint-dir, frontmatter, and git state printed above, write
`<checkpoint-dir>/YYYY-MM-DD-HHMM.md` (current timestamp; append `-REST` to the
filename if `REST` is non-empty). The directory is per-session — two `uv`
launches in the same repo write to different folders, so checkpoints don't
collide. **Begin the file with the exact YAML frontmatter block printed above** —
`/uvs-session restore` parses these fields to pick the right checkpoint and display
session context. Also write/overwrite `<checkpoint-dir>/latest.md` with the same
content so the next session's restore finds the freshest state. Body (keep under
80 lines; frontmatter is required and not counted):

```markdown
# Checkpoint: [date] [time] [label if provided]

## What was accomplished
- [Concrete things done this session — files, commits, decisions]
- [Be specific: "Added webhook retry logic to PaymentService" not "worked on payments"]

## Key decisions made
- [Decision]: [Why] — [What was considered and rejected]
- [Only decisions that affect future work]

## Current state
- Branch: [current git branch]
- Uncommitted changes: [yes/no, summary if yes]
- Tests: [passing/failing/not run]
- Blockers: [any unresolved issues]

## Files modified
- [Key files changed, not every file]

## What's next
- [Immediate next step the next session should start with]
- [Remaining tasks from the current Act/plan]

## Context the next session needs
- [Non-obvious facts, workarounds, "this looks wrong but it's intentional because..."]
- [Environment setup notes if relevant]
```

Capture WHY decisions were made, not just what. "Worked on auth" is useless;
"Added JWT refresh token rotation with 7-day expiry" is useful.
