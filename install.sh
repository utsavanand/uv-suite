#!/bin/bash
# UV Suite — One-command installer
# Installs agents, skills, hooks, guardrails, and settings into a project or globally.
#
# Usage:
#   ./install.sh                              # Install into current project (Professional)
#   ./install.sh --persona sport              # Fast & lightweight for new projects
#   ./install.sh --persona professional       # Full rigor for production code (default)
#   ./install.sh --persona auto               # Maximum autonomy, minimal human gates
#   ./install.sh --persona spike              # Read-only mode for understanding
#   ./install.sh --global               # Install globally (~/.claude/)
#   ./install.sh --project /path        # Install into specific project

set -e

UV_SUITE_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_MODE="project"
PERSONA="professional"
TARGET_DIR=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --global)
      INSTALL_MODE="global"
      TARGET_DIR="$HOME/.claude"
      shift
      ;;
    --project)
      INSTALL_MODE="project"
      TARGET_DIR="$2/.claude"
      shift 2
      ;;
    --persona)
      PERSONA="$2"
      if [[ ! "$PERSONA" =~ ^(sport|professional|auto|spike)$ ]]; then
        echo "Unknown persona: $PERSONA"
        echo "Available: sport (lightweight), professional (full rigor), auto (autonomous), spike (research & docs)"
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./install.sh [--persona sport|professional|auto|spike] [--global | --project /path]"
      exit 1
      ;;
  esac
done

# Default: current directory
if [ -z "$TARGET_DIR" ]; then
  TARGET_DIR="$(pwd)/.claude"
fi

PERSONA_LABEL="Professional (full rigor)"
if [ "$PERSONA" = "sport" ]; then PERSONA_LABEL="Sport (lightweight)"; fi
if [ "$PERSONA" = "auto" ]; then PERSONA_LABEL="Auto (maximum autonomy)"; fi
if [ "$PERSONA" = "spike" ]; then PERSONA_LABEL="Spike (research & docs)"; fi

echo "╔══════════════════════════════════════╗"
echo "║         UV Suite Installer           ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Installing to: $TARGET_DIR"
echo "Mode: $INSTALL_MODE"
echo "Persona: $PERSONA_LABEL"
echo ""

# --- Create directory structure ---
echo "Creating directory structure..."
mkdir -p "$TARGET_DIR/agents"
mkdir -p "$TARGET_DIR/skills"
mkdir -p "$TARGET_DIR/hooks"
mkdir -p "$TARGET_DIR/rules"

# --- Install agents (Claude Code subagent definitions) ---
echo "Installing 10 agent definitions..."
cp "$UV_SUITE_DIR/agents/claude-code/"*.md "$TARGET_DIR/agents/"
echo "  ✓ cartographer, spec-writer, architect, reviewer, test-writer"
echo "  ✓ eval-writer, anti-slop-guard, prototype-builder, devops, security"

# --- Install skills (slash commands) ---
echo "Installing 9 skills..."
for skill_dir in "$UV_SUITE_DIR/skills/"*/; do
  skill_name=$(basename "$skill_dir")
  mkdir -p "$TARGET_DIR/skills/$skill_name"
  cp "$skill_dir/SKILL.md" "$TARGET_DIR/skills/$skill_name/"
done
echo "  ✓ /map-codebase, /spec, /architect, /review, /write-tests"
echo "  ✓ /write-evals, /slop-check, /prototype, /security-review"

# --- Install hooks ---
echo "Installing 4 hook scripts..."
cp "$UV_SUITE_DIR/hooks/"*.sh "$TARGET_DIR/hooks/"
chmod +x "$TARGET_DIR/hooks/"*.sh
echo "  ✓ auto-lint.sh (PostToolUse: auto-format on write)"
echo "  ✓ danger-zone-check.sh (PreToolUse: warn on danger zone files)"
echo "  ✓ block-destructive.sh (PreToolUse: block rm -rf, force push, etc.)"
echo "  ✓ session-review-reminder.sh (Stop: remind to review uncommitted changes)"
echo "  + Real-time slop check (Haiku prompt hook, wired in settings.json)"

