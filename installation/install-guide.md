# UV Suite — Installation Guide

How to install, configure, and extend UV Suite for Claude Code, Cursor, and OpenAI Codex. Each tool gets its own section because the setup is genuinely different — not because the methodology changes.

---

## Quick Install

### Claude Code (Recommended)

```bash
# 1. Clone or copy UV Suite
git clone git@github.com:your-org/uv-suite.git ~/uv-suite

# 2. Install agents globally (available in every project)
cp ~/uv-suite/agents/claude-code/*.md ~/.claude/agents/

# 3. Install skills globally
cp -r ~/uv-suite/skills/claude-code/* ~/.claude/skills/

# 4. Install hooks (optional — auto-lint, slop detection)
cp ~/uv-suite/hooks/*.sh ~/.claude/hooks/
# Then add hook config to ~/.claude/settings.json (see Hooks section below)

# 5. For a specific project, copy portable standards
cd my-project
cp ~/uv-suite/portable-standards/CODING-STANDARDS.md .
cp ~/uv-suite/portable-standards/REVIEW-CHECKLIST.md .
cp ~/uv-suite/portable-standards/ACTS-TEMPLATE.md .
```

### Cursor

```bash
# 1. Copy rules to your project
mkdir -p .cursor/rules
cp ~/uv-suite/agents/cursor/*.mdc .cursor/rules/

# 2. Copy portable standards to project root
cp ~/uv-suite/portable-standards/*.md .
```

### OpenAI Codex

```bash
# 1. Copy agent definitions
mkdir -p .codex/agents
cp ~/uv-suite/agents/codex/*.toml .codex/agents/

# 2. Copy AGENTS.md to project root
cp ~/uv-suite/templates/AGENTS.md .

# 3. Copy portable standards
cp ~/uv-suite/portable-standards/*.md .
```

---

## File-Per-Agent Architecture

UV Suite uses **one file per agent** rather than a monolithic file. This is intentional:

### Why one file per agent?

1. **Installability** — Install only the agents you need. A project that doesn't do AI inferencing doesn't need the Eval Writer.
2. **Extensibility** — Add custom agents by dropping a new `.md` file. No need to edit a central registry.
3. **Tool compatibility** — Claude Code, Cursor, and Codex all expect individual files in their agent/rule directories.
4. **Version control** — Track changes to each agent independently. A reviewer update doesn't pollute the cartographer's history.
5. **Shareability** — Send someone a single file ("try this reviewer agent") rather than pointing them to a section of a 500-line doc.

### Agent file structure

Each agent file follows this structure:

```markdown
---
name: [agent-name]
description: >
  [When to use this agent — this is what Claude/Cursor/Codex reads to decide
  whether to delegate to this agent automatically]
model: [opus|sonnet|haiku]
tools: [list of allowed tools]
---

# [Agent Name]

## Purpose
[What this agent does and why it exists]

## When to invoke
[Specific triggers — not vague "when you need it"]

## Inputs
[What the agent needs to start working]

## Process
[Step-by-step what the agent does]

## Output format
[Exact structure of what the agent produces]

## Anti-patterns
[What this agent should NOT do]

## Examples
[Concrete input/output examples]
```

### The agent directory

```
agents/
├── claude-code/              # Claude Code subagent definitions
│   ├── cartographer.md
│   ├── spec-writer.md
│   ├── architect.md
│   ├── reviewer.md
│   ├── test-writer.md
│   ├── eval-writer.md
│   ├── anti-slop-guard.md
│   ├── prototype-builder.md
│   ├── devops.md
│   └── security.md
├── cursor/                   # Cursor rule files
│   ├── cartographer.mdc
│   ├── reviewer.mdc
│   └── ...
├── codex/                    # Codex agent definitions
│   ├── cartographer.toml
│   ├── reviewer.toml
│   └── ...
└── portable/                 # Tool-agnostic role definitions
    ├── cartographer.md       # The "source of truth" for each role
    ├── reviewer.md
    └── ...
```

**Flow:** `portable/*.md` → generate → `claude-code/*.md`, `cursor/*.mdc`, `codex/*.toml`

---

## Guardrail Files (Anti-Slop Rules)

Anti-slop rules are also modular — one file per rule category:

```
guardrails/
├── comment-slop.md           # Restating code in comments
├── overengineering-slop.md   # Abstractions with no concrete use
├── test-slop.md              # Tests that pass but verify nothing
├── doc-slop.md               # Vague adjectives, buzzword documentation
├── architecture-slop.md      # Unjustified complexity, pattern abuse
├── error-handling-slop.md    # Try/catch around code that can't throw
└── naming-slop.md            # Generic names, Hungarian notation, etc.
```

