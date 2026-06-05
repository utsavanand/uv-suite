# Repo mode

Map one codebase: architecture, business domains, key flows, entry points, danger zones.

The orchestrator has already loaded for you: the target (`$ARGUMENTS`), the chosen
`MODE`, the session output directory, the target's CLAUDE.md / DANGER-ZONES.md, Graphify
availability, the **existing knowledge graph** (if any), and any prior `map-codebase.md`
artifacts. Use them; don't re-fetch.

## Process

If Graphify is available (see the orchestrator's availability check), run it first and
fold its findings into the map below.

1. **Map the architecture** — identify major modules and how they fit together.
2. **Map the business domain** — the real-world concepts the code models.
3. **Trace the key flows** — the paths a request/job takes through the system.
4. **Find the entry points** — main, routes, handlers, CLI commands.
5. **Flag the danger zones** — fragile areas, high-fan-in modules, missing tests.

## Output

Write the full map to `map-codebase.md` inside the session output directory printed by
the orchestrator (e.g. `uv-out/sessions/<sid>/map-codebase.md`), stamped with provenance
frontmatter (`session`, `skill: understand`, `created`). It should contain:

- **Architecture overview** — major modules and how they fit together
- **Business domain map** — the real-world concepts the code models
- **Sequence diagrams** (Mermaid) for the key flows
- **Entry points** — main, routes, handlers, CLI commands
- **Danger zones** — fragile areas, high-fan-in modules, missing tests

## Report back

After writing the file, print only a one-line pointer to the terminal — do not repeat
the map. For example:

> Map written to `uv-out/sessions/<sid>/map-codebase.md` — go check it.
