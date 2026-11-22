#!/bin/bash
# UV Suite hook (skill kit): format a file after it was written.
# Event: after_tool, match write/edit. Formatter failures never block.
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool.input.path // empty')
[ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ] && exit 0
case "${FILE_PATH##*.}" in
  ts|tsx|js|jsx|mjs|cjs) command -v npx >/dev/null 2>&1 && npx prettier --write "$FILE_PATH" >/dev/null 2>&1 || true ;;
  py) if command -v ruff >/dev/null 2>&1; then ruff format "$FILE_PATH" >/dev/null 2>&1 || true
      elif command -v black >/dev/null 2>&1; then black --quiet "$FILE_PATH" >/dev/null 2>&1 || true; fi ;;
  go) command -v gofmt >/dev/null 2>&1 && gofmt -w "$FILE_PATH" >/dev/null 2>&1 || true ;;
  rs) command -v rustfmt >/dev/null 2>&1 && rustfmt "$FILE_PATH" >/dev/null 2>&1 || true ;;
esac
exit 0
