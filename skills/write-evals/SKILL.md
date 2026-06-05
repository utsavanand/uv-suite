---
name: write-evals
description: >
  Write evaluations for AI system prompts and inferencing layers.
  Use when building or modifying LLM-powered features.
argument-hint: "[prompt-file-or-description]"
user-invocable: true
context: fork
agent: eval-writer
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(*)
  - Edit(*)
  - Bash(npm run eval *)
  - Bash(pytest *)
---

## Target

$ARGUMENTS

## Existing eval framework

!`find . -name "*eval*" -o -name "*evals*" 2>/dev/null | head -10 || echo "No eval files found"`

## Session output directory

Write eval artifacts under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Prior analysis

### Spec (requirements to evaluate against)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-best.sh 'specs/*.md' 60 || echo "No spec found"`
