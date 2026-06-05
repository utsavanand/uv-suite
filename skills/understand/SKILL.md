---
name: understand
description: >
  Understand code: map a single codebase or a whole multi-service stack. Repo mode
  produces an architecture overview, domain map, sequence diagrams, and entry points;
  stack mode maps how services connect (REST, queues, shared DBs, shared libs).
  Use when entering an unfamiliar codebase or system.
argument-hint: "[target] [--repo|--stack]"
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

## Mode

Two modes, chosen by flag or auto-detection:

- `--repo` — map one codebase (architecture, domains, entry points, danger zones).
- `--stack` — map how multiple services connect (the system level).

If no flag is given, auto-detect: a target containing **two or more** subdirectories
with build files (package.json, go.mod, requirements.txt, pom.xml, …) is a **stack**;
otherwise it's a single **repo**. The detector below prints the chosen mode — follow it.

```!
T="$ARGUMENTS"; T="${T//--repo/}"; T="${T//--stack/}"; T="$(echo $T | xargs)"; D="${T:-.}"
case "$ARGUMENTS" in
  *--stack*) echo "MODE=stack (flag)";;
  *--repo*)  echo "MODE=repo (flag)";;
  *) n=$(find "$D" -maxdepth 2 \( -name package.json -o -name go.mod -o -name requirements.txt -o -name pom.xml -o -name Cargo.toml -o -name pyproject.toml \) -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
     [ "$n" -ge 2 ] && echo "MODE=stack (auto: $n build files)" || echo "MODE=repo (auto: $n build files)";;
esac
```

The `T`/`D` convention below: `T` is the target with flags stripped, `D` falls back to `.`.

## Session output directory

Write the map under this directory (scoped to the current session):

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-session.sh`

## Shared context

!`T="$ARGUMENTS"; T="${T//--repo/}"; T="${T//--stack/}"; T="$(echo $T|xargs)"; D="$T"; [ -d "$D" ] || D="."; cat "$D/CLAUDE.md" 2>/dev/null || cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

!`T="$ARGUMENTS"; T="${T//--repo/}"; T="${T//--stack/}"; T="$(echo $T|xargs)"; D="$T"; [ -d "$D" ] || D="."; cat "$D/DANGER-ZONES.md" 2>/dev/null || echo "No DANGER-ZONES.md found"`

## Graphify availability

```!
graphify --version 2>/dev/null || echo "NOT_INSTALLED"
```

## Prior maps (current session first, then prior, then legacy)

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-collect.sh 'map-codebase.md' || echo "No prior codebase map"`

!`"$CLAUDE_PROJECT_DIR"/.claude/hooks/uv-out-collect.sh 'map-stack.md' || echo "No prior stack map"`

---

# Repo mode

Run this section only when MODE=repo.

## Existing knowledge graph (if previously generated)

```!
T="$ARGUMENTS"; T="${T//--repo/}"; T="${T//--stack/}"; T="$(echo $T|xargs)"; D="$T"; [ -d "$D" ] || D="."; cat "$D/graphify-out/GRAPH_REPORT.md" 2>/dev/null | head -80 || echo "No existing graph found"
```

## Repo output

Write the full map to `map-codebase.md` inside the session output directory shown above
(e.g. `uv-out/sessions/<sid>/map-codebase.md`), stamped with provenance frontmatter
(`session`, `skill: understand`, `created`). It should contain:

- **Architecture overview** — major modules and how they fit together
- **Business domain map** — the real-world concepts the code models
- **Sequence diagrams** (Mermaid) for the key flows
- **Entry points** — main, routes, handlers, CLI commands
- **Danger zones** — fragile areas, high-fan-in modules, missing tests

If Graphify is available, run it first and fold its findings in.

---

# Stack mode

Run this section only when MODE=stack. You are mapping an entire tech stack —
multiple services, how they connect, and the system-level architecture.

## Discover services

```!
T="$ARGUMENTS"; T="${T//--repo/}"; T="${T//--stack/}"; T="$(echo $T|xargs)"; find ${T:-.} -maxdepth 3 \( -name "package.json" -o -name "pom.xml" -o -name "go.mod" -o -name "Cargo.toml" -o -name "requirements.txt" -o -name "setup.py" -o -name "pyproject.toml" \) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -30
```

## Dockerfiles, compose, infra, contracts

```!
T="$ARGUMENTS"; T="${T//--repo/}"; T="${T//--stack/}"; T="$(echo $T|xargs)"; find ${T:-.} -maxdepth 4 \( -name "Dockerfile" -o -name "docker-compose*" -o -name "*.tf" -o -name "Chart.yaml" -o -name "values.yaml" -o -name "*.proto" -o -name "openapi*" -o -name "*.graphql" \) -not -path "*/node_modules/*" 2>/dev/null | head -30
```

## Stack process

1. **Inventory every service** — name, language/framework, what it does, how it deploys.
2. **Map connections BETWEEN services** — REST/HTTP base URLs and clients, gRPC/proto
   stubs, message queues (Kafka/RabbitMQ/SQS topics), shared databases, shared internal
   libraries, service URLs in env vars.
3. **Trace the data flow** — where data enters, how it moves, where it ends up.

## Stack output

Write the full map to `map-stack.md` inside the session output directory shown above
(e.g. `uv-out/sessions/<sid>/map-stack.md`), stamped with provenance frontmatter
(`session`, `skill: understand`, `created`). Include:

- A **System Architecture Diagram** (Mermaid): every service as a node, connections
  labeled (REST, gRPC, Kafka, shared DB), external deps, data stores.
- A **Stack Inventory Table**: Service | Language | Framework | Database | Deploys to | Depends on | Depended on by.
- A **Connection Matrix**: which services talk to which, and how.
- **Danger Zones**: single points of failure, high-inbound-dependency services, shared
  databases, missing monitoring/health checks.

If Graphify is available, run `graphify run [target] --directed` for a unified
cross-service graph and fold its findings in.

---

## Report back

After writing the file, print only a one-line pointer to the terminal — do not repeat
the map. For example:

> Map written to `uv-out/sessions/<sid>/map-codebase.md` — go check it.   (or map-stack.md in stack mode)
