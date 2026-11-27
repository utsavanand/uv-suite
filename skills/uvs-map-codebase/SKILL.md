---
name: uvs-map-codebase
description: >
  Understand code: map a single codebase or a whole multi-service stack. Repo mode
  produces an architecture overview, domain map, sequence diagrams, and entry points;
  stack mode maps how services connect (REST, queues, shared DBs, shared libs).
  Use when entering an unfamiliar codebase or system.
argument-hint: "[target]"
user-invocable: true
context: fork
agent: codebase-mapper
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Write(uv-out/**)
  - AskUserQuestion
  - Grep(*)
  - Glob(*)
  - Bash(graphify *)
  - Bash(repomix *)
  - Bash(find *)
  - Bash(git *)
  - Bash(wc *)
  - Bash(head *)
  - Bash(ls *)
  - Bash(cat *)
  - Bash(pip *)
---

## Target

$ARGUMENTS

## Mode (auto-detected)

The same codebase-mapper, two ways of looking — and the skill picks for you:

- **repo** — one codebase: architecture, domains, sequence diagrams, entry points, danger zones.
- **stack** — multiple services: how they connect (REST, queues, shared DBs, shared libs).

Detection counts **distinct directories that contain a build file** (not the number of
build files — a single project often has several, e.g. `setup.py` + `pyproject.toml`).
**Two or more distinct service directories → stack; otherwise → repo.** The block below
prints the chosen mode and why — follow it.

Count the distinct directories, to depth 3 and outside `node_modules`, `.git`, `vendor` and `.venv`, that hold a build file (`package.json`, `go.mod`, `requirements.txt`, `pom.xml`, `build.gradle`, `Cargo.toml`, `pyproject.toml`, `setup.py`, `composer.json`, `Gemfile`). Two or more → MODE=stack; otherwise MODE=repo. Say which you chose and why.

The `T`/`D` convention: `T` is the target, `D` falls back to `.` when no target is given.

## Session output directory

Write the map under this directory (scoped to the current session):

This session's output folder is `uv-out/sessions/<id>/`, where `<id>` is the `UVS_SESSION_ID` environment variable, or `uv-out/current/` when it is unset. Create it if it does not exist. Below, `<session-output-dir>` means this folder.

## Shared context

Read `CLAUDE.md` or `AGENTS.md` in the target folder, else at the project root, if present.

Read `DANGER-ZONES.md` at the project root, if present; knowledge/danger-zones.md explains the format.

## Graphify availability

Run `graphify --version`. If it is not installed, map without it; the repo mode file says how.

## Prior maps (current session first, then prior, then legacy)

List every `uv-out/**/map-codebase.md`, newest first, and read the newest. If none: No prior codebase map.

List every `uv-out/**/map-stack.md`, newest first, and read the newest. If none: No prior stack map.

## Discovery

Both sets run at load (cheap); the chosen mode uses what it needs.

### Services (stack mode)

Stack mode: run
```bash
find <target> -maxdepth 3 \( -name package.json -o -name pom.xml -o -name go.mod -o -name Cargo.toml -o -name requirements.txt -o -name setup.py -o -name pyproject.toml \) -not -path "*/node_modules/*" -not -path "*/.git/*" | head -30
```

### Dockerfiles, compose, infra, contracts (stack mode)

Stack mode: run
```bash
find <target> -maxdepth 4 \( -name Dockerfile -o -name "docker-compose*" -o -name "*.tf" -o -name Chart.yaml -o -name values.yaml -o -name "*.proto" -o -name "openapi*" -o -name "*.graphql" \) -not -path "*/node_modules/*" | head -30
```

### Existing knowledge graph (repo mode)

Repo mode: read `<target>/graphify-out/GRAPH_REPORT.md` if present (first 80 lines); otherwise there is no existing graph.

## Procedure

Based on the `MODE` named above, follow the matching mode file. It owns the process and
the output for that mode:

- **MODE=repo** → follow `modes/repo.md` beside this SKILL.md
- **MODE=stack** → follow `modes/stack.md` beside this SKILL.md
