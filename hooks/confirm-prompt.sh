#!/bin/bash
# UV Suite Hook: Reframe-and-confirm long user prompts before acting.
#
# Reads state from $CLAUDE_PROJECT_DIR/.uv-suite-state/. When mode is "on" and
# the user's prompt exceeds the configured word count, injects a system-context
# instruction that tells Claude to restate the request and wait for confirmation
# before doing any work.
#
# State files (toggled by the /confirm slash command):
#   confirm-mode.txt       — "on" or "off"   (default: on)
#   confirm-threshold.txt  — integer         (default: 50)
#
# Slash commands (lines starting with "/") are always skipped so the toggle
# itself can run without being intercepted.

INPUT=$(cat)
STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"

MODE=$(cat "$STATE_DIR/confirm-mode.txt" 2>/dev/null)
[ -z "$MODE" ] && MODE="on"

THRESHOLD=$(cat "$STATE_DIR/confirm-threshold.txt" 2>/dev/null)
[ -z "$THRESHOLD" ] && THRESHOLD=50

[ "$MODE" = "off" ] && exit 0

if command -v jq >/dev/null 2>&1; then
  PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)
else
  PROMPT=$(echo "$INPUT" | grep -o '"prompt":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

[ -z "$PROMPT" ] && exit 0

case "$PROMPT" in
  /*) exit 0 ;;
esac

WORDS=$(echo "$PROMPT" | wc -w | tr -d ' ')
[ "$WORDS" -le "$THRESHOLD" ] && exit 0

# Emit Claude Code hook output. additionalContext is appended to the system
# context for this turn. Keep it terse — long instructions get tuned out.
ADDITIONAL=$(printf '[uv-suite confirm-mode] The user prompt is %s words (threshold %s). Before doing any work or making tool calls, restate what you understood in 1-2 plain sentences and ask the user to confirm. Only proceed once they confirm. The user can disable this with /confirm off or change the threshold with /confirm <number>.' "$WORDS" "$THRESHOLD")

if command -v jq >/dev/null 2>&1; then
  jq -nc --arg ctx "$ADDITIONAL" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$ctx}}'
else
  ESCAPED=$(printf '%s' "$ADDITIONAL" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"%s"}}' "$ESCAPED"
fi
