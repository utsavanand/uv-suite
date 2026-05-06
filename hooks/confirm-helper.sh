#!/bin/bash
# UV Suite helper: toggle confirm-mode or change the threshold.
# Used by the /confirm slash command. Extracted into a script so the
# slash command can avoid inline ${...} expansions, which Claude Code's
# permission heuristic flags as obfuscation.
#
# Usage:
#   confirm-helper.sh           # show status
#   confirm-helper.sh status
#   confirm-helper.sh on
#   confirm-helper.sh off
#   confirm-helper.sh <number>  # set threshold

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
mkdir -p "$STATE_DIR"
MODE_FILE="$STATE_DIR/confirm-mode.txt"
THRESH_FILE="$STATE_DIR/confirm-threshold.txt"

current_mode() { cat "$MODE_FILE" 2>/dev/null || echo "on"; }
current_thresh() { cat "$THRESH_FILE" 2>/dev/null || echo "50"; }

ARG=$(printf '%s' "$1" | tr -d '[:space:]')

case "$ARG" in
  on)
    echo "on" > "$MODE_FILE"
    echo "Confirm mode: ON (threshold: $(current_thresh) words)"
    ;;
  off)
    echo "off" > "$MODE_FILE"
    echo "Confirm mode: OFF"
    ;;
  ""|status)
    echo "Confirm mode: $(current_mode) (threshold: $(current_thresh) words)"
    ;;
  *)
    if printf '%s' "$ARG" | grep -qE '^[0-9]+$'; then
      echo "$ARG" > "$THRESH_FILE"
      echo "Threshold set to $ARG words (mode: $(current_mode))"
    else
      echo "Usage: /confirm [on | off | <number> | status]"
      exit 1
    fi
    ;;
esac
