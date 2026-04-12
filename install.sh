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
echo "Installing 10 Claude Code agent definitions..."
cp "$UV_SUITE_DIR/agents/claude-code/"*.md "$TARGET_DIR/agents/"
echo "  ✓ cartographer, spec-writer, architect, reviewer, test-writer"
echo "  ✓ eval-writer, anti-slop-guard, prototype-builder, devops, security"

# --- Install Codex agents (.codex/agents/*.toml + AGENTS.md) ---
PROJECT_ROOT="$(dirname "$TARGET_DIR")"
echo "Installing 10 Codex agent definitions..."
mkdir -p "$PROJECT_ROOT/.codex/agents"
cp "$UV_SUITE_DIR/agents/codex/"*.toml "$PROJECT_ROOT/.codex/agents/"

# Create AGENTS.md for Codex (it reads this instead of CLAUDE.md)
if [ ! -f "$PROJECT_ROOT/AGENTS.md" ]; then
  cp "$PROJECT_ROOT/CLAUDE.md" "$PROJECT_ROOT/AGENTS.md" 2>/dev/null || touch "$PROJECT_ROOT/AGENTS.md"
  echo "  ✓ AGENTS.md created (Codex reads this)"
else
  echo "  ✓ AGENTS.md already exists"
fi
echo "  ✓ .codex/agents/*.toml installed"

# --- Install Cursor rules (.cursor/rules/*.mdc) ---
echo "Installing 10 Cursor rule definitions..."
mkdir -p "$PROJECT_ROOT/.cursor/rules"
cp "$UV_SUITE_DIR/agents/cursor/"*.mdc "$PROJECT_ROOT/.cursor/rules/"
echo "  ✓ .cursor/rules/*.mdc installed"

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
echo "Installing hook scripts..."
cp "$UV_SUITE_DIR/hooks/"*.sh "$TARGET_DIR/hooks/"
chmod +x "$TARGET_DIR/hooks/"*.sh
echo "  ✓ auto-lint.sh (PostToolUse: auto-format)"
echo "  ✓ danger-zone-check.sh (PreToolUse: warn on danger zone files)"
echo "  ✓ block-destructive.sh (PreToolUse: block rm -rf, force push, etc.)"
echo "  ✓ session-start.sh (SessionStart: track session start time)"
echo "  ✓ session-timer.sh (PostToolUse: warn at 45/90/180 min)"
echo "  ✓ session-end.sh (Stop: reflection + duration + review reminder)"
echo "  ✓ status-line.sh (statusLine: show session time continuously)"
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

# --- Write UV Suite context to CLAUDE.md (before bundled tools, which can be slow) ---
if [ "$INSTALL_MODE" = "project" ]; then
  PROJECT_ROOT="$(dirname "$TARGET_DIR")"
  CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"
  UV_VERSION=$(grep '"version"' "$UV_SUITE_DIR/package.json" 2>/dev/null | head -1 | sed 's/.*": "//;s/".*//')

  # Remove existing UV Suite section if present
  if [ -f "$CLAUDE_MD" ] && grep -q "## UV Suite" "$CLAUDE_MD" 2>/dev/null; then
    echo "Updating UV Suite section in CLAUDE.md..."
    # Create temp file without UV Suite section
    awk '/^## UV Suite$/{found=1; next} /^## [^U]/{if(found){found=0}} !found' "$CLAUDE_MD" > "$CLAUDE_MD.tmp"
    mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
  else
    echo "Adding UV Suite section to CLAUDE.md..."
    # Create CLAUDE.md if it doesn't exist
    touch "$CLAUDE_MD"
  fi

  # Determine active hooks text
  HOOKS_TEXT=""
  case "$PERSONA" in
    professional)
      HOOKS_TEXT="- auto-lint (on file write), slop check (on file write), danger zone (on file edit), destructive block (on bash), review reminder (on session end)" ;;
    auto)
      HOOKS_TEXT="- auto-lint (on file write), destructive block (on bash)" ;;
    sport)
      HOOKS_TEXT="- auto-lint (on file write)" ;;
    spike)
      HOOKS_TEXT="- doc slop check (on file write)" ;;
  esac

  cat >> "$CLAUDE_MD" << EOF

## UV Suite

