#!/bin/bash
# UV Suite Hook Helper: Send event to Watchtower server
# Called by other hooks. Non-blocking. Fails silently if server not running.
#
# Usage: echo "$INPUT" | .claude/hooks/watchtower-send.sh "EventType"

EVENT_TYPE="${1:-Unknown}"
INPUT=$(cat)
WATCHTOWER_URL="${UVS_WATCHTOWER_URL:-http://localhost:4200}"

# Extract useful fields from the hook input
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}' 2>/dev/null)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
SOURCE_APP=$(basename "$CWD" 2>/dev/null)

# Send to watchtower (non-blocking, fire-and-forget)
curl -s -X POST "$WATCHTOWER_URL/events" \
  -H "Content-Type: application/json" \
  -d "{\"event_type\":\"$EVENT_TYPE\",\"session_id\":\"$SESSION_ID\",\"source_app\":\"$SOURCE_APP\",\"tool_name\":\"$TOOL_NAME\",\"tool_input\":$TOOL_INPUT,\"cwd\":\"$CWD\"}" \
  &>/dev/null &

exit 0
