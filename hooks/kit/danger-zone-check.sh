#!/bin/bash
# UV Suite hook (skill kit): warn when a file in DANGER-ZONES.md is about to change.
# Event: before_tool, match write/edit. Never blocks; adds context through the
# neutral result {"decision":"allow","context":…}.
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool.input.path // empty')
ROOT=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
[ -z "$FILE_PATH" ] && exit 0
DANGER_FILE="${ROOT:-.}/DANGER-ZONES.md"
[ -f "$DANGER_FILE" ] || DANGER_FILE="DANGER-ZONES.md"
[ -f "$DANGER_FILE" ] || exit 0
BASENAME=$(basename "$FILE_PATH")
MATCH=$(grep -i -- "$BASENAME" "$DANGER_FILE" 2>/dev/null | head -3)
[ -z "$MATCH" ] && exit 0
jq -cn --arg m "$MATCH" '{decision: "allow", context: ("WARNING: this file is in a DANGER ZONE. Check DANGER-ZONES.md before proceeding. Relevant entry: " + $m + " Consider flagging this change to the human.")}'
exit 0
