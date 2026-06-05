---
name: map-codebase
description: >
  Map a codebase or directory: build a knowledge graph (via Graphify if available),
  then produce architecture overview, business domain map, sequence diagrams, and 
  entry points. Use when entering a new codebase or unfamiliar area.
argument-hint: "[directory-or-question]"
user-invocable: true
context: fork
agent: cartographer
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Write(uv-out/**)
  - AskUserQuestion
  - Grep(*)
  - Glob(*)
  - Bash(graphify *)
  - Bash(find *)
  - Bash(git log *)
  - Bash(git ls-files *)
  - Bash(wc *)
  - Bash(head *)
  - Bash(pip *)
---

## Target

$ARGUMENTS

## Step 0 — Confirm the target (do this FIRST, before any scanning)

- If `$ARGUMENTS` already names a directory, use it — do not ask, just proceed.
- If `$ARGUMENTS` is empty or is a question (not a path), ask the user with `AskUserQuestion`:
  "No codebase specified. Map the current directory, or point me at a different folder?"
  Offer the current directory as the default option. Wait for the answer before scanning.
  If they give a path, run discovery against that path instead of the current directory.

## Session output directory

Write the map under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Graphify availability

```!
graphify --version 2>/dev/null || echo "NOT_INSTALLED"
```

## Existing knowledge graph (if previously generated)

```!
T="$ARGUMENTS"; D="$T"; [ -d "$D" ] || D="."; cat "$D/graphify-out/GRAPH_REPORT.md" 2>/dev/null | head -80 || echo "No existing graph found"
```

## Project context

!`T="$ARGUMENTS"; D="$T"; [ -d "$D" ] || D="."; cat "$D/CLAUDE.md" 2>/dev/null || echo "No CLAUDE.md found"`

## Danger zones

!`T="$ARGUMENTS"; D="$T"; [ -d "$D" ] || D="."; cat "$D/DANGER-ZONES.md" 2>/dev/null || echo "No DANGER-ZONES.md found"`

## Prior analysis (current session first, then prior, then legacy)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-collect.sh 'map-codebase.md' || echo "No prior map — fresh scan"`

## Output

Write the full map to `uv-out/map-codebase.md`. It should contain:

- **Architecture overview** — major modules and how they fit together
- **Business domain map** — the real-world concepts the code models
- **Sequence diagrams** (Mermaid) for the key flows
- **Entry points** — where execution starts (main, routes, handlers, CLI commands)
- **Danger zones** — fragile areas, high-fan-in modules, missing tests

If Graphify is available, run it first and fold its findings in.

After writing the file, print only a one-line pointer to the terminal — do not repeat the map contents. For example:

> Codebase map written to `uv-out/map-codebase.md` — go check it.
