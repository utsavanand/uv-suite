#!/bin/bash
# UV Suite hook (skill kit): vague adjectives and buzzwords in docs, no model.
# Event: after_tool, match write (spike persona).
INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool.input.path // empty')
[ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ] && exit 0
case "${FILE_PATH##*.}" in md|txt|rst|adoc) ;; *) exit 0 ;; esac
FINDINGS=""
M=$(grep -in "robust\|scalable\|comprehensive\|extensible\|maintainable\|enterprise-grade\|battle-tested\|cutting-edge\|state-of-the-art" "$FILE_PATH" 2>/dev/null | head -1)
[ -n "$M" ] && FINDINGS="${FINDINGS}Vague adjectives, replace with specific facts: $M. "
M=$(grep -in "leverages\|utilizes\|facilitates\|empowers\|enables seamless" "$FILE_PATH" 2>/dev/null | head -1)
[ -n "$M" ] && FINDINGS="${FINDINGS}Evasive verbs, say what it does: $M. "
M=$(grep -in "best practices\|industry-standard\|widely adopted\|production-ready" "$FILE_PATH" 2>/dev/null | head -1)
[ -n "$M" ] && FINDINGS="${FINDINGS}Name the practice instead of citing authority: $M. "
[ -z "$FINDINGS" ] && exit 0
jq -cn --arg f "$FINDINGS" '{decision: "allow", context: ("Doc slop: " + $f)}'
exit 0