# --- Install guardrail rules (Sport only) ---
if [ "$PERSONA" = "professional" ] || [ "$PERSONA" = "auto" ]; then
  echo "Installing 6 guardrail rules..."
  cp "$UV_SUITE_DIR/guardrails/"*.md "$TARGET_DIR/rules/"
  echo "  ✓ comment-slop, overengineering-slop, error-handling-slop"
  echo "  ✓ test-slop, doc-slop, architecture-slop"
else
  echo "Skipping guardrail rules ($PERSONA persona — guardrails not needed)"
  echo "  Available at: $UV_SUITE_DIR/guardrails/ if you want them later"
fi

# --- Install persona-specific settings ---
echo "Installing persona: $PERSONA_LABEL..."
mkdir -p "$TARGET_DIR/personas"
cp "$UV_SUITE_DIR/personas/"*.json "$TARGET_DIR/personas/" 2>/dev/null || true

# Install settings.json from the selected persona
if [ ! -f "$TARGET_DIR/settings.json" ]; then
  cp "$UV_SUITE_DIR/personas/$PERSONA.json" "$TARGET_DIR/settings.json"
  echo "  ✓ Settings from $PERSONA persona"
else
  # Don't overwrite existing settings.json, use settings.local.json instead
  cp "$UV_SUITE_DIR/personas/$PERSONA.json" "$TARGET_DIR/settings.local.json"
  echo "  ✓ Persona applied via settings.local.json (preserves existing settings.json)"
fi
echo "  ✓ All 4 personas available in $TARGET_DIR/personas/"
echo "    Switch with: cp .claude/personas/sport.json .claude/settings.local.json"

# --- Install portable standards (project root, not .claude/) ---
if [ "$INSTALL_MODE" = "project" ]; then
  PROJECT_ROOT="$(dirname "$TARGET_DIR")"
  echo "Installing portable standards to project root..."

  for std_file in CODING-STANDARDS.md REVIEW-CHECKLIST.md SPEC-TEMPLATE.md ACTS-TEMPLATE.md; do
    # Only install portable standards if we have them extracted
    if [ -f "$UV_SUITE_DIR/portable-standards/$std_file" ]; then
      cp "$UV_SUITE_DIR/portable-standards/$std_file" "$PROJECT_ROOT/"
      echo "  ✓ $std_file"
    fi
  done
fi

# --- Install optional tools (Graphify, Semgrep, Gitleaks) ---
echo "Checking optional integrations..."

if command -v graphify &>/dev/null; then
  echo "  ✓ Graphify (already installed)"
else
  echo "  Installing Graphify (knowledge graph for Cartographer)..."
  pip install graphifyy --quiet 2>/dev/null && graphify install --quiet 2>/dev/null
  if command -v graphify &>/dev/null; then
    echo "  ✓ Graphify installed"
  else
    echo "  ✗ Graphify install failed — install manually: pip install graphifyy && graphify install"
  fi
fi

if command -v semgrep &>/dev/null; then
  echo "  ✓ Semgrep (already installed)"
else
  echo "  Installing Semgrep (SAST for Security Agent)..."
  pip install semgrep --quiet 2>/dev/null
  if command -v semgrep &>/dev/null; then
    echo "  ✓ Semgrep installed"
  else
    echo "  ✗ Semgrep install failed — install manually: pip install semgrep"
  fi
fi

if command -v gitleaks &>/dev/null; then
  echo "  ✓ Gitleaks (already installed)"
else
  echo "  · Gitleaks not found — install for secret detection: brew install gitleaks"
fi

if command -v trivy &>/dev/null; then
  echo "  ✓ Trivy (already installed)"
else
  echo "  · Trivy not found — install for dependency scanning: brew install trivy"
fi