This project uses [UV Suite](https://github.com/utsavanand/uv-suite) v${UV_VERSION} for AI-assisted development.

**Active persona:** ${PERSONA_LABEL}

### Skills

/map-codebase, /map-stack, /spec, /architect, /review, /write-tests, /write-evals, /slop-check, /prototype, /security-review

### Artifacts

Agent output is written to uv-out/. Agents read prior artifacts automatically:
- /map-codebase writes uv-out/map-codebase.md (read by /architect, /review, /security-review)
- /spec writes uv-out/specs/ (read by /architect, /write-tests, /write-evals)
- /architect writes uv-out/architecture/ (read by /review, /write-tests, /slop-check)
- /review writes uv-out/review-*.md (read by /slop-check, /security-review)

### Hooks

${HOOKS_TEXT}

### Personas

Start sessions with: ./uv.sh spike | sport | pro | auto
EOF

  echo "  ✓ UV Suite section added to CLAUDE.md"
fi

# --- Install bundled tools ---
echo "Installing bundled integrations..."

# Python tools (Graphify, Semgrep, DeepEval)
PIP_CMD=""
if command -v pip3 &>/dev/null; then PIP_CMD="pip3"
elif command -v pip &>/dev/null; then PIP_CMD="pip"
fi

if [ -n "$PIP_CMD" ]; then
  for pkg_info in "graphifyy:graphify:Graphify (knowledge graphs for Cartographer)" \
                  "semgrep:semgrep:Semgrep (SAST for Security Agent)" \
                  "deepeval:deepeval:DeepEval (LLM evaluation for Eval Writer)"; do
    pkg=$(echo "$pkg_info" | cut -d: -f1)
    cmd=$(echo "$pkg_info" | cut -d: -f2)
    label=$(echo "$pkg_info" | cut -d: -f3)
    if command -v "$cmd" &>/dev/null; then
      echo "  ✓ $label (already installed)"
    else
      echo "  Installing $label..."
      timeout 60 $PIP_CMD install "$pkg" --quiet 2>/dev/null
      if command -v "$cmd" &>/dev/null || $PIP_CMD show "$pkg" &>/dev/null; then
        echo "  ✓ $label installed"
      else
        echo "  ✗ $label failed — install manually: $PIP_CMD install $pkg"
      fi
    fi
  done

  # Graphify needs an extra install step
  if command -v graphify &>/dev/null; then
    graphify install --quiet 2>/dev/null || true
  fi
else
  echo "  ✗ pip not found — skipping Python tools (Graphify, Semgrep, DeepEval)"
  echo "    Install Python 3 and retry, or install manually:"
  echo "    pip install graphifyy semgrep deepeval"
fi

# Node tools (Repomix — installed as npm dependency)
if command -v repomix &>/dev/null; then
  echo "  ✓ Repomix (already installed)"
else
  echo "  Installing Repomix (codebase context packing)..."
  npm install -g repomix --quiet 2>/dev/null
  if command -v repomix &>/dev/null; then
    echo "  ✓ Repomix installed"
  else
    echo "  ✗ Repomix failed — install manually: npm install -g repomix"
  fi
fi

# Go tools (Gitleaks, Trivy — brew or binary)
if command -v brew &>/dev/null; then
  for tool_info in "gitleaks:Gitleaks (secret detection)" \
                   "trivy:Trivy (dependency vulnerability scanning)"; do
    tool=$(echo "$tool_info" | cut -d: -f1)
    label=$(echo "$tool_info" | cut -d: -f2)
    if command -v "$tool" &>/dev/null; then
      echo "  ✓ $label (already installed)"
    else
      echo "  Installing $label..."
      brew install "$tool" --quiet 2>/dev/null
      if command -v "$tool" &>/dev/null; then
        echo "  ✓ $label installed"
      else
        echo "  ✗ $label failed — install manually: brew install $tool"
      fi
    fi
  done
else
  if ! command -v gitleaks &>/dev/null; then
    echo "  · Gitleaks not found — install: brew install gitleaks"
  fi
  if ! command -v trivy &>/dev/null; then
    echo "  · Trivy not found — install: brew install trivy"
  fi
fi

# --- Register Playwright MCP server ---
echo "Registering MCP servers..."
if command -v claude &>/dev/null; then
  # Check if playwright MCP is already registered
  if claude mcp list 2>/dev/null | grep -q "playwright"; then
    echo "  ✓ Playwright MCP (already registered)"
  else
    echo "  Registering Playwright MCP (browser automation for Prototype Builder + Test Writer)..."
    claude mcp add playwright -- npx @playwright/mcp@latest 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "  ✓ Playwright MCP registered"
    else
      echo "  ✗ Playwright MCP failed — register manually: claude mcp add playwright -- npx @playwright/mcp@latest"
    fi
  fi
else
  echo "  · Claude Code CLI not found — skipping MCP registration"
  echo "    Register manually after installing Claude Code: claude mcp add playwright -- npx @playwright/mcp@latest"
fi

# --- Write UV Suite context to CLAUDE.md ---
if [ "$INSTALL_MODE" = "project" ]; then
  PROJECT_ROOT="$(dirname "$TARGET_DIR")"
  CLAUDE_MD="$PROJECT_ROOT/CLAUDE.md"

  # Check if UV Suite section already exists
  if [ -f "$CLAUDE_MD" ] && grep -q "## UV Suite" "$CLAUDE_MD" 2>/dev/null; then
    echo "Updating UV Suite section in CLAUDE.md..."
    # Remove old UV Suite section and rewrite
    sed -i.bak '/^## UV Suite$/,/^## [^U]/{ /^## [^U]/!d; }' "$CLAUDE_MD" 2>/dev/null || true
    rm -f "$CLAUDE_MD.bak" 2>/dev/null
  else
    echo "Adding UV Suite section to CLAUDE.md..."
  fi

  cat >> "$CLAUDE_MD" << CLAUDEMD

## UV Suite

This project uses [UV Suite](https://github.com/utsavanand/uv-suite) for AI-assisted development.

**Active persona:** $PERSONA_LABEL
**Version:** $(cat "$UV_SUITE_DIR/package.json" 2>/dev/null | grep '"version"' | head -1 | sed 's/.*: "//;s/".*//')

### Available skills (slash commands)

| Command | Agent | What it does |
|---------|-------|-------------|
| /map-codebase [dir] | Cartographer | Build knowledge graph of codebase |
| /map-stack [dir] | Cartographer | Map multiple services and their connections |
| /spec [requirements] | Spec Writer | Write technical specification |
| /architect [spec] | Architect | Design architecture, decompose into Acts |
| /review | Reviewer | Code review (correctness, security, perf, slop) |
| /write-tests [file] | Test Writer | Generate tests matching project conventions |
| /write-evals [prompt] | Eval Writer | Write AI/LLM evaluation cases |
| /slop-check | Anti-Slop Guard | Detect 6 categories of AI-generated slop |
| /prototype [concept] | Prototype Builder | Build static React prototype |
| /security-review | Security Agent | OWASP audit, dependency scan, secret detection |

### Artifacts

All agent output is written to \`uv-out/\`. Each agent reads relevant prior artifacts from this directory automatically.

| Artifact | Written by | Read by |
|----------|-----------|---------|
| uv-out/map-codebase.md | /map-codebase | /architect, /review, /security-review |
| uv-out/specs/*.md | /spec | /architect, /write-tests, /write-evals |
| uv-out/architecture/*.md | /architect | /review, /write-tests, /slop-check |
| uv-out/review-*.md | /review | /slop-check, /security-review |
| uv-out/security-review-*.md | /security-review | — |
| uv-out/slop-check-*.md | /slop-check | — |

### Active hooks

Hooks fire automatically on every relevant action. You do not invoke these.

$(if [ "$PERSONA" = "professional" ]; then
cat << 'HOOKS'
- **auto-lint** (on file write) — runs prettier/ruff/gofmt
- **slop check** (on file write) — Haiku scans for obvious slop
- **danger zone** (on file edit) — warns if file is in DANGER-ZONES.md
- **destructive block** (on bash) — blocks rm -rf, force push
- **review reminder** (on session end) — reminds to /review if uncommitted changes
HOOKS
elif [ "$PERSONA" = "auto" ]; then
cat << 'HOOKS'
- **auto-lint** (on file write) — runs prettier/ruff/gofmt
- **destructive block** (on bash) — blocks rm -rf, force push
HOOKS
elif [ "$PERSONA" = "sport" ]; then
cat << 'HOOKS'
- **auto-lint** (on file write) — runs prettier/ruff/gofmt
HOOKS
elif [ "$PERSONA" = "spike" ]; then
cat << 'HOOKS'
- **doc slop check** (on file write) — Haiku checks documentation quality
HOOKS
fi)

### Context management

If the conversation is getting long, proactively suggest running /compact or starting a new session. Use /cost to check token usage. The user's status line shows context window usage.

### Launching sessions

\`\`\`
uv claude pro     # Claude Code, Professional persona
uv claude auto    # Claude Code, Auto persona
uv codex pro      # OpenAI Codex, Professional persona
uv codex sport    # OpenAI Codex, Sport persona
\`\`\`
CLAUDEMD

  echo "  ✓ UV Suite section added to CLAUDE.md"
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
echo "  Claude Code     .claude/agents/*.md + skills/ + hooks/ + rules/"
echo "  Codex           .codex/agents/*.toml + AGENTS.md"
echo "  Cursor          .cursor/rules/*.mdc"
echo "  Personas (4)    .claude/personas/*.json"
echo "  Launcher        ./uv.sh"
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
echo "Start a session:"
echo ""
echo "  ./uv.sh claude pro      Claude Code, Professional"
echo "  ./uv.sh claude auto     Claude Code, Auto"
echo "  ./uv.sh codex pro       Codex, Professional"
echo "  ./uv.sh codex auto      Codex, Auto"
echo "  ./uv.sh pro             Shorthand (defaults to Claude Code)"
echo "  ./uv.sh                 Claude Code, Professional"
