#!/bin/bash
# UV Suite Hook: SessionStart — when UVS_RESTORE_FROM is set, inject a
# system-context instruction telling Claude to /restore that session as
# the first action of the new session.
#
# This is how the Watchtower's "Open in new terminal" restore button hooks
# back into the new uvs session — the env var is set by the spawned terminal
# command, propagates through uvs/claude, and lands here.

if [ -z "$UVS_RESTORE_FROM" ]; then
  exit 0
fi

# Sanity check — sid must look like a UUID prefix or our ad-hoc-<ts>
case "$UVS_RESTORE_FROM" in
  [a-zA-Z0-9-]*) : ;;
  *)
    echo "[auto-restore] ignoring malformed UVS_RESTORE_FROM" >&2
    exit 0
    ;;
esac

MSG="[uv-suite auto-restore] This session was opened via the Watchtower restore flow. Your FIRST action must be to run \`/restore $UVS_RESTORE_FROM\` to load the prior session's latest checkpoint. After /restore completes, summarize what you picked up in 1-2 sentences, then wait for the user's next instruction."

if command -v jq >/dev/null 2>&1; then
  jq -nc --arg ctx "$MSG" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'
else
  ESCAPED=$(printf '%s' "$MSG" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}' "$ESCAPED"
fi
