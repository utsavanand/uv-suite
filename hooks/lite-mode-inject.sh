#!/bin/bash
# UV Suite Hook: Lite mode — inject terseness instructions
# Event: UserPromptSubmit
# Activates when UVS_LITE=1 OR .uv-suite-state/lite-mode.txt contains "on".
# Reduces output verbosity to save tokens.

STATE_DIR="${CLAUDE_PROJECT_DIR:-.}/.uv-suite-state"
STATE_FILE="$STATE_DIR/lite-mode.txt"

is_lite="false"
[ "$UVS_LITE" = "1" ] && is_lite="true"
[ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE" 2>/dev/null | tr -d '[:space:]')" = "on" ] && is_lite="true"

if [ "$is_lite" != "true" ]; then
  exit 0
fi

cat <<'EOF'
{
  "continue": true,
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "UV Suite lite mode is ACTIVE. Follow these rules for this turn:\n- No preamble. No \"I'll do X\" before doing it. Start with the action.\n- No end-of-turn summaries longer than one sentence.\n- No bullet lists unless the user explicitly asks for one.\n- No code comments unless the user asks.\n- No markdown headers (##, ###) in responses unless the user asks.\n- Inline single-sentence updates between tool calls; never multi-paragraph narration.\n- Cite file paths inline (file.ts:42), not as section headers.\n- Skip pleasantries, acknowledgments, and reassurances.\nThe user is token-constrained. Be useful, not thorough."
  }
}
EOF
