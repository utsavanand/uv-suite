#!/bin/bash
# UV Suite Hook: Tier A auto-checkpoint — mechanical state snapshot.
# Event: PostToolUse
#
# Logs every tool call into a per-session activity log. When `interval_minutes`
# have passed since the last mechanical checkpoint AND there has been activity
# in the interval, writes a deterministic snapshot to
# uv-out/sessions/<sid>/checkpoints/auto-<ts>-mechanical.md and forwards an
# AutoCheckpoint event to the watchtower.
#
# Tier B (semantic, claude -p) runs separately from the watchtower's timer.

INPUT=$(cat 2>/dev/null || true)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STATE_DIR="$PROJECT_DIR/.uv-suite-state"
SESSIONS_DIR="$STATE_DIR/sessions"
mkdir -p "$SESSIONS_DIR" 2>/dev/null

STATE_FILE="$STATE_DIR/auto-checkpoint.json"

# Default state if missing
if [ ! -f "$STATE_FILE" ]; then
  cat > "$STATE_FILE" <<'EOF'
{
  "mode": "on",
  "interval_minutes": 10
}
EOF
fi

# Read mode + interval (skip if mode != on)
read_state() {
  STATE_PATH="$STATE_FILE" python3 -c '
import json, os, sys
try:
    d = json.load(open(os.environ["STATE_PATH"]))
    print(d.get("mode", "on"))
    print(d.get("interval_minutes", 10))
except Exception:
    print("on"); print("10")
' 2>/dev/null
}

STATE_OUT=$(read_state)
MODE=$(echo "$STATE_OUT" | sed -n 1p)
INTERVAL_MIN=$(echo "$STATE_OUT" | sed -n 2p)
[ "$MODE" != "on" ] && exit 0
[ -z "$INTERVAL_MIN" ] && INTERVAL_MIN=10

# Resolve session id
SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi
[ -z "$SID" ] && exit 0

ACTIVITY_LOG="$SESSIONS_DIR/$SID.activity.log"
LAST_CP_FILE="$SESSIONS_DIR/$SID.last-mechanical-checkpoint.txt"
NOW=$(date +%s)

# Append activity entry. Cap log at last 500 lines.
TOOL=""
TARGET=""
if command -v jq >/dev/null 2>&1; then
  TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
  TARGET=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // .tool_input.pattern // .tool_input.url // ""' 2>/dev/null)
fi
TARGET=$(printf '%s' "$TARGET" | tr -d '\n' | cut -c1-120)
[ -n "$TOOL" ] && echo "$NOW $TOOL $TARGET" >> "$ACTIVITY_LOG"
if [ -f "$ACTIVITY_LOG" ]; then
  LINES=$(wc -l < "$ACTIVITY_LOG" 2>/dev/null | tr -d ' ')
  if [ -n "$LINES" ] && [ "$LINES" -gt 500 ]; then
    tail -n 500 "$ACTIVITY_LOG" > "$ACTIVITY_LOG.tmp" && mv "$ACTIVITY_LOG.tmp" "$ACTIVITY_LOG"
  fi
fi

# Has the interval passed since last mechanical checkpoint?
# On the very first run, seed the timestamp with NOW so we don't fire a
# checkpoint immediately — the first one fires after the interval has elapsed.
if [ ! -f "$LAST_CP_FILE" ]; then
  echo "$NOW" > "$LAST_CP_FILE"
  exit 0
fi
LAST_CP=$(cat "$LAST_CP_FILE" 2>/dev/null)
LAST_CP=${LAST_CP:-0}
ELAPSED=$((NOW - LAST_CP))
INTERVAL_SEC=$((INTERVAL_MIN * 60))
[ "$ELAPSED" -lt "$INTERVAL_SEC" ] && exit 0

# Activity since last checkpoint? If none, skip.
SINCE_LINES=0
if [ -f "$ACTIVITY_LOG" ]; then
  SINCE_LINES=$(awk -v cutoff="$LAST_CP" '$1 > cutoff' "$ACTIVITY_LOG" 2>/dev/null | wc -l | tr -d ' ')
fi
[ "${SINCE_LINES:-0}" -lt 1 ] && exit 0

