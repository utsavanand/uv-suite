#!/bin/bash
# UV Suite Hook: Session start — record start time
# Event: SessionStart

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
mkdir -p "$STATE_DIR"

# Record session start time
date +%s > "$STATE_DIR/session-start.txt"

# Track today's total active time
TODAY=$(date +%Y-%m-%d)
TODAY_FILE="$STATE_DIR/active-$TODAY.txt"
if [ ! -f "$TODAY_FILE" ]; then
  echo "0" > "$TODAY_FILE"
fi

# Send to watchtower
echo '{"session_id":"'$(cat "$STATE_DIR/session-start.txt")'","cwd":"'${CLAUDE_PROJECT_DIR:-.}'"}' | \
  "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/watchtower-send.sh" "SessionStart" 2>/dev/null

exit 0
