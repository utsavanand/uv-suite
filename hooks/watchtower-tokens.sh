#!/bin/bash
# UV Suite Hook: report Claude Code token usage to Watchtower (Event: Stop).
# Parses the session transcript (transcript_path from the hook input), sums per-message
# token usage (input + cache + output), and POSTs the totals so the dashboard can show
# tokens used. Non-blocking; fails silently if Watchtower is down or there's no transcript.

INPUT=$(cat 2>/dev/null || true)
WATCHTOWER_URL="${UVS_WATCHTOWER_URL:-http://localhost:4200}"
STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"

SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi
[ -z "$SID" ] && exit 0

# Locate the transcript path inside the hook input.
TP=""
if command -v jq >/dev/null 2>&1; then
  TP=$(printf '%s' "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
fi
[ -z "$TP" ] && TP=$(printf '%s' "$INPUT" | grep -o '"transcript_path":"[^"]*"' | head -1 | cut -d'"' -f4)
{ [ -z "$TP" ] || [ ! -f "$TP" ]; } && exit 0

# Sum usage across assistant messages in the transcript (JSONL).
TOTALS=$(TP_VAL="$TP" python3 -c '
import json, os
inp = out = 0
try:
    with open(os.environ["TP_VAL"]) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            u = (o.get("message") or {}).get("usage") or o.get("usage") or {}
            if not isinstance(u, dict):
                continue
            inp += (u.get("input_tokens") or 0) \
                 + (u.get("cache_read_input_tokens") or 0) \
                 + (u.get("cache_creation_input_tokens") or 0)
            out += (u.get("output_tokens") or 0)
except Exception:
    pass
print(inp); print(out)
' 2>/dev/null)

IN=$(echo "$TOTALS" | sed -n 1p)
OUT=$(echo "$TOTALS" | sed -n 2p)
[ -z "$IN" ] && exit 0
[ "$IN" = "0" ] && [ "$OUT" = "0" ] && exit 0

curl -s -X POST "$WATCHTOWER_URL/sessions/$SID/tokens" \
  -H "Content-Type: application/json" \
  -d "{\"input_tokens\":$IN,\"output_tokens\":$OUT}" \
  &>/dev/null &

exit 0
