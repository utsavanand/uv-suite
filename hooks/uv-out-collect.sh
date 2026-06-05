#!/bin/bash
# UV Suite helper: list an artifact across sessions for "prefer current, allow prior".
# Usage: uv-out-collect.sh <relative-glob>      e.g.  specs/*.md   or   map-codebase.md
#
# Prints tab-separated lines, current session first, then other sessions
# (newest session first), then legacy flat uv-out/ files:
#   CURRENT  <session-name>  <YYYY-MM-DD>  <path>
#   PRIOR    <session-name>  <YYYY-MM-DD>  <path>
#   LEGACY   -               <YYYY-MM-DD>  <path>
# A skill shows these and asks the user which to use (default: the CURRENT one,
# else the newest PRIOR).

GLOB="$1"
[ -z "$GLOB" ] && exit 0

ROOT="${CLAUDE_PROJECT_DIR:-.}"
STATE_DIR="$ROOT/.uv-suite-state"
SESS_META="$STATE_DIR/sessions"

SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi

# Human label for a session id: its name from the meta json, else the short id.
label_for() {
  local sid="$1" meta="$SESS_META/$1.json" name=""
  if [ -f "$meta" ] && command -v jq >/dev/null 2>&1; then
    name=$(jq -r '.name // ""' "$meta" 2>/dev/null)
  fi
  [ -n "$name" ] && printf '%s' "$name" || printf '%s' "${sid:0:8}"
}

emit() { # kind  session-label  path
  [ -e "$3" ] || return 0
  local d
  d=$(date -r "$3" +%Y-%m-%d 2>/dev/null || echo "-")
  printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$d" "$3"
}

# Current session
if [ -n "$SID" ]; then
  for f in uv-out/sessions/"$SID"/$GLOB; do emit CURRENT "$(label_for "$SID")" "$f"; done
fi
# Other sessions, newest dir first
for d in $(ls -dt uv-out/sessions/*/ 2>/dev/null); do
  s=$(basename "$d")
  [ "$s" = "$SID" ] && continue
  for f in ${d}$GLOB; do emit PRIOR "$(label_for "$s")" "$f"; done
done
# Legacy flat layout (pre-session-scoping)
for f in uv-out/$GLOB; do emit LEGACY "-" "$f"; done
