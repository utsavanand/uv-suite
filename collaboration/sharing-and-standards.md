# UV Suite — Collaboration: Sharing and Team Standards

How teams share best practices, mark danger zones, and evolve their AI-assisted development standards together.

---

## The Sharing Problem

When one engineer discovers that "the payments service silently drops webhooks if the payload exceeds 1MB" — how does that knowledge reach the team? Today it's tribal: Slack messages, PR comments, maybe a wiki page nobody reads.

UV Suite makes this systematic. Every piece of hard-won knowledge has a home, a format, and a distribution mechanism.

---

## Knowledge Types and Where They Live

### 1. Danger Zones

**What:** Areas of the codebase where AI agents (and humans) are likely to break things. Code that looks simple but has hidden invariants, undocumented constraints, or historical context that isn't obvious from reading the code.

**Format:** `DANGER-ZONES.md` at the project root (or per-service).

```markdown
# Danger Zones

## payments/webhook-handler.ts
**Risk:** Payload size limit (1MB) is enforced by the gateway, not this service.
If you add fields to the webhook response, you may silently exceed the limit.
**Discovered:** 2026-03-15, production incident PLAT-4521
**Rule:** Any change to webhook payloads must include a size check test.

## auth/session-store.ts  
**Risk:** Sessions are stored in Redis with a 24h TTL, but the JWT expiry is 72h.
If you extend JWT expiry without matching Redis TTL, users get logged out mid-session.
**Discovered:** 2026-01-20, user reports of random logouts
**Rule:** JWT expiry and Redis TTL must always be changed together.

## search/indexer.ts
**Risk:** The Elasticsearch index mapping is append-only in production.
You CANNOT change field types on existing fields — you must create a new index and reindex.
**Discovered:** 2025-11-01, failed deployment
**Rule:** Any search schema change requires a reindex migration plan.
```

**How agents use this:** CLAUDE.md (or equivalent) includes a directive:
```markdown
Before modifying any file, check DANGER-ZONES.md for known risks in that area.
If modifying a danger zone file, flag it to the human before proceeding.
```

**How the team evolves it:**
- After any production incident, add the affected file/module
- During code review, if a reviewer catches a non-obvious risk, add it
- Quarterly: review and prune zones that have been architecturally resolved

### 2. Best Practices (Team-Evolved)

**What:** Patterns the team has converged on through experience. Not theoretical "best practices" from blog posts — things your specific team has validated.

**Format:** `BEST-PRACTICES.md` at the project root, organized by domain.

```markdown
# Team Best Practices

## API Design
- All endpoints return `{ data, error, meta }` envelope
- Pagination uses cursor-based, not offset-based (learned from perf issues at scale)
- Rate limiting is applied at the gateway, not in service code

## Testing
- Integration tests hit real databases, not mocks (mocks diverged from prod in Q4 2025)
- E2E tests use a dedicated test tenant, not fixture data
- Tests must clean up after themselves — no shared state between test cases

## AI Agent Usage
- Let the agent write the first draft, then review before merging
- Never let the agent run `git push` without human confirmation
- Use the anti-slop guard on any PR with >500 lines of generated code
```

**How the team evolves it:**
- Anyone can propose additions via PR
- Practices that cause incidents get promoted to Danger Zones
- Practices nobody follows get removed (dead standards are noise)

### 3. Agent Configurations (Shared)

**What:** The team's customized agent definitions, tuned for their specific codebase and conventions.

**Format:** Committed to the repo in `.claude/agents/`, `.cursor/rules/`, or `.codex/agents/`.

```
.claude/
├── agents/
│   ├── reviewer.md          # Team-customized reviewer
│   ├── test-writer.md       # Knows our testing patterns
│   └── cartographer.md      # Knows our service topology
├── settings.json             # Shared project settings
└── skills/
    └── review/
        └── SKILL.md          # Team review workflow
```

**Key principle:** Agent definitions are **living documents**. The team should evolve them:
- After a reviewer misses a class of bug → update the reviewer's checklist
- After the test writer generates mocked tests when integration tests are required → update the test writer's rules
- After the cartographer misses a key service dependency → update its discovery process

### 4. Portable Standards (Cross-Project)

**What:** Standards that apply across all projects the team works on. Language-agnostic, tool-agnostic.