# Resolve checkpoint dir + metadata via the existing helper
CP_DIR=$(CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$PROJECT_DIR/.claude/hooks/checkpoint-helper.sh" dir 2>/dev/null)
[ -z "$CP_DIR" ] && CP_DIR="$PROJECT_DIR/uv-out/sessions/$SID/checkpoints" && mkdir -p "$CP_DIR"

# Build the mechanical checkpoint body
TS_FILE=$(date +%Y-%m-%d-%H%M)
TS_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CP_FILE="$CP_DIR/auto-$TS_FILE-mechanical.md"

# Frontmatter from helper, augmented with checkpoint_kind
FRONT=$(CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$PROJECT_DIR/.claude/hooks/checkpoint-helper.sh" frontmatter 2>/dev/null)
# Insert checkpoint_kind: auto-mechanical before closing ---
FRONT=$(printf '%s' "$FRONT" | awk '
  /^---$/ { count++ }
  count == 2 && !done { print "checkpoint_kind: auto-mechanical"; done=1 }
  { print }
')

# Activity summary from the log
ACTIVITY_SUMMARY=$(awk -v cutoff="$LAST_CP" '$1 > cutoff' "$ACTIVITY_LOG" 2>/dev/null | python3 -c '
import sys, collections, os
lines = [l.strip() for l in sys.stdin if l.strip()]
tools = collections.Counter()
files = collections.Counter()
for ln in lines:
    parts = ln.split(" ", 2)
    if len(parts) < 2: continue
    tool = parts[1]
    target = parts[2] if len(parts) > 2 else ""
    tools[tool] += 1
    if target and tool in ("Edit", "Write", "Read"):
        files[target] += 1
print("### Tool calls")
for t, n in tools.most_common(8):
    print(f"- {n}× {t}")
if files:
    print("\n### Files touched")
    for f, n in files.most_common(8):
        print(f"- {f} ({n})")
print(f"\n_total tool calls in window: {sum(tools.values())}_")
' 2>/dev/null)

# Git state (best-effort, may be absent in non-git dirs)
GIT_BRANCH=$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null)
GIT_STATUS=$(cd "$PROJECT_DIR" && git status --short 2>/dev/null | head -20)
GIT_LOG=$(cd "$PROJECT_DIR" && git log --oneline -5 2>/dev/null)

{
  printf '%s\n\n' "$FRONT"
  printf '# Auto-checkpoint (mechanical): %s\n\n' "$TS_ISO"
  printf '_window: last %s min, %s tool calls_\n\n' "$INTERVAL_MIN" "$SINCE_LINES"
  printf '## Activity\n\n%s\n\n' "$ACTIVITY_SUMMARY"
  if [ -n "$GIT_BRANCH" ]; then
    printf '## Git\n\n'
    printf '**Branch:** %s\n\n' "$GIT_BRANCH"
    if [ -n "$GIT_STATUS" ]; then
      printf '**Status:**\n```\n%s\n```\n\n' "$GIT_STATUS"
    else
      printf '**Status:** clean\n\n'
    fi
    if [ -n "$GIT_LOG" ]; then
      printf '**Recent commits:**\n```\n%s\n```\n' "$GIT_LOG"
    fi
  fi
} > "$CP_FILE"

# Update latest.md so /session restore picks it up
cp "$CP_FILE" "$CP_DIR/latest.md" 2>/dev/null
echo "$NOW" > "$LAST_CP_FILE"

# Send AutoCheckpoint event to watchtower with inline content
if [ -x "$PROJECT_DIR/.claude/hooks/watchtower-send.sh" ]; then
  PREVIEW=$(head -c 2000 "$CP_FILE")
  PAYLOAD=$(PREVIEW_PATH="$CP_FILE" PREVIEW="$PREVIEW" INTERVAL_MIN="$INTERVAL_MIN" SINCE_LINES="$SINCE_LINES" CWD_VAR="$PROJECT_DIR" python3 -c '
import json, os
print(json.dumps({
    "checkpoint_kind": "auto-mechanical",
    "checkpoint_path": os.environ["PREVIEW_PATH"],
    "checkpoint_preview": os.environ["PREVIEW"],
    "interval_minutes": int(os.environ["INTERVAL_MIN"]),
    "tool_calls_in_window": int(os.environ["SINCE_LINES"]),
    "cwd": os.environ["CWD_VAR"],
}))
' 2>/dev/null)
  printf '%s' "$PAYLOAD" | CLAUDE_PROJECT_DIR="$PROJECT_DIR" "$PROJECT_DIR/.claude/hooks/watchtower-send.sh" AutoCheckpoint 2>/dev/null
fi

exit 0
