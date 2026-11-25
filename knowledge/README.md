# Knowledge

What the agent reads, named by what it does with each file. One file is always on; the rest load on demand or for the files they cover. Skill-specific guidance lives inside each skill folder.

| Doc | Loaded | What it covers |
|---|---|---|
| [agent-working-rules.md](agent-working-rules.md) | always | How the agent works: honesty, simplicity, surgical changes, verification, destructive actions, the Stuck format. |
| [acts-build-planning.md](acts-build-planning.md) | on demand | Planning a build as Acts: structure, decomposition, sizing, parallelism, cycle budgets and when to stop and ask. Read by `/uvs-architect`. |
| [danger-zones.md](danger-zones.md) | on demand | The `DANGER-ZONES.md` format and the inline `@danger` markers the danger-zone hooks and the reviewer act on. |
| [code-slop-rules.md](code-slop-rules.md) | on demand | The five code slop rules the reviewer and the anti-slop guard check: over-engineering, architecture, error handling, comments, tests. |
| [doc-slop-rules.md](doc-slop-rules.md) | docs files | Vague adjectives and buzzword documentation; path-scoped where the harness allows, always-on elsewhere. |