**Why modular?**
- Teams can adopt incrementally ("we'll start with comment slop and test slop")
- Custom rules can be added without editing existing files
- Severity can be configured per-project (some teams tolerate more comments than others)

### Installing guardrails

```bash
# Install all guardrails
cp ~/uv-suite/guardrails/*.md .claude/rules/

# Install selectively
cp ~/uv-suite/guardrails/comment-slop.md .claude/rules/
cp ~/uv-suite/guardrails/test-slop.md .claude/rules/
```

---

## Extending UV Suite

### Adding a Custom Agent

1. Create the portable definition:

```markdown
# agents/portable/my-custom-agent.md
---
name: my-custom-agent
description: >
  [What it does and when to use it]
---

## Purpose
[Description]

## Process
[Steps]

## Output format
[Structure]
```

2. Generate the tool-specific wrapper:

```bash
# For Claude Code
cp agents/portable/my-custom-agent.md agents/claude-code/my-custom-agent.md
# Add Claude Code frontmatter (model, tools, etc.)

# For Cursor
# Convert to .mdc format with alwaysApply/globs metadata
```

3. Install it:
```bash
cp agents/claude-code/my-custom-agent.md ~/.claude/agents/
```

### Adding Custom Guardrails

Create a new file in `guardrails/`:

```markdown
# guardrails/our-api-patterns.md
---
name: api-pattern-guard
description: Enforce our team's API response envelope and error format
severity: error
---

## Rule: API Response Envelope

All API endpoints MUST return:
```json
{ "data": ..., "error": null | { "code": "...", "message": "..." }, "meta": { ... } }
```

### Violations:
- Returning raw data without envelope
- Using `message` at the top level instead of in `error`
- Missing `meta` on paginated responses

### Exceptions:
- Health check endpoints (`/health`, `/ready`)
- Streaming endpoints (SSE)
```

### Adding Custom Skills

```bash
mkdir -p ~/.claude/skills/my-workflow/
```

```markdown
# ~/.claude/skills/my-workflow/SKILL.md
---
name: my-workflow
description: >
  Run our team's deployment checklist.
user-invocable: true
---

[Skill instructions here]
```

---

## Project-Level Configuration

### Recommended `.claude/` structure

```
.claude/
├── settings.json              # Shared settings (commit to repo)
├── settings.local.json        # Personal overrides (gitignored)
├── agents/                    # UV Suite agents (customized for this project)
│   ├── reviewer.md            # Project-specific review rules
│   ├── test-writer.md         # Knows our test patterns
│   └── cartographer.md        # Knows our service topology
├── skills/                    # Project-specific skills
│   └── deploy/
│       └── SKILL.md
├── hooks/                     # Automation hooks
│   ├── auto-lint.sh
│   └── danger-zone-check.sh
├── rules/                     # Additional context rules
│   ├── coding-standards.md    # From portable standards
│   └── danger-zones.md        # Symlinked from project root
└── mcp.json                   # MCP server configs
```

### What to commit vs. gitignore

| File | Commit? | Why |
|------|---------|-----|
| `.claude/settings.json` | Yes | Shared project settings |
| `.claude/settings.local.json` | No | Personal preferences |
| `.claude/agents/*.md` | Yes | Team shares agent definitions |
| `.claude/skills/` | Yes | Team shares workflows |
| `.claude/hooks/*.sh` | Yes | Team shares automation |
| `.claude/mcp.json` | Depends | Yes if using shared MCP servers, no if personal |

---

## Versioning and Updates

UV Suite is designed to be **pulled, not pushed**. There's no auto-update mechanism — you control when you adopt changes.

### Recommended update workflow

```bash
# 1. Pull latest UV Suite
cd ~/uv-suite && git pull

# 2. Diff against your installed agents
diff ~/uv-suite/agents/claude-code/reviewer.md ~/.claude/agents/reviewer.md

# 3. Merge selectively
# If UV Suite added a new check, add it to your customized version
# If UV Suite changed something you've deliberately customized, keep yours

# 4. For projects, update via PR
cd my-project
cp ~/uv-suite/agents/claude-code/reviewer.md .claude/agents/reviewer.md
git add .claude/agents/reviewer.md
git commit -m "Update reviewer agent from UV Suite"
```

**Never blindly overwrite customized agents.** Your project-specific tuning is valuable. Merge, don't replace.
