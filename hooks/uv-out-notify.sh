#!/bin/bash
# UV Suite Hook: surface real skill artifacts written to uv-out/ after a run.
# Event: Stop
# A skill (/uvs-spec, /uvs-review, /uvs-understand, …) writes artifacts inside a forked sub-agent
# whose transcript the user never sees; this prints the path when control returns.
#
# Scoped to the CURRENT session and excludes checkpoints — checkpoints are background
# state (surfaced by the dashboard and /uvs-session restore), and listing every session's
# checkpoints here produced cross-session noise.

[ -d uv-out ] || exit 0

SID="${UVS_SESSION_ID:-}"
[ -z "$SID" ] && [ -f .uv-suite-state/current-session.txt ] && SID=$(cat .uv-suite-state/current-session.txt 2>/dev/null)

# Recent files, minus checkpoints, minus other sessions (when we know our own).
RECENT=$(find uv-out -type f -mmin -2 2>/dev/null \
  | grep -v '/checkpoints/' \
  | awk -v sid="$SID" '
      /^uv-out\/sessions\// { if (sid == "" || index($0, "uv-out/sessions/" sid "/") == 1) print; next }
      { print }
    ' \
  | sort)
[ -z "$RECENT" ] && exit 0

LIST=$(echo "$RECENT" | sed 's/^/  /' | sed 's/$/\\n/' | tr -d '\n')

cat <<EOF
{
  "continue": true,
  "systemMessage": "UV Suite output written to:\n${LIST}"
}
EOF

exit 0
