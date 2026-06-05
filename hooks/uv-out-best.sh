#!/bin/bash
# UV Suite helper: print the content of the best-matching artifact across sessions —
# current session, else newest prior session, else legacy flat. A session-aware
# drop-in for `cat uv-out/<X>` in skill preloads.
#
# Usage: uv-out-best.sh <relative-glob> [headLines]
#   e.g. uv-out-best.sh map-codebase.md 100

GLOB="$1"; HEAD="${2:-0}"
[ -z "$GLOB" ] && exit 1

# uv-out-collect.sh ranks current -> prior -> legacy; take the first path (field 4).
FIRST=$("$(dirname "$0")/uv-out-collect.sh" "$GLOB" 2>/dev/null | head -1 | cut -f4)
[ -z "$FIRST" ] || [ ! -f "$FIRST" ] && exit 1

if [ "$HEAD" -gt 0 ] 2>/dev/null; then
  head -n "$HEAD" "$FIRST"
else
  cat "$FIRST"
fi
