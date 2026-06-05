#!/bin/bash
# UV Suite helper: resolve (and create) the current session's uv-out output dir.
# Prints the dir path (CWD-relative) on stdout so skills can namespace artifacts
# by session — you can tell which session produced which artifact.
#
# Session id resolution mirrors session-start.sh:
#   UVS_SESSION_ID env (set by uv.sh) → .uv-suite-state/current-session.txt → "no-session"

ROOT="${CLAUDE_PROJECT_DIR:-.}"
STATE_DIR="$ROOT/.uv-suite-state"

SID="${UVS_SESSION_ID:-}"
if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
  SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
fi
[ -z "$SID" ] && SID="no-session"

OUT="uv-out/sessions/$SID"
mkdir -p "$OUT"

# Convenience pointer to the active session's output (symlink; ignore failure).
ln -sfn "sessions/$SID" "uv-out/current" 2>/dev/null || true

printf '%s\n' "$OUT"
