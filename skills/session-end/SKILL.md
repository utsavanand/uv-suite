---
name: session-end
description: >
  Explicitly mark the current UV Suite session as terminated. Writes a
  `terminated_at` stamp to the session metadata and fires a SessionEnd event
  so the Watchtower dashboard flips the status badge from Active/Idle to
  Terminated. Use this before closing the terminal when you want a clean
  end-of-session signal — distinct from the Claude Code Stop event, which
  may not fire on every kind of exit.
argument-hint: ""
user-invocable: true
allowed-tools:
  - Bash("$CLAUDE_PROJECT_DIR"/.claude/hooks/session-end-helper.sh *)
---

## Apply /session-end

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-end-helper.sh`

## Instructions

Show the user the two-line output above as the response. Don't add commentary.

If the user hasn't already run `/checkpoint` in this session, suggest they do
so now before exiting — `/session-end` records the lifecycle state but does
not capture a content snapshot by itself. The auto-checkpoints in
`uv-out/checkpoints/<sid>/` cover most of this, but a final manual
`/checkpoint` lets you write down anything not captured in tool calls.

## What this controls

- Writes `terminated_at` (epoch seconds) and `terminated_at_iso` (ISO 8601)
  to `.uv-suite-state/sessions/<sid>.json`, plus `lifecycle: terminated`.
- Fires a `SessionEnd` event to the Watchtower with `lifecycle: terminated`
  and `terminated_by: user`.
- Does not exit the Claude Code session — you still need to close the
  terminal or `:q` yourself. This command just records the intent.
