# Stack mode

Map an entire tech stack — multiple services, how they connect, and the system-level
architecture.

The orchestrator has already loaded for you: the target (`$ARGUMENTS`), the chosen
`MODE`, the session output directory, the target's CLAUDE.md / DANGER-ZONES.md, Graphify
availability, the **service discovery + Dockerfile/infra/contract listings**, and any
prior `map-stack.md` artifacts. Use them; don't re-fetch.

## Process

If Graphify is available (see the orchestrator's availability check), run
`graphify run [target] --directed` for a unified cross-service graph and fold its
findings into the map below.

1. **Inventory every service** — name, language/framework, what it does, how it deploys.
2. **Map connections BETWEEN services** — REST/HTTP base URLs and clients, gRPC/proto
   stubs, message queues (Kafka/RabbitMQ/SQS topics), shared databases, shared internal
   libraries, service URLs in env vars.
3. **Trace the data flow** — where data enters, how it moves, where it ends up.

## Output

Write the full map to `map-stack.md` inside the session output directory printed by the
orchestrator (e.g. `uv-out/sessions/<sid>/map-stack.md`), stamped with provenance
frontmatter (`session`, `skill: understand`, `created`). Include:

- A **System Architecture Diagram** (Mermaid): every service as a node, connections
  labeled (REST, gRPC, Kafka, shared DB), external deps, data stores.
- A **Stack Inventory Table**: Service | Language | Framework | Database | Deploys to | Depends on | Depended on by.
- A **Connection Matrix**: which services talk to which, and how.
- **Danger Zones**: single points of failure, high-inbound-dependency services, shared
  databases, missing monitoring/health checks.

## Report back

After writing the file, print only a one-line pointer to the terminal — do not repeat
the map. For example:

> Map written to `uv-out/sessions/<sid>/map-stack.md` — go check it.
