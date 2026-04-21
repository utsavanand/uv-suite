#!/bin/bash
# UV Suite Hook Helper: Send event to Watchtower server
# Called by other hooks or directly from persona hook config.
# Non-blocking. Fails silently if server not running.
#
# Usage from hook config:
#   "command": ".claude/hooks/watchtower-send.sh PostToolUse"
# The hook input JSON comes via stdin from Claude Code.

EVENT_TYPE="${1:-Unknown}"
INPUT=$(cat)
WATCHTOWER_URL="${UVS_WATCHTOWER_URL:-http://localhost:4200}"

# Forward the full hook input to the watchtower, adding event_type and source_app
# jq merges the original JSON with our extra fields
PAYLOAD=$(echo "$INPUT" | jq -c ". + {
  event_type: \"$EVENT_TYPE\",
  source_app: (.cwd // \"\" | split(\"/\") | last),
  _hook_ts: now
}" 2>/dev/null)

# Fallback if jq isn't available or fails
if [ -z "$PAYLOAD" ] || [ "$PAYLOAD" = "null" ]; then
  SESSION_ID=$(echo "$INPUT" | grep -o '"session_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)
  CWD=$(echo "$INPUT" | grep -o '"cwd":"[^"]*"' | head -1 | cut -d'"' -f4)
  SOURCE_APP=$(basename "$CWD" 2>/dev/null)
  PAYLOAD="{\"event_type\":\"$EVENT_TYPE\",\"session_id\":\"$SESSION_ID\",\"source_app\":\"$SOURCE_APP\",\"tool_name\":\"$TOOL_NAME\",\"cwd\":\"$CWD\"}"
fi

# Send to watchtower (non-blocking, fire-and-forget)
curl -s -X POST "$WATCHTOWER_URL/events" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  &>/dev/null &

exit 0
