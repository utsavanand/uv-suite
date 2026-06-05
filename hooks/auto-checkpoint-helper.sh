#!/bin/bash
# UV Suite helper: read or change auto-checkpoint settings.
# Used by the /session auto slash command.
#
# Usage:
#   auto-checkpoint-helper.sh status
#   auto-checkpoint-helper.sh on
#   auto-checkpoint-helper.sh off
#   auto-checkpoint-helper.sh <minutes>     # set interval

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/auto-checkpoint.json"

ensure_state() {
  [ -f "$STATE_FILE" ] && return
  cat > "$STATE_FILE" <<'EOF'
{
  "mode": "on",
  "interval_minutes": 10
}
EOF
}

get_field() {
  ensure_state
  STATE_PATH="$STATE_FILE" KEY="$1" python3 -c '
import json, os
d = json.load(open(os.environ["STATE_PATH"]))
print(d.get(os.environ["KEY"], ""))
'
}

set_field() {
  ensure_state
  STATE_PATH="$STATE_FILE" KEY="$1" VAL="$2" python3 -c '
import json, os
p = os.environ["STATE_PATH"]
d = json.load(open(p))
key = os.environ["KEY"]
val = os.environ["VAL"]
if key == "interval_minutes":
    val = int(val)
d[key] = val
json.dump(d, open(p, "w"), indent=2)
'
}

ARG=$(printf '%s' "$1" | tr -d '[:space:]')

case "$ARG" in
  on)
    set_field mode on
    echo "Auto-checkpoint: ON (every $(get_field interval_minutes) min, mechanical + semantic)"
    ;;
  off)
    set_field mode off
    echo "Auto-checkpoint: OFF"
    ;;
  ""|status)
    ensure_state
    echo "Auto-checkpoint: $(get_field mode) (every $(get_field interval_minutes) min)"
    ;;
  *)
    if printf '%s' "$ARG" | grep -qE '^[0-9]+$' && [ "$ARG" -ge 1 ] && [ "$ARG" -le 1440 ]; then
      set_field interval_minutes "$ARG"
      echo "Auto-checkpoint interval: $ARG min (mode: $(get_field mode))"
    else
      echo "Usage: /session auto [on | off | <minutes 1-1440> | status]"
      exit 1
    fi
    ;;
esac
