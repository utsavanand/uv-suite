# UV Acts — Human-in-the-Loop Framework

When working with AI agents, the instinct is to let them run. But unchecked agent cycles are expensive, produce diminishing returns, and miss opportunities where a human can inject irreplaceable value. This framework codifies **when** and **how** humans intervene in UV Acts.

---

## The Core Principle: Cycle Budgets

Every agent task gets a **cycle budget** — the maximum number of attempts before the agent must escalate to the human.

| Task type | Default budget | Rationale |
|-----------|---------------|-----------|
| Code generation (new feature) | 3 cycles | If the approach isn't working by attempt 3, the problem isn't syntax — it's understanding |
| Bug fix (known repro) | 2 cycles | Agent has the error and the code. If it can't fix in 2, it needs human context |
| Refactoring | 2 cycles | Refactoring that needs rework usually means the target design wasn't clear |
| Test writing | 3 cycles | Tests often need iteration, but >3 means the code itself is hard to test |
| Review / analysis | 1 cycle | Judgment tasks shouldn't retry — they should present findings and let the human decide |
| Architecture / design | 1 cycle | Design is inherently collaborative. Present options, don't iterate alone |

**The budget is a ceiling, not a target.** If the agent recognizes it's stuck after 1 cycle, it should escalate immediately rather than burning the remaining budget.

### What Counts as a Cycle?

A cycle is one **complete attempt** at the task — not one tool call. If the agent writes code, runs tests, sees failures, adjusts the code, and reruns tests — that's one cycle. The cycle ends when either:
- The task succeeds (exit)
- The agent believes it has a working solution and stops (exit)
- Tests/verification fail and the agent decides to try a different approach (new cycle)

---

## The Four Intervention Types

### 1. Teach & Train

**When:** The agent produces technically valid output that misses context only a human has — domain knowledge, organizational conventions, unstated preferences, historical decisions.

**Trigger signals:**
- Agent asks a question you know the answer to
- Agent makes a choice that's "correct but not how we do it here"
- Agent doesn't know about a prior incident, decision, or constraint
- You see a pattern you want the agent to follow going forward

**What the human does:**
- Explains the missing context
- Provides examples of the preferred approach
- Adds the knowledge to CLAUDE.md, memory, or a portable standard so the agent retains it

**Agent learning loop:**
```
Agent produces output → Human corrects with context
→ Human saves correction as:
  - CLAUDE.md rule (project-level, persistent)
  - Memory entry (personal, cross-project)
  - Portable standard update (team-level, shared)
→ Agent applies in future tasks without re-teaching
```

**Examples:**
- "We never use `any` in this codebase — use `unknown` and narrow"
- "The payments service is deprecated; new code should use the billing-v2 API"
- "We name database migrations with the ticket number prefix: `PLAT-1234_add_user_roles`"

### 2. Debug & Unblock

**When:** The agent has exhausted its cycle budget or is visibly looping on the same error.

**Trigger signals:**
- Agent has tried 2-3 approaches and none work
- Error messages are environmental (permissions, network, config) not logical
- The agent is changing things that shouldn't need changing
- The fix requires access the agent doesn't have (VPN, admin console, another person's system)

**What the human does:**
- Reads the agent's attempts and identifies the root cause
- Provides the missing piece (a config value, a workaround, a corrected assumption)
- If the issue is environmental, fixes it directly and tells the agent to proceed
- Optionally: teaches the agent the diagnostic approach for next time

**Escalation format the agent should use:**
```markdown
## Stuck: [brief description]

**What I tried:**
1. [Approach 1] — failed because [reason]
2. [Approach 2] — failed because [reason]

**My hypothesis:** [What I think is wrong]
**What I need:** [Specific question or action from the human]
```

### 3. Taste & Value

**When:** The decision is subjective, aesthetic, or strategic — not something that can be verified by tests.

**Trigger signals:**
- Naming decisions (API routes, component names, project structure)
- UX choices (error messages, onboarding flow, information hierarchy)
- Architecture tradeoffs where both options are valid
- Presentation design (slide order, visual emphasis, narrative arc)
- Prioritization (which feature first, what to cut for MVP)

**What the human does:**
- Makes the subjective call
- Explains *why* — so the agent can internalize the preference for similar future decisions
- Optionally: establishes a principle that covers a class of decisions

**Examples:**
- "Name it `booking-confirmation` not `reservation-complete` — we use the word 'booking' everywhere in our product"
- "Move the error state above the form, not below — users miss it at the bottom"
- "Cut the admin dashboard from MVP. Ship the core flow first."

