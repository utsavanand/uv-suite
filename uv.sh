#!/bin/bash
# UV Suite — Session launcher
# Starts a Claude Code session with the specified persona.
#
# Usage:
#   uv spike              Start a Spike session (research & docs)
#   uv sport              Start a Sport session (fast, new projects)
#   uv pro                Start a Professional session (production code)
#   uv auto               Start an Auto session (fully autonomous)
#   uv                    Start with default (Professional)

PERSONA="${1:-pro}"
shift 2>/dev/null  # consume the persona arg, pass the rest to claude

# Resolve persona to settings file
case "$PERSONA" in
  spike)
    SETTINGS=".claude/personas/spike.json"
    LABEL="UV Spike — research & docs (Opus, max effort, doc-slop checked)"
    ;;
  sport)
    SETTINGS=".claude/personas/sport.json"
    LABEL="UV Sport — lightweight (Sonnet, high effort, lint only)"
    ;;
  pro|professional)
    SETTINGS=".claude/personas/professional.json"
    LABEL="UV Professional — full rigor (all hooks, all guardrails)"
    ;;
  auto)
    SETTINGS=".claude/personas/auto.json"
    LABEL="UV Auto — autonomous (max effort, everything approved)"
    ;;
  *)
    echo "Unknown persona: $PERSONA"
    echo ""
    echo "Usage: uv [spike|sport|pro|auto]"
    echo ""
    echo "  spike   Research & documentation (Opus, max, doc-slop hook)"
    echo "  sport   New projects, prototyping (Sonnet, high, lint only)"
    echo "  pro     Production code (all hooks, all guardrails, human-gated)"
    echo "  auto    Fully autonomous (max effort, everything auto-approved)"
    echo ""
    echo "  uv      Defaults to 'pro'"
    exit 1
    ;;
esac

if [ ! -f "$SETTINGS" ]; then
  echo "Settings file not found: $SETTINGS"
  echo "Run install.sh first to set up UV Suite in this project."
  exit 1
fi

echo "$LABEL"
echo ""
exec claude --settings "$SETTINGS" "$@"