# --- Install launcher script ---
echo "Installing session launcher..."
cp "$UV_SUITE_DIR/uv.sh" "$TARGET_DIR/../uv.sh" 2>/dev/null || true
chmod +x "$TARGET_DIR/../uv.sh" 2>/dev/null || true
echo "  ✓ uv.sh (launch sessions with: ./uv.sh sport)"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Installation Complete!          ║"
echo "║      Persona: $(printf '%-24s' "$PERSONA_LABEL") ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "What was installed:"
echo ""
echo "  AGENTS (10)     $TARGET_DIR/agents/*.md"
echo "  SKILLS (9)      $TARGET_DIR/skills/*/SKILL.md"
echo "  HOOKS (4)       $TARGET_DIR/hooks/*.sh"
if [ "$PERSONA" = "professional" ] || [ "$PERSONA" = "auto" ]; then
echo "  GUARDRAILS (6)  $TARGET_DIR/rules/*.md"
fi
echo "  PERSONAS (4)    $TARGET_DIR/personas/*.json"
echo "  SETTINGS        $TARGET_DIR/settings.json"
echo ""

echo "Available slash commands:"
echo ""
echo "  /map-codebase [dir]     Map a codebase (Cartographer)"
echo "  /spec [requirements]    Write a technical spec (Spec Writer)"
echo "  /architect [spec]       Design architecture + Acts (Architect)"
echo "  /review [file]          Code review (Reviewer)"
echo "  /write-tests [file]     Generate tests (Test Writer)"
echo "  /write-evals [prompt]   Write AI evaluations (Eval Writer)"
echo "  /slop-check [file]      Detect AI slop (Anti-Slop Guard)"
echo "  /prototype [concept]    Build a prototype (Prototype Builder)"
echo "  /security-review [file] Security audit (Security Agent)"
echo ""

if [ "$PERSONA" = "sport" ]; then
echo "Active hooks (Sport — minimal):"
echo ""
echo "  On file write → auto-format (prettier/ruff/gofmt)"
echo ""
echo "Sport mode: fast, autonomous, low cost. All other hooks disabled."
elif [ "$PERSONA" = "professional" ]; then
echo "Active hooks (Professional — full rigor):"
echo ""
echo "  On file write → auto-format (prettier/ruff/gofmt)"
echo "  On file write → real-time slop check (Haiku scans for obvious slop)"
echo "  On file edit  → check danger zones (warn if in DANGER-ZONES.md)"
echo "  On bash cmd   → block destructive commands (rm -rf, force push)"
echo "  On session end → remind to review uncommitted changes"
echo ""
echo "Professional mode: all guardrails active, full review rigor."
elif [ "$PERSONA" = "auto" ]; then
echo "Active hooks (Auto — safety net only):"
echo ""
echo "  On file write → auto-format (prettier/ruff/gofmt)"
echo "  On bash cmd   → block truly destructive commands only"
echo ""
echo "Auto mode: maximum autonomy. All tools pre-approved. Guardrails"
echo "active as context rules. No human gates, no review reminders."
echo "The agent builds, tests, reviews, and iterates on its own."
elif [ "$PERSONA" = "spike" ]; then
echo "Active hooks (Spike — doc quality):"
echo ""
echo "  On doc write → slop check (Haiku catches vague adjectives, non-specific claims)"
echo ""
echo "Spike mode: deep understanding + documentation generation. Opus at max effort."
echo "Can write docs and analysis files. Cannot edit existing code, commit, or push."
fi

echo ""
echo "Start a session with a persona:"
echo ""
echo "  ./uv.sh spike        Research & docs (Opus, max, doc-slop checked)"
echo "  ./uv.sh sport        New projects (Sonnet, high, lint only)"
echo "  ./uv.sh pro          Production code (all hooks, all guardrails)"
echo "  ./uv.sh auto         Fully autonomous (max effort, everything approved)"
echo "  ./uv.sh              Defaults to Professional"
echo ""
echo "Or launch Claude directly with a persona:"
echo ""
echo "  claude --settings .claude/personas/sport.json"
echo "  claude --settings .claude/personas/professional.json"
echo "  claude --settings .claude/personas/auto.json"
echo "  claude --settings .claude/personas/spike.json"
