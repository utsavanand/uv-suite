#!/bin/bash
# UV Suite hook (skill kit): remind to review before the session ends.
# Event: stop. Never blocks.
INPUT=$(cat)
ROOT=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
cd "${ROOT:-.}" 2>/dev/null || exit 0
STAGED=$(git diff --cached --stat 2>/dev/null)
UNSTAGED=$(git diff --stat 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | head -5)
[ -z "$STAGED" ] && [ -z "$UNSTAGED" ] && [ -z "$UNTRACKED" ] && exit 0
SUMMARY=""
[ -n "$STAGED" ] && SUMMARY="Staged: $STAGED. "
[ -n "$UNSTAGED" ] && SUMMARY="${SUMMARY}Unstaged: $UNSTAGED. "
[ -n "$UNTRACKED" ] && SUMMARY="${SUMMARY}Untracked: $UNTRACKED. "
jq -cn --arg s "$SUMMARY" '{decision: "allow", context: ("SESSION END REMINDER: uncommitted changes in the working tree. " + $s + "Consider /uvs-review and /uvs-review --slop before committing.")}'
exit 0
