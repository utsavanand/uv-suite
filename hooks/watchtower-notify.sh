#!/bin/bash
# UV Suite Hook Helper: Notify Watchtower of an approval request.
# Fires on the Notification hook event (e.g. Claude is waiting for the user
# to approve a tool call). Non-blocking. Fails silently if server not running.
#
# Usage from hook config (Notification event):
#   "command": ".claude/hooks/watchtower-notify.sh"
# Hook input JSON arrives via stdin from Claude Code.

INPUT=$(cat)
WATCHTOWER_URL="${UVS_WATCHTOWER_URL:-http://localhost:4200}"

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"

# Resolve UVS session id: env first, then current-session pointer
SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi

PAYLOAD=""
if command -v jq >/dev/null 2>&1; then
  PAYLOAD=$(echo "$INPUT" | jq -c --arg sid "$SID" '
    {
      session_id: $sid,
      tool_name: (.tool_name // ""),
      command:   (.tool_input.command // .message // ""),
      request:   .
    }' 2>/dev/null)
fi

# Fallback when jq is missing or produced nothing usable
if [ -z "$PAYLOAD" ] || [ "$PAYLOAD" = "null" ]; then
  TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)
  PAYLOAD=$(printf '{"session_id":"%s","tool_name":"%s","command":"","request":%s}' \
    "$SID" "$TOOL_NAME" "$INPUT")
fi

curl -s -X POST "$WATCHTOWER_URL/approvals" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --max-time 2 \
  &>/dev/null &

exit 0
