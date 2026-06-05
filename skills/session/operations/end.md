# end — close the session cleanly

1. Write a final checkpoint exactly like `checkpoint` above, but name it
   `<checkpoint-dir>/final-YYYY-MM-DD-HHMM.md` (append `-REST` to the filename if
   given) and **override** the frontmatter line
   `checkpoint_kind: auto-mechanical` to read `checkpoint_kind: final-manual` so
   it's distinguishable from the auto-checkpoints. Also write/overwrite
   `<checkpoint-dir>/latest.md` with the same content so `/session restore` picks
   it up. Use the live conversation context — this is the highest-fidelity record
   before the session closes; anything not written here is lost unless it's in
   code or the auto-checkpoints. Final-checkpoint body structure:

   ```markdown
   # Final checkpoint: [date] [time] [label if provided]

   ## What was accomplished
   - Concrete things done across the whole session — files, commits, decisions

   ## Key decisions made
   - Decision: Why — what was considered, what was rejected

   ## Current state
   - Branch / uncommitted changes / tests status / blockers

   ## Open threads
   - Anything left in flight that the next session needs to pick up

   ## Context the next session needs
   - Non-obvious facts, workarounds, "this looks wrong but it's intentional because…"
   ```

2. Then run `"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-end-helper.sh` (via
   Bash) to mark the session terminated and flip the Watchtower badge to
   Terminated. Show the user the two-line output; don't add commentary. This does
   **not** close the terminal or exit Claude Code — the user does that.
