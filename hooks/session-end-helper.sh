#!/bin/bash
# UV Suite helper: explicit session termination.
# Used by the /session end slash command.
#
# Writes a "terminated_at" timestamp to the session metadata, fires a
# SessionEnd event to the Watchtower so the dashboard updates the status
# badge, and prints a one-line confirmation.

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
SESSIONS_DIR="$STATE_DIR/sessions"
mkdir -p "$SESSIONS_DIR"

SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi

if [ -z "$SID" ]; then
  echo "No active UV Suite session to end."
  exit 1
fi

META="$SESSIONS_DIR/$SID.json"
NOW=$(date +%s)
NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if [ -f "$META" ]; then
  META_PATH="$META" NOW_VAL="$NOW" NOW_ISO_VAL="$NOW_ISO" python3 - <<'PY'
import json, os
p = os.environ["META_PATH"]
d = json.load(open(p))
d["terminated_at"] = int(os.environ["NOW_VAL"])
d["terminated_at_iso"] = os.environ["NOW_ISO_VAL"]
d["lifecycle"] = "terminated"
json.dump(d, open(p, "w"), indent=2)
PY
fi

# Fire SessionEnd event so the dashboard flips the status badge to Terminated.
if [ -x "$CLAUDE_PROJECT_DIR/.claude/hooks/watchtower-send.sh" ]; then
  PAYLOAD=$(SID_VAL="$SID" NOW_VAL="$NOW" CWD_VAL="${CLAUDE_PROJECT_DIR:-$(pwd)}" python3 -c '
import json, os
print(json.dumps({
    "uvs_session_id": os.environ["SID_VAL"],
    "session_id": os.environ["SID_VAL"],
    "cwd": os.environ["CWD_VAL"],
    "lifecycle": "terminated",
    "terminated_at": int(os.environ["NOW_VAL"]),
    "terminated_by": "user",
}))
')
  printf '%s' "$PAYLOAD" | "$CLAUDE_PROJECT_DIR/.claude/hooks/watchtower-send.sh" SessionEnd 2>/dev/null
fi

echo "Session ${SID:0:8} marked terminated at $NOW_ISO."
echo "Run /session checkpoint first if you want a final state snapshot, then exit the terminal."
