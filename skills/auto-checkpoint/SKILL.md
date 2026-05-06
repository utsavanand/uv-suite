---
name: auto-checkpoint
description: >
  Toggle automatic checkpoints, or change how often they fire. When on,
  UV Suite writes a checkpoint every N minutes (default 10): a mechanical
  state snapshot from the PostToolUse hook, plus a semantic summary written
  by Claude (via `claude -p --bare --model haiku`) from the Watchtower's
  timer. Sessions with no activity in the window are skipped.
argument-hint: "[on|off|<minutes>|status]"
user-invocable: true
allowed-tools:
  - Bash("$CLAUDE_PROJECT_DIR"/.claude/hooks/auto-checkpoint-helper.sh *)
---

## Apply /auto-checkpoint $ARGUMENTS

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/auto-checkpoint-helper.sh $ARGUMENTS`

## Instructions

Show the user the line of output above as the response — it confirms what
changed. Do not add commentary. The change applies to the very next interval;
no restart needed.

## What this controls

- `on` / `off` — enable or disable both tiers (mechanical + semantic).
- `<minutes>` — set the checkpoint interval (1-1440). Default 10.
- `status` (or no argument) — print the current mode and interval.

## How it works

- **Tier A (mechanical):** the `auto-checkpoint.sh` hook runs after each tool
  call. When the interval has passed and there's been activity since the last
  checkpoint, it writes a deterministic snapshot — git state, recent tool calls,
  files touched — to `uv-out/checkpoints/<sid>/auto-<ts>-mechanical.md`.
- **Tier B (semantic):** the Watchtower process (`uvs watch`) keeps a timer.
  Every N minutes, for each active session, it shells out to `claude -p --bare
  --model haiku` with a prompt assembled from the recent dashboard events and
  git state. Output is saved next to the mechanical checkpoint as
  `auto-<ts>-semantic.md`. Cap: `--max-budget-usd 0.05` per call.
- Both tiers fire `AutoCheckpoint` events to the Watchtower so they show up as
  distinct rows on the dashboard.
- Sessions with zero activity in the interval are skipped — no empty checkpoints.

State lives in `.uv-suite-state/auto-checkpoint.json` (mode + interval) and
`.uv-suite-state/sessions/<sid>.last-{mechanical,semantic}-checkpoint.txt`.
