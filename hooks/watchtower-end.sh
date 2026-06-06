#!/bin/bash
# UV Suite Hook: tell Watchtower the session has ended (Event: SessionEnd).
# POSTs state=terminated so the dashboard stops showing it as active when the
# user exits the session directly (rather than via the dashboard Close button).
# Non-blocking; fails silently if Watchtower isn't running.

cat >/dev/null  # drain stdin

WATCHTOWER_URL="${UVS_WATCHTOWER_URL:-http://localhost:4200}"
STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"

SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi
[ -z "$SID" ] && exit 0

curl -s -X POST "$WATCHTOWER_URL/sessions/$SID/state" \
  -H "Content-Type: application/json" \
  -d '{"state":"terminated"}' \
  &>/dev/null &

exit 0
