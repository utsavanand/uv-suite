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

  echo "UV Suite | Claude Code | $LABEL"
  echo ""
  exec claude --settings "$SETTINGS" "$@"

elif [ "$TOOL" = "codex" ]; then
  # --- OpenAI Codex ---
  if ! command -v codex &>/dev/null; then
    echo "Error: codex not found. Install OpenAI Codex first."
    echo "  npm install -g @openai/codex"
    exit 1
  fi

  # Codex doesn't have --settings, but reads AGENTS.md and .codex/agents/
  # We can pass model and approval mode based on persona
  case "$PERSONA" in
    spike)
      CODEX_ARGS="--model o3 --approval-mode suggest"
      ;;
    sport)
      CODEX_ARGS="--approval-mode auto-edit"
      ;;
    professional)
      CODEX_ARGS="--approval-mode suggest"
      ;;
    auto)
      CODEX_ARGS="--approval-mode full-auto"
      ;;
  esac

  echo "UV Suite | Codex | $LABEL"
  echo ""
  exec codex $CODEX_ARGS "$@"
fi
