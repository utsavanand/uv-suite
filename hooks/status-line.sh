#!/bin/bash
# UV Suite Hook: Status line — show session duration and persona
# Event: statusLine (rendered continuously)

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
START_FILE="$STATE_DIR/session-start.txt"

# Session duration
if [ -f "$START_FILE" ]; then
  START=$(cat "$START_FILE")
  NOW=$(date +%s)
  ELAPSED=$((NOW - START))
  MINS=$((ELAPSED / 60))

  if [ "$MINS" -ge 180 ]; then
    SESSION="session ${MINS}m (!! take a break)"
  elif [ "$MINS" -ge 90 ]; then
    SESSION="session ${MINS}m (break soon)"
  elif [ "$MINS" -ge 45 ]; then
    SESSION="session ${MINS}m"
  else
    SESSION="session ${MINS}m"
  fi
else
  SESSION="session 0m"
fi

# Today's total active time
TODAY=$(date +%Y-%m-%d)
TODAY_FILE="$STATE_DIR/active-$TODAY.txt"
if [ -f "$TODAY_FILE" ]; then
  TODAY_TOTAL=$(cat "$TODAY_FILE")
  CURRENT_MINS=${MINS:-0}
  TODAY_NOW=$((TODAY_TOTAL + CURRENT_MINS))
  TODAY_STR=" · today ${TODAY_NOW}m"
else
  TODAY_STR=""
fi

# Persona from settings path (best-effort detection)
PERSONA=""
if [ -f "$CLAUDE_PROJECT_DIR/.claude/settings.local.json" ]; then
  PERSONA=$(grep -o '"effort"[^,]*' "$CLAUDE_PROJECT_DIR/.claude/settings.local.json" 2>/dev/null | head -1)
fi

echo "UV Suite · $SESSION$TODAY_STR"
