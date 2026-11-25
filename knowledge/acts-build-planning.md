# UV Suite — Planning a build as Acts

How the architect turns an approved spec into a plan one developer and several agents can execute. An Act is a sequential delivery phase that produces a complete vertical slice: when it is done, someone can see and use something new.

## What an Act is

| Property | Meaning |
|----------|---------|
| Sequential | Act 2 does not start until Act 1 is complete and verified |
| Self-contained | Each Act delivers usable functionality, not a half-built layer |
| Vertical | Cuts across the stack (DB → API → UI), not one layer |
| Verifiable | Has explicit exit criteria that can be tested |
| Parallel inside | Tasks within an Act run in parallel where they are independent |

An Act is not a horizontal layer ("Act 1: database, Act 2: API"), not a time box, and not a backlog: nothing carries over to the next Act.

## Act structure

```
Act [number]: [Name — what this act delivers]
├── Entry criteria (what must be true before starting)
├── Tasks (parallel where possible)
│   ├── Task 1.1: [description] — Agent: [who]
│   ├── Task 1.2: [description] — Agent: [who]   ← parallel with 1.1
│   └── Task 1.3: [description] — Depends on: 1.1 ← after 1.1
├── Verification checklist
│   ├── [ ] Functional: [user can do X]
│   ├── [ ] Technical: [API returns Y for input Z]
│   └── [ ] Quality: [slop check passed, tests pass]
└── Exit criteria (what must be true before the next Act)
```

- **Entry criteria**: for Act 1, usually "spec approved, architecture designed"; later, "previous Act verified and merged".
- **Tasks**: each independently implementable and testable, a few hours of work, with its dependencies named so parallelism is explicit.
- **Verification**: concrete checks, never "works correctly". "User receives a 401 when the token is expired."
- **Exit criteria**: all checks pass, code reviewed, slop check passed, merged to the working branch.

## Decomposing a project

1. Start from the approved spec.
2. List the 3-5 things a user actually does with the system. Those are the candidate Acts.
3. Order them by dependency: no booking without listings, no listings without auth.
4. Add a foundation Act first (auth, data model, project setup, CI) and a polish Act last (error handling, responsive design, performance, monitoring).
5. Break each Act into tasks and mark what runs in parallel.
6. Assign agents: implementation to the developer, tests to test-writer, review to reviewer, security-sensitive code to a security pass.

Example, a marketplace where hosts list properties and guests book:

| Act | Delivers | Depends on |
|-----|----------|------------|
| 1 | Foundation: auth, schema, CI | — |
| 2 | Hosts create and view listings | 1 |
| 3 | Guests search and browse | 2 |
| 4 | Booking and payment | 3 |
| 5 | Polish: errors, mobile, performance | 4 |

## Task sizing

| Size | Description | Typical duration |
|------|-------------|------------------|
| Small | Single file, straightforward logic | 15-60 minutes |
| Medium | Multi-file, a new endpoint or component | 1-4 hours |
| Large | New feature area, several components | 4-8 hours |

Larger than Large: split it, or make it an Act of its own.

## Parallelism

Can run in parallel: independent features in different modules; tests after the code they test; review, security review and slop check (all reading); documentation; CI setup.

Cannot: code that depends on code not yet written; tasks touching the same files; tasks where one's output is another's input; migrations that depend on each other.

## When to stop and ask

Every task has a cycle budget: the attempts allowed before the agent must escalate. A cycle is one complete attempt (write, run, adjust, rerun), not one tool call.

| Task type | Budget | Why |
|-----------|--------|-----|
| New feature | 3 | By attempt 3 the problem is understanding, not syntax |
| Bug fix with a repro | 2 | The agent has the error and the code; past 2 it needs human context |
| Refactoring | 2 | Rework means the target design was unclear |
| Tests | 3 | Iteration is normal; more means the code is hard to test |
| Review or analysis | 1 | Judgment is presented, not retried |
| Architecture or design | 1 | Present options; do not iterate alone |

The budget is a ceiling. When it is spent, or earlier when the agent sees it is stuck: stop, present what was tried in the Stuck format from agent-working-rules.md, and wait. After human input the budget resets; a second exhaustion means the task needs splitting.

For an ambiguous or contradictory requirement, do not pick silently:

```
## Ambiguity: [brief description]

The conflict: [what contradicts what]
Option A: [approach] — tradeoff: [what you lose]
Option B: [approach] — tradeoff: [what you lose]
My lean: [which and why]
What I need: your call.
```

Every Act boundary is a mandatory checkpoint: present the completed Act's verification results, what the next Act delivers, and any decision needed before it starts.

## Planning template

```markdown
# [Project] — Acts plan

## Acts summary
| Act | Delivers | Size | Depends on |
|-----|----------|------|------------|
| 1 | [what] | [S/M/L] | — |

## Act [N]: [Name]
**Delivers:** [what the user can do after this Act]
**Entry criteria:** [what must be true first]

### Tasks
| # | Task | Depends on | Agent | Size | Cycle budget |
|---|------|------------|-------|------|--------------|
| N.1 | [description] | None | [who] | [S/M/L] | [n] |

### Verification
- [ ] [concrete, testable check]

### Exit criteria
[what must be true before moving on]
```

## Anti-patterns

| Anti-pattern | Looks like | Instead |
|--------------|-----------|---------|
| Horizontal Acts | Act 1 all DB, Act 2 all API, Act 3 all UI | Each Act is a vertical slice |
| Mega-Act | One Act with 20 tasks | 2-3 Acts of 3-7 tasks |
| Micro-Act | An Act with 1 task | Merge with a neighbour |
| No exit criteria | "Act 1 done", nothing testable | Explicit checks |
| All sequential | No parallelism inside an Act | Find the independent tasks |
| Skipping review | "I'll review at the end" | Review after each Act |
| No foundation or polish Act | Jump to features, stop at "it works" | Act 1 sets up, the last Act hardens |
