#!/bin/bash
# UV Suite — Unified session launcher
# Starts Claude Code or Codex with the specified persona.
#
# Usage:
#   uv claude pro         Claude Code, Professional persona
#   uv claude auto        Claude Code, Auto persona
#   uv codex sport        OpenAI Codex, Sport persona
#   uv codex pro          OpenAI Codex, Professional persona
#   uv pro                Shorthand — defaults to Claude Code
#   uv                    Claude Code, Professional persona

TOOL=""
PERSONA=""

# Parse arguments
case "$1" in
  claude|codex)
    TOOL="$1"
    PERSONA="${2:-pro}"
    shift 2 2>/dev/null
    ;;
  spike|sport|pro|professional|auto)
    TOOL="claude"
    PERSONA="$1"
    shift
    ;;
  --help|-h)
    echo ""
    echo "  uv — UV Suite session launcher"
    echo ""
    echo "  Usage:"
    echo "    uv claude <persona>    Start Claude Code with persona"
    echo "    uv codex <persona>     Start OpenAI Codex with persona"
    echo "    uv <persona>           Shorthand for uv claude <persona>"
    echo "    uv                     Defaults to uv claude pro"
    echo ""
    echo "  Personas:"
    echo "    spike    Research & docs (Opus, max effort)"
    echo "    sport    New projects (Sonnet, high effort)"
    echo "    pro      Production code (all hooks, all guardrails)"
    echo "    auto     Fully autonomous (max effort, everything approved)"
    echo ""
    echo "  Session metadata:"
    echo "    On launch you'll be prompted for name, kind, purpose, and"
    echo "    priority. Press Enter to skip any field; you'll be reminded"
    echo "    until the session is named. Use /session init to relabel."
    echo "    Set UVS_NO_PROMPT=1 to suppress prompts entirely."
    echo ""
    exit 0
    ;;
  "")
    TOOL="claude"
    PERSONA="pro"
    ;;
  *)
    echo "Unknown argument: $1"
    echo "Usage: uv [claude|codex] [spike|sport|pro|auto]"
    exit 1
    ;;
esac

# Normalize persona name
case "$PERSONA" in
  pro|professional) PERSONA="professional" ;;
  spike|sport|auto) ;; # already correct
  *)
    echo "Unknown persona: $PERSONA"
    echo "Available: spike, sport, pro, auto"
    exit 1
    ;;
esac

# Persona labels
case "$PERSONA" in
  spike)        LABEL="Spike — research & docs (Opus, max)" ;;
  sport)        LABEL="Sport — lightweight (Sonnet, high)" ;;
  professional) LABEL="Professional — full rigor (all hooks, all guardrails)" ;;
  auto)         LABEL="Auto — autonomous (max, everything approved)" ;;
esac

# --- Session metadata: generate id and prompt for label ---
PROJECT_DIR="$(pwd)"
STATE_DIR="$PROJECT_DIR/.uv-suite-state"
SESSIONS_DIR="$STATE_DIR/sessions"
mkdir -p "$SESSIONS_DIR"

if command -v uuidgen >/dev/null 2>&1; then
  UVS_SESSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
else
  UVS_SESSION_ID="uvs-$(date +%s)-$$"
fi
export UVS_SESSION_ID

UVS_NAME=""
UVS_KIND=""
UVS_PURPOSE=""
UVS_PRIORITY=""

# Prompt only if attached to a TTY and not explicitly suppressed
if [ -t 0 ] && [ -z "$UVS_NO_PROMPT" ]; then
  echo ""
  echo "Label this session (Enter to skip — you'll be reminded):"
  read -r -p "  name:                     " UVS_NAME
  read -r -p "  kind [long/outcome]:      " UVS_KIND_RAW
  read -r -p "  purpose:                  " UVS_PURPOSE
  read -r -p "  priority [low/med/high]:  " UVS_PRIORITY_RAW

  case "$UVS_KIND_RAW" in
    l|long|long-running) UVS_KIND="long-running" ;;
    o|outcome)           UVS_KIND="outcome" ;;
    "")                  UVS_KIND="" ;;
    *) echo "  (kind '$UVS_KIND_RAW' not recognized — leaving blank)"; UVS_KIND="" ;;
  esac

  case "$UVS_PRIORITY_RAW" in
    l|low)        UVS_PRIORITY="low" ;;
    m|med|medium) UVS_PRIORITY="med" ;;
    h|high)       UVS_PRIORITY="high" ;;
    "")           UVS_PRIORITY="" ;;
    *) echo "  (priority '$UVS_PRIORITY_RAW' not recognized — leaving blank)"; UVS_PRIORITY="" ;;
  esac
fi

# Write metadata as JSON. Use python3 for proper escaping of free-text fields.
META_FILE="$SESSIONS_DIR/$UVS_SESSION_ID.json"
SID="$UVS_SESSION_ID" \
NAME="$UVS_NAME" \
KIND="$UVS_KIND" \
PURPOSE="$UVS_PURPOSE" \
PRIORITY="$UVS_PRIORITY" \
PERSONA_VAL="$PERSONA" \
CWD_VAL="$PROJECT_DIR" \
STARTED="$(date +%s)" \
python3 -c '
import json, os
print(json.dumps({
    "uvs_session_id": os.environ["SID"],
    "name": os.environ["NAME"],
    "kind": os.environ["KIND"],
    "purpose": os.environ["PURPOSE"],
    "priority": os.environ["PRIORITY"],
    "persona": os.environ["PERSONA_VAL"],
    "cwd": os.environ["CWD_VAL"],
    "started_at": int(os.environ["STARTED"]),
}, indent=2))
' > "$META_FILE" 2>/dev/null

# Latest-session pointer (used by hooks that lack UVS_SESSION_ID in their env)
echo "$UVS_SESSION_ID" > "$STATE_DIR/current-session.txt"

SETTINGS=".claude/personas/$PERSONA.json"

if [ "$TOOL" = "claude" ]; then
  # --- Claude Code ---
  if ! command -v claude &>/dev/null; then
    echo "Error: claude not found. Install Claude Code first."
    exit 1
  fi

  if [ ! -f "$SETTINGS" ]; then
    echo "Error: $SETTINGS not found. Run 'npx uv-suite install' first."
    exit 1
  fi

  echo ""
  echo "UV Suite | Claude Code | $LABEL"
  echo "Session: ${UVS_SESSION_ID:0:8}${UVS_NAME:+ — $UVS_NAME}"
  echo ""
  exec claude --settings "$SETTINGS" "$@"

elif [ "$TOOL" = "codex" ]; then
  # --- OpenAI Codex ---
  if ! command -v codex &>/dev/null; then
    echo "Error: codex not found. Install OpenAI Codex first."
    echo "  npm install -g @openai/codex"
    exit 1
  fi

  case "$PERSONA" in
    spike)        CODEX_ARGS="--model o3 --approval-mode suggest" ;;
    sport)        CODEX_ARGS="--approval-mode auto-edit" ;;
    professional) CODEX_ARGS="--approval-mode suggest" ;;
    auto)         CODEX_ARGS="--approval-mode full-auto" ;;
  esac

  echo ""
  echo "UV Suite | Codex | $LABEL"
  echo "Session: ${UVS_SESSION_ID:0:8}${UVS_NAME:+ — $UVS_NAME}"
  echo ""
  exec codex $CODEX_ARGS "$@"
fi