**Key insight:** Taste compounds. Every taste decision the human explains is one the agent can approximate next time. This is the highest-leverage intervention type for long-term agent quality.

### 4. Resolve Ambiguity

**When:** Requirements are unclear, contradictory, or have implicit tradeoffs the agent can't resolve alone.

**Trigger signals:**
- Spec says one thing, existing code does another
- Two requirements conflict (e.g., "fast response times" vs "comprehensive validation")
- The agent needs to make an assumption it's not confident about
- A decision has downstream consequences the agent can see but can't evaluate

**What the human does:**
- Clarifies the requirement
- Makes the tradeoff decision
- Identifies which stakeholder to consult if neither human nor agent knows
- Documents the decision for future reference

**Agent escalation format:**
```markdown
## Ambiguity: [brief description]

**The conflict:** [What contradicts what]
**Option A:** [Approach] — tradeoff: [what you lose]
**Option B:** [Approach] — tradeoff: [what you lose]
**My lean:** [Which I'd pick and why]
**What I need:** Your call on which direction.
```

---

## Intervention Points in the Acts Workflow

### At Act Boundaries (Mandatory)

Every transition between Acts is a **mandatory human checkpoint**. The agent presents:
1. What was accomplished in the completed Act (verification checklist results)
2. What the next Act will deliver
3. Any questions or decisions needed before proceeding

**Why mandatory:** Act transitions are the highest-leverage review points. Catching a wrong direction here saves hours of wasted agent cycles.

### Within Acts (Triggered)

| Trigger | Intervention type | What happens |
|---------|------------------|--------------|
| Cycle budget exhausted | Debug & Unblock | Agent stops, presents what it tried, asks for help |
| Subjective decision point | Taste & Value | Agent presents options, human chooses |
| Ambiguous requirement found | Resolve Ambiguity | Agent presents the conflict, human decides |
| New pattern to establish | Teach & Train | Human notices an opportunity to establish a reusable standard |

### During Review (Optional)

The Reviewer and Anti-Slop agents present findings. The human decides:
- Which findings to address now vs. defer
- Whether a "slop" finding is actually intentional
- Whether to override a quality gate for pragmatic reasons

---

## The Cycle Budget in Practice

### Setting Up Cycle Budgets

In your Acts plan, annotate each task with its cycle budget:

```markdown
| # | Task | Agent | Size | Cycle Budget |
|---|------|-------|------|-------------|
| 2.1 | Listing DB schema | You | S | 2 |
| 2.2 | Listing API endpoints | You | M | 3 |
| 2.3 | Image upload to S3 | You | M | 2 (env-sensitive) |
| 2.4 | Create listing UI | You | L | 3 |
```

**Adjust budgets based on risk:**
- Environment-sensitive tasks (cloud services, auth, payments): lower budget (2) — failures are often config, not logic
- Greenfield code generation: standard budget (3) — iteration is expected
- Review/judgment tasks: budget of 1 — present findings, don't retry

### What Happens When Budget Is Exhausted

1. **Agent stops immediately.** No "one more try."
2. **Agent presents the escalation** using the structured format above.
3. **Human intervenes** with one of the four intervention types.
4. **Budget resets** after human input. The agent gets a fresh budget for the revised approach.
5. **If budget exhausted again:** The task likely needs decomposition. Break it into smaller sub-tasks.

---

## Measuring HITL Effectiveness

Over time, track:

| Metric | What it tells you | Target |
|--------|-------------------|--------|
| **Intervention rate** | % of tasks requiring human help | Decreasing over time (agent learns) |
| **Teach-to-reuse ratio** | How often a teaching intervention prevents future ones | High (each lesson learned permanently) |
| **Cycle-to-completion** | Average cycles before task completes | Decreasing (agent getting better) |
| **Escalation accuracy** | Does the agent escalate at the right time? | Agent neither too early (timid) nor too late (stubborn) |

**The goal is not zero interventions.** The goal is that each intervention makes the next one unnecessary. A well-calibrated system has humans intervening on *novel* problems, not on problems the agent should have learned from.

---

## HITL and Agent Memory

Every human intervention is a learning opportunity. The framework for capturing that:

```
Intervention happens
  → Was this a novel situation? (If no, the agent should have known — check why it didn't)
  → Is this reusable? (If yes, persist it)
    → Project-specific → Add to CLAUDE.md or project rules
    → Personal preference → Add to memory (UV Index)
    → Team standard → Add to portable standards (collaboration)
  → Was the escalation well-formed? (If no, refine the agent's escalation prompts)
```

This is where **UV Index** (the learning/context layer) and **UV Acts** (the delivery layer) connect: every human intervention in UV Acts generates a learning artifact for UV Index.
