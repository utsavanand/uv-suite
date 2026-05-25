---
name: lite
description: >
  Toggle lite mode — instructs the assistant to be terse (no preamble,
  no summaries, no decorative formatting). Use when tokens are limited
  or you just want shorter answers. Persists across turns until disabled.
argument-hint: "[on | off | status]"
user-invocable: true
allowed-tools:
  - Write(*)
  - Read(*)
  - Bash(mkdir *)
  - Bash(ls *)
  - Bash(cat *)
---

## Argument

$ARGUMENTS

## Current state

!`ls .uv-suite-state/lite-mode.txt 2>/dev/null && cat .uv-suite-state/lite-mode.txt 2>/dev/null || echo "off (no state file)"`

## What to do

1. Ensure `.uv-suite-state/` exists (`mkdir -p .uv-suite-state`).
2. Parse `$ARGUMENTS` (lowercase, trim whitespace):
   - `on` — write `on` to `.uv-suite-state/lite-mode.txt`. Reply: `Lite mode: ON`.
   - `off` — write `off` to `.uv-suite-state/lite-mode.txt`. Reply: `Lite mode: OFF`.
   - `status` or empty — read the file (default `off` if missing) and reply with the current state.
   - Anything else — reply: `Usage: /lite [on | off | status]` and stop.
3. The change takes effect **on the next user prompt** (the `lite-mode-inject.sh` UserPromptSubmit hook reads the file each turn).

## How lite mode works

When ON, a UserPromptSubmit hook injects terseness instructions into the assistant's context every turn:

- No preamble or end-of-turn summaries
- No bullet lists or markdown headers unless asked
- No code comments unless asked
- Inline file:line citations, not section headers
- Skip pleasantries

Also activates if the `UVS_LITE=1` environment variable is set (useful for `UVS_LITE=1 uv claude pro` one-off sessions).
