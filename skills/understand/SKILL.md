---
name: understand
description: >
  Understand code: map a single codebase or a whole multi-service stack. Repo mode
  produces an architecture overview, domain map, sequence diagrams, and entry points;
  stack mode maps how services connect (REST, queues, shared DBs, shared libs).
  Use when entering an unfamiliar codebase or system.
argument-hint: "[target]"
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

The same cartographer, two ways of looking — and the skill picks for you:

- **repo** — one codebase: architecture, domains, sequence diagrams, entry points, danger zones.
- **stack** — multiple services: how they connect (REST, queues, shared DBs, shared libs).

Detection counts **distinct directories that contain a build file** (not the number of
build files — a single project often has several, e.g. `setup.py` + `pyproject.toml`).
**Two or more distinct service directories → stack; otherwise → repo.** The block below
prints the chosen mode and why — follow it.

```!
T="$(echo "$ARGUMENTS" | xargs)"; D="${T:-.}"
svc=$(find "$D" -maxdepth 3 \
  \( -name package.json -o -name go.mod -o -name requirements.txt -o -name pom.xml \
     -o -name build.gradle -o -name Cargo.toml -o -name pyproject.toml -o -name setup.py \
     -o -name composer.json -o -name Gemfile \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/vendor/*" -not -path "*/.venv/*" \
  2>/dev/null | xargs -n1 dirname 2>/dev/null | sort -u)
ndirs=$(printf '%s\n' "$svc" | grep -c .)
if [ "$ndirs" -ge 2 ]; then
  echo "MODE=stack (${ndirs} distinct service dirs:"; printf '%s\n' "$svc" | sed 's/^/  - /'
  echo ")"
else
  echo "MODE=repo (single codebase; ${ndirs} build dir)"
fi
```

The `T`/`D` convention: `T` is the target, `D` falls back to `.` when no target is given.

## Session output directory

Write the map under this directory (scoped to the current session):

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-session.sh`

## Shared context

!`T="$(echo "$ARGUMENTS"|xargs)"; D="$T"; [ -d "$D" ] || D="."; cat "$D/CLAUDE.md" 2>/dev/null || cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

!`T="$(echo "$ARGUMENTS"|xargs)"; D="$T"; [ -d "$D" ] || D="."; cat "$D/DANGER-ZONES.md" 2>/dev/null || echo "No DANGER-ZONES.md found"`

## Graphify availability

```!
graphify --version 2>/dev/null || echo "NOT_INSTALLED"
```

## Prior maps (current session first, then prior, then legacy)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-collect.sh 'map-codebase.md' || echo "No prior codebase map"`

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-collect.sh 'map-stack.md' || echo "No prior stack map"`

## Discovery

Both sets run at load (cheap); the chosen mode uses what it needs.

### Services (stack mode)

```!
T="$(echo "$ARGUMENTS"|xargs)"; find ${T:-.} -maxdepth 3 \( -name "package.json" -o -name "pom.xml" -o -name "go.mod" -o -name "Cargo.toml" -o -name "requirements.txt" -o -name "setup.py" -o -name "pyproject.toml" \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -30
```

### Dockerfiles, compose, infra, contracts (stack mode)

```!
T="$(echo "$ARGUMENTS"|xargs)"; find ${T:-.} -maxdepth 4 \( -name "Dockerfile" -o -name "docker-compose*" -o -name "*.tf" -o -name "Chart.yaml" -o -name "values.yaml" -o -name "*.proto" -o -name "openapi*" -o -name "*.graphql" \) -not -path "*/node_modules/*" 2>/dev/null | head -30
```

### Existing knowledge graph (repo mode)

```!
T="$(echo "$ARGUMENTS"|xargs)"; D="$T"; [ -d "$D" ] || D="."; cat "$D/graphify-out/GRAPH_REPORT.md" 2>/dev/null | head -80 || echo "No existing graph found"
```

## Procedure

Based on the `MODE` printed above, follow the matching mode file. It owns the process and
the output for that mode:

- **MODE=repo** → follow `skills/understand/modes/repo.md`
- **MODE=stack** → follow `skills/understand/modes/stack.md`
