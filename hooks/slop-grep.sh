#!/bin/bash
# UV Suite Hook: Fast deterministic slop check
# Event: PostToolUse (Edit|Write)
# Catches one mechanical pattern: .toBeTruthy() / .toBeDefined() in JS/TS
# test files. No LLM. Conservative on purpose — false positives erode trust.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Only check JS/TS test files
if ! echo "$FILE_PATH" | grep -qE "\.(test|spec)\.(ts|tsx|js|jsx)$"; then
  exit 0
fi

MATCH=$(grep -n "\.toBeTruthy()\|\.toBeDefined()" "$FILE_PATH" 2>/dev/null)
if [ -z "$MATCH" ]; then
  exit 0
fi

cat <<EOF
{
  "continue": true,
  "systemMessage": "Slop detected: weak assertion in $FILE_PATH:\n$MATCH\n\nTest specific values, not truthiness. See guardrails/test-slop.md."
}
EOF
exit 0
