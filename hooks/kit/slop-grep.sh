#!/bin/bash
# UV Suite hook (skill kit): one mechanical slop check, no model.
# Event: after_tool, match write/edit. Flags .toBeTruthy()/.toBeDefined() in JS/TS tests.
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool.input.path // empty')
[ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ] && exit 0
printf '%s' "$FILE_PATH" | grep -qE "\.(test|spec)\.(ts|tsx|js|jsx)$" || exit 0
MATCH=$(grep -n "\.toBeTruthy()\|\.toBeDefined()" "$FILE_PATH" 2>/dev/null | head -5)
[ -z "$MATCH" ] && exit 0
jq -cn --arg f "$FILE_PATH" --arg m "$MATCH" '{decision: "allow", context: ("Slop detected: weak assertion in " + $f + ": " + $m + " Test specific values, not truthiness (guardrails/test-slop.md).")}'
exit 0
