#!/bin/bash
# UV Suite Hook: Session start — record start time, fire bootstrap event.
# Event: SessionStart

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
SESSIONS_DIR="$STATE_DIR/sessions"
mkdir -p "$SESSIONS_DIR"

# Per-cwd start timestamp (legacy — used by status-line for "today" totals)
date +%s > "$STATE_DIR/session-start.txt"

TODAY=$(date +%Y-%m-%d)
TODAY_FILE="$STATE_DIR/active-$TODAY.txt"
[ ! -f "$TODAY_FILE" ] && echo "0" > "$TODAY_FILE"

# Resolve UVS session id (set by uv.sh; fall back to current-session pointer)
SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi

# Build a bootstrap payload that includes session metadata so the dashboard
# learns about the session before any tool calls happen.
INPUT=$(cat 2>/dev/null)
[ -z "$INPUT" ] && INPUT='{}'

PAYLOAD=""
META_FILE=""
[ -n "$SID" ] && META_FILE="$SESSIONS_DIR/$SID.json"

# Refresh git worktree context into the session metadata at each launch (branch can
# change between sessions), so the Watchtower sees which worktree this session runs in.
GIT_JSON=$("${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/git-context.sh" "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null)
if [ -n "$META_FILE" ] && [ -f "$META_FILE" ] && [ -n "$GIT_JSON" ] && [ "$GIT_JSON" != "{}" ] && command -v jq >/dev/null 2>&1; then
  TMP=$(mktemp)
  if jq -s '.[0] * .[1]' "$META_FILE" <(printf '%s' "$GIT_JSON") > "$TMP" 2>/dev/null; then
    mv "$TMP" "$META_FILE"
  else
    rm -f "$TMP"
  fi
fi

if [ -n "$META_FILE" ] && [ -f "$META_FILE" ] && command -v jq >/dev/null 2>&1; then
  PAYLOAD=$(echo "$INPUT" | jq -c --slurpfile m "$META_FILE" '
    . + {
      uvs_session_id: ($m[0].uvs_session_id // ""),
      session_name:     ($m[0].name // ""),
      session_kind:     ($m[0].kind // ""),
      session_purpose:  ($m[0].purpose // ""),
      session_priority: ($m[0].priority // ""),
      persona:          ($m[0].persona // ""),
      git_worktree:           ($m[0].git_worktree // ""),
      git_branch:             ($m[0].git_branch // ""),
      git_main_repo:          ($m[0].git_main_repo // ""),
      git_is_linked_worktree: ($m[0].git_is_linked_worktree // false),
      cwd:              (.cwd // $m[0].cwd // "")
    }' 2>/dev/null)
fi

if [ -z "$PAYLOAD" ]; then
  PAYLOAD=$(printf '{"uvs_session_id":"%s","cwd":"%s"}' "$SID" "${CLAUDE_PROJECT_DIR:-.}")
fi

echo "$PAYLOAD" | "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/watchtower-send.sh" "SessionStart" 2>/dev/null

exit 0
