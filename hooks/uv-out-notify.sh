#!/bin/bash
# UV Suite Hook: Surface the uv-out/ artifact path after a skill run.
# Event: Stop
# When a UV Suite skill writes artifacts to uv-out/, the writing happens inside a
# forked sub-agent whose transcript the user never sees. This hook runs when control
# returns to the main loop and prints the path so the user knows where output landed.

[ -d uv-out ] || exit 0

# Files written in the ~2 min covering the run that just finished.
RECENT=$(find uv-out -type f -mmin -2 2>/dev/null | sort)
[ -z "$RECENT" ] && exit 0

LIST=$(echo "$RECENT" | sed 's/^/  /' | sed 's/$/\\n/' | tr -d '\n')

cat <<EOF
{
  "continue": true,
  "systemMessage": "UV Suite output written to:\n${LIST}"
}
EOF

exit 0
