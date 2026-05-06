---
name: confirm
description: >
  Toggle confirm-mode (reframe-and-confirm long prompts) or change the word threshold.
  When confirm-mode is on and a user prompt exceeds the threshold, the assistant will
  restate the request and wait for confirmation before doing any work.
argument-hint: "[on|off|<number>|status]"
user-invocable: true
allowed-tools:
  - Bash("$CLAUDE_PROJECT_DIR"/.claude/hooks/confirm-helper.sh *)
---

## Apply /confirm $ARGUMENTS

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/confirm-helper.sh $ARGUMENTS`

## Instructions

Show the user the line of output above as the response — that line is the confirmation
that the toggle took effect. Do not add commentary. The change applies to the very
next user prompt; no restart needed.

## What this controls

- `on` / `off` — enable or disable the reframe-and-confirm behavior driven by
  `hooks/confirm-prompt.sh` on every UserPromptSubmit event.
- `<number>` — set the word-count threshold above which prompts trigger a confirmation
  step. Slash commands (`/foo ...`) are always exempt.
- `status` (or no argument) — print the current mode and threshold.

State lives in `.uv-suite-state/confirm-mode.txt` and `.uv-suite-state/confirm-threshold.txt`
under `$CLAUDE_PROJECT_DIR`. Defaults if missing: mode `on`, threshold `50`.
