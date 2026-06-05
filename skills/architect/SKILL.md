---
name: architect
description: >
  Design system architecture and decompose work into Acts with tasks, dependencies, and cycle budgets.
  Use after a spec is approved, before coding begins.
argument-hint: "[spec-file-or-description]"
user-invocable: true
context: fork
agent: architect
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(uv-out/**)
  - AskUserQuestion
  - Bash(git log *)
---

## Input

$ARGUMENTS

## Session output directory

Write architecture artifacts under this directory (scoped to the current session):

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-session.sh`

## Step 0 — REQUIRE a curated spec (HARD GATE — do this before anything else)

**Architecture is designed _from_ a spec. Do not design without one. Do not proceed past
this step until a real spec is in hand.** A "curated spec" is a spec document with a
problem statement, requirements, and success criteria — **not** a one-line description.

Resolve the spec in this exact order:

1. **`$ARGUMENTS` names a spec file** → `Read` it in full. Proceed.
2. **A spec exists in the CURRENT session** (see "Available specs" below) → `Read` the
   newest one in full. Proceed.
3. **Only PRIOR-session specs exist** → ask with `AskUserQuestion` which to use (list each
   with its session + date, default newest). `Read` it. Proceed.
4. **No spec anywhere** (and `$ARGUMENTS` is empty or just a vague phrase) → **STOP. Do NOT
   architect.** Ask with `AskUserQuestion`, offering:
   - **Run `/spec` first** (recommended — architecture needs a curated spec), or
   - **Describe the problem now** → if they choose this, draft a brief spec inline
     (problem · requirements · success criteria), **confirm it with the user**, and only
     then continue to design from it.

   Never invent requirements, and never design from a single sentence — if that's all you
   have, you are in case 4.

If you cannot satisfy one of cases 1–3 or complete case 4's confirmation, **end here** with
a one-line explanation. Designing without a spec is a failure, not a fallback.

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Available specs (current session first, then prior, then legacy)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-collect.sh 'specs/*.md' || echo "No specs found"`

## Prior analysis

### Codebase map (current session first)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-collect.sh 'map-codebase.md' || echo "No codebase map"`

### Session checkpoint

!`cat uv-out/current/checkpoints/latest.md 2>/dev/null | head -40 || echo "No checkpoint"`
