#!/bin/bash
# UV Suite hook (skill kit): block dangerous shell commands.
# Event: before_tool, match shell. Reads the neutral payload DuckTerm's shim
# writes; exit 2 blocks, the reason goes to stderr.
INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool.input.command // empty')
[ -z "$COMMAND" ] && exit 0
if printf '%s' "$COMMAND" | grep -qEi "rm\s+-rf\s+/|rm\s+-rf\s+~|rm\s+-rf\s+\.\s*$"; then
  echo "Blocked: recursive delete of root, home, or current directory" >&2; exit 2
fi
if printf '%s' "$COMMAND" | grep -qEi "drop\s+(table|database)|truncate\s+table"; then
  echo "Blocked: destructive database operation — get human approval first" >&2; exit 2
fi
if printf '%s' "$COMMAND" | grep -qEi "git\s+push\s+.*--force.*\s+(main|master)"; then
  echo "Blocked: force push to main/master" >&2; exit 2
fi
if printf '%s' "$COMMAND" | grep -qEi "git\s+reset\s+--hard\s+origin"; then
  echo "Blocked: hard reset to origin — this discards local work" >&2; exit 2
fi
exit 0