**Format:** The UV Suite portable standards files, customized for the team:
- `CODING-STANDARDS.md`
- `REVIEW-CHECKLIST.md`
- `SPEC-TEMPLATE.md`
- `ACTS-TEMPLATE.md`

**Distribution:** Published to an internal package/repo that all projects pull from:
```bash
# Option 1: Git submodule
git submodule add git@github.com:team/standards.git .standards/

# Option 2: Package manager
npm install @team/coding-standards --save-dev

# Option 3: Copy and customize (simplest)
cp -r ~/team-standards/ my-project/.standards/
```

---

## The Sharing Lifecycle

### Discovery → Capture → Distribute → Evolve

```
1. DISCOVERY
   Someone learns something the hard way
   (incident, code review, agent misbehavior, customer bug)
   
2. CAPTURE
   Record it in the appropriate format:
   - Danger zone → DANGER-ZONES.md
   - Best practice → BEST-PRACTICES.md
   - Agent improvement → .claude/agents/ update
   - Standard → portable-standards/ update
   
3. DISTRIBUTE
   Make it available to the team and to agents:
   - Commit to repo (agents pick it up automatically)
   - PR for visibility (team reviews and discusses)
   - Link from CLAUDE.md if it's critical enough
   
4. EVOLVE
   Standards decay. Review periodically:
   - Does this danger zone still exist? (Maybe the code was refactored)
   - Does this best practice still apply? (Maybe the framework changed)
   - Is this agent rule too restrictive? (Maybe it blocks valid patterns)
```

---

## Annotation Conventions

### Inline Danger Markers

For code-level annotations, use structured comments that agents can detect:

```typescript
// @danger: This function is called by the cron job AND the API handler.
// Changes must account for both invocation contexts.
// See: DANGER-ZONES.md#dual-invocation-handlers
export function processPayment(payment: Payment): Result {
```

```python
# @danger: This query bypasses the ORM soft-delete filter.
# It returns deleted records intentionally — do not "fix" by adding .filter(deleted=False)
# See: DANGER-ZONES.md#soft-delete-bypass
def get_all_records_including_deleted(tenant_id):
```

**Agent behavior:** When an agent encounters `@danger`, it should:
1. Read the linked DANGER-ZONES.md section
2. Flag the modification to the human before proceeding
3. Include the danger context in its PR description

### Team Annotations for Agent Behavior

```typescript
// @agent-skip: This block was manually optimized. Do not refactor.
// @agent-ask: This logic has edge cases — ask before modifying.
// @agent-test: Any change here requires running the full integration suite.
```

These annotations create a lightweight "human-in-the-loop" layer directly in the code.

---

## Sharing Levels (Recap)

| Level | What you share | How | Audience |
|-------|---------------|-----|----------|
| **1. Personal** | Your UV Suite agents, memory, preferences | `~/.claude/agents/`, memory system | Just you |
| **2. Project** | Project-specific agents, danger zones, standards | Committed to repo in `.claude/`, root `.md` files | Everyone on the project |
| **3. Team** | Cross-project standards, shared agent configs | Internal package or shared repo | Everyone on the team |
| **4. Community** | UV Suite methodology, portable standards | Open-source plugin or published framework | Anyone |

**Start at Level 2.** Most teams get immediate value from committing `.claude/agents/` and `DANGER-ZONES.md` to their repo. Evolve to Level 3 when you have 2+ projects sharing patterns.

---

## Danger Zone Maturity Model

Teams typically evolve through these stages:

### Stage 1: Reactive
- Danger zones are discovered through incidents
- Captured ad-hoc in Slack or PR comments
- No systematic distribution

### Stage 2: Documented
- `DANGER-ZONES.md` exists in key repos
- New dangers are added during incident retros
- Agents are told to check it, but compliance is informal

### Stage 3: Enforced
- Inline `@danger` annotations in code
- Agent hooks automatically flag modifications to danger zone files
- Danger zone reviews are part of the Acts exit criteria

### Stage 4: Predictive
- Team reviews new code for *potential* danger zones before they cause incidents
- The Anti-Slop Guard includes danger zone pattern detection
- Architectural decisions explicitly document which new danger zones they create

**Most teams should aim for Stage 3.** Stage 4 is aspirational and requires mature engineering culture.
