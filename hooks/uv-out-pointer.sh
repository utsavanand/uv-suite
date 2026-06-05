#!/bin/bash
# UV Suite helper: maintain a stable flat pointer into the current session's output.
# Fixed-path consumers (/commit, /ship read uv-out/review-state.md and uv-out/qa-state.md)
# keep working while the real artifact lives under uv-out/sessions/<sid>/.
#
# Usage: uv-out-pointer.sh <flat-name> <session-relative-target>
#   e.g. uv-out-pointer.sh review-state.md review/state.md
# Creates  uv-out/<flat-name>  ->  current/<session-relative-target>
# (uv-out/current is the symlink to sessions/<sid>/ maintained by uv-out-session.sh).

FLAT="$1"; TARGET="$2"
[ -z "$FLAT" ] || [ -z "$TARGET" ] && exit 0

mkdir -p uv-out
ln -sfn "current/$TARGET" "uv-out/$FLAT" 2>/dev/null || true
printf 'uv-out/%s -> current/%s\n' "$FLAT" "$TARGET"
