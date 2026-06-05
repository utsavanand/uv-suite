#!/bin/bash
# UV Suite helper: locate per-session checkpoint paths and print metadata.
# Used by the /session checkpoint and /session restore slash commands.
#
# Usage:
#   checkpoint-helper.sh dir       # ensure + print the dir for current session
#   checkpoint-helper.sh meta      # print session metadata as shell-eval'able lines
#   checkpoint-helper.sh frontmatter  # YAML frontmatter to embed at the top of a checkpoint
#   checkpoint-helper.sh latest    # cat the latest checkpoint for current session (with fallback)
#   checkpoint-helper.sh list      # list all sessions that have checkpoints, newest first

resolve_paths() {
  PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
  STATE_DIR="$PROJECT_DIR/.uv-suite-state"
  SID="${UVS_SESSION_ID:-}"
  if [ -z "$SID" ] && [ -f "$STATE_DIR/current-session.txt" ]; then
    SID=$(cat "$STATE_DIR/current-session.txt" 2>/dev/null)
  fi
  [ -z "$SID" ] && SID="no-session"
  # Unified layout: everything a session produces lives under uv-out/sessions/<sid>/.
  SESSIONS_ROOT="$PROJECT_DIR/uv-out/sessions"
  SESSION_CP_DIR="$SESSIONS_ROOT/$SID/checkpoints"
  # Legacy locations, read for backward compatibility (pre-unify checkpoints):
  LEGACY_CP_ROOT="$PROJECT_DIR/uv-out/checkpoints"
  LEGACY_SESSION_CP_DIR="$LEGACY_CP_ROOT/$SID"
  META_FILE="$STATE_DIR/sessions/$SID.json"
}

print_meta_field() {
  # $1 = field name; reads from $META_FILE; empty if missing
  [ -z "$META_FILE" ] || [ ! -f "$META_FILE" ] && { echo ""; return; }
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg k "$1" '.[$k] // ""' "$META_FILE" 2>/dev/null
  else
    grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$META_FILE" | head -1 | sed "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\(.*\)\"/\1/"
  fi
}

resolve_paths

case "$1" in
  dir)
    mkdir -p "$SESSION_CP_DIR"
    echo "$SESSION_CP_DIR"
    ;;
  meta)
    echo "uvs_session_id=${SID:-}"
    echo "session_name=$(print_meta_field name)"
    echo "session_kind=$(print_meta_field kind)"
    echo "session_purpose=$(print_meta_field purpose)"
    echo "session_priority=$(print_meta_field priority)"
    echo "persona=$(print_meta_field persona)"
    ;;
  frontmatter)
    NAME=$(print_meta_field name)
    KIND=$(print_meta_field kind)
    PURPOSE=$(print_meta_field purpose)
    PRIORITY=$(print_meta_field priority)
    PERSONA=$(print_meta_field persona)
    NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    cat <<EOF
---
uvs_session_id: ${SID:-}
session_name: ${NAME}
session_kind: ${KIND}
session_purpose: ${PURPOSE}
session_priority: ${PRIORITY}
persona: ${PERSONA}
checkpoint_at: ${NOW}
---
EOF
    ;;
  latest)
    if [ -f "$SESSION_CP_DIR/latest.md" ]; then
      cat "$SESSION_CP_DIR/latest.md"
    elif [ -f "$LEGACY_SESSION_CP_DIR/latest.md" ]; then
      echo "(no checkpoint at new path; showing legacy uv-out/checkpoints/${SID}/latest.md)"
      echo
      cat "$LEGACY_SESSION_CP_DIR/latest.md"
    elif [ -f "$LEGACY_CP_ROOT/latest.md" ]; then
      echo "(no per-session checkpoint for ${SID}; showing legacy global latest.md)"
      echo
      cat "$LEGACY_CP_ROOT/latest.md"
    else
      echo "No checkpoint found for session ${SID}. Run /session checkpoint to create one."
    fi
    ;;
  list)
    found=0
    seen=" "
    emit_cp_entry() { # $1 = cp_sid  $2 = checkpoint dir  $3 = origin tag
      local cp_sid="$1" d="$2" origin="$3"
      [ -d "$d" ] || return 0
      case "$seen" in *" $cp_sid "*) return 0 ;; esac   # dedupe sid across new+legacy
      local latest
      latest=$(ls -t "$d"/*.md 2>/dev/null | head -1)
      [ -z "$latest" ] && return 0
      seen="$seen$cp_sid "
      local cp_meta="$STATE_DIR/sessions/$cp_sid.json" cp_name="" cp_priority=""
      if [ -f "$cp_meta" ]; then
        if command -v jq >/dev/null 2>&1; then
          cp_name=$(jq -r '.name // ""' "$cp_meta" 2>/dev/null)
          cp_priority=$(jq -r '.priority // ""' "$cp_meta" 2>/dev/null)
        else
          cp_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$cp_meta" | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
        fi
      fi
      local ts label mark
      ts=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$latest" 2>/dev/null || stat -c '%y' "$latest" 2>/dev/null | cut -c1-16)
      label="${cp_name:-(unlabeled)}"
      [ -n "$cp_priority" ] && label="$label [p:$cp_priority]"
      mark=" "; [ "$cp_sid" = "$SID" ] && mark="*"
      echo "$mark ${cp_sid:0:8}  $ts  $label${origin}"
      found=1
    }
    # New unified layout first, then legacy, deduped by sid.
    for d in "$SESSIONS_ROOT"/*/checkpoints/; do emit_cp_entry "$(basename "$(dirname "$d")")" "$d" ""; done
    for d in "$LEGACY_CP_ROOT"/*/; do emit_cp_entry "$(basename "$d")" "$d" "  (legacy path)"; done
    [ "$found" -eq 0 ] && echo "No per-session checkpoints yet (current session: ${SID})"
    if [ -f "$LEGACY_CP_ROOT/latest.md" ]; then
      ts=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$LEGACY_CP_ROOT/latest.md" 2>/dev/null || stat -c '%y' "$LEGACY_CP_ROOT/latest.md" 2>/dev/null | cut -c1-16)
      echo "  legacy   $ts  (pre-metadata global latest.md)"
    fi
    ;;
  *)
    echo "Usage: checkpoint-helper.sh [dir|meta|frontmatter|latest|list]"
    exit 1
    ;;
esac
