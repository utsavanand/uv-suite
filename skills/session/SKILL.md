---
name: session
description: >
  Manage the UV Suite session lifecycle: label it (init), save a checkpoint,
  restore a prior checkpoint, end it cleanly, or toggle auto-checkpoints.
  One skill, subcommand-routed. The automatic counterparts (PostToolUse
  auto-checkpoint, SessionStart auto-restore) remain hooks. Checkpoints are
  stored per-session under uv-out/sessions/<session-id>/checkpoints/, so
  concurrent terminals don't clobber each other.
argument-hint: "init|checkpoint|restore|end|auto [args]"
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
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
  - Bash(grep *)
  - Bash(find *)
  - Bash(*/.claude/hooks/session-meta.sh *)
  - Bash(*/.claude/hooks/checkpoint-helper.sh *)
  - Bash(*/.claude/hooks/session-end-helper.sh *)
  - Bash(*/.claude/hooks/auto-checkpoint-helper.sh *)
---

## Dispatch

The first word of `$ARGUMENTS` is the subcommand; the rest are its arguments. The
block below runs only the context-gathering for the chosen subcommand and prints a
`SUBCOMMAND=...` marker — follow the matching section under "Instructions".

```!
ARGS="$ARGUMENTS"; SUB=$(printf '%s' "$ARGS" | awk '{print $1}'); REST=$(printf '%s' "$ARGS" | sed 's/^[^ ]* *//'); [ "$REST" = "$SUB" ] && REST=""
H="$CLAUDE_PROJECT_DIR/.claude/hooks"
case "$SUB" in
  init)
    if [ -z "$REST" ] || [ "$REST" = show ]; then "$H/session-meta.sh" show
    elif [ "$REST" = clear ]; then "$H/session-meta.sh" clear
    else F=$(printf '%s' "$REST"|awk '{print $1}'); R2=$(printf '%s' "$REST"|sed 's/^[^ ]* *//')
      case "$F" in
        --kind) "$H/session-meta.sh" set-kind "$R2";;
        --priority) "$H/session-meta.sh" set-priority "$R2";;
        --purpose) "$H/session-meta.sh" set-purpose "$R2";;
        --name) "$H/session-meta.sh" set-name "$R2";;
        *) "$H/session-meta.sh" set-name "$REST";;
      esac
    fi; echo "SUBCOMMAND=init";;
  auto)
    "$H/auto-checkpoint-helper.sh" $REST; echo "SUBCOMMAND=auto";;
  restore)
    "$H/checkpoint-helper.sh" list; echo "---LATEST---"; "$H/checkpoint-helper.sh" latest; echo "SUBCOMMAND=restore REST=$REST";;
  checkpoint|end)
    "$H/checkpoint-helper.sh" dir; echo "---FRONTMATTER---"; "$H/checkpoint-helper.sh" frontmatter; echo "---META---"; "$H/checkpoint-helper.sh" meta
    echo "---GIT---"; git branch --show-current 2>/dev/null || echo "(not a git repo)"; git status --short 2>/dev/null | head -20; git log --oneline -5 2>/dev/null
    echo "SUBCOMMAND=$SUB REST=$REST";;
  *) echo "SUBCOMMAND=help (got: '$SUB')";;
esac
```

## Instructions

Read the `SUBCOMMAND=...` marker printed by the dispatch block above, then read
and follow the matching operation file:

- `init` → `skills/session/operations/init.md`
- `checkpoint` → `skills/session/operations/checkpoint.md`
- `restore` → `skills/session/operations/restore.md`
- `end` → `skills/session/operations/end.md`
- `auto` → `skills/session/operations/auto.md`

The operation file references the context the dispatch block already printed
above (helper output, checkpoint-dir, frontmatter, git state, session list).

### help / unknown
Tell the user the subcommands and their one-line usage:
- `/session init <name>|--kind|--priority|--purpose|show|clear` — label the session
- `/session checkpoint [label]` — save a checkpoint
- `/session restore [<id-prefix>|<name>|list]` — load a prior checkpoint
- `/session end [label]` — write the final checkpoint and terminate
- `/session auto on|off|<minutes>|status` — toggle automatic checkpoints
