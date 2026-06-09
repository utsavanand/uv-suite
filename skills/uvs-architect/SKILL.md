---
name: architect
description: >
  Design system architecture and decompose work into Acts with tasks, dependencies, and cycle budgets.
  Use after a spec is approved, before coding begins.
argument-hint: "[spec-file-or-description]"
user-invocable: true
context: fork
agent: architect
model: claude-opus-4-6
effort: high
allowed-tools:
  - Read(*)
  - Grep(*)
  - Glob(*)
  - Write(uv-out/**)
  - AskUserQuestion
  - Agent(*)
  - WebSearch
  - WebFetch
  - Bash(git log *)
---

## Input

$ARGUMENTS

## Session output directory

Write architecture artifacts under this directory (scoped to the current session):

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-session.sh`

## Step 0 — REQUIRE a curated spec (HARD GATE — do this before anything else)

**Architecture is designed _from_ a spec. Do not design without one. Do not proceed past
this step until a real spec is in hand.** A "curated spec" is a spec document with a
problem statement, requirements, and success criteria — **not** a one-line description.

Resolve the spec in this exact order:

1. **`$ARGUMENTS` names a spec file** → `Read` it in full. Proceed.
2. **A spec exists in the CURRENT session** (see "Available specs" below) → `Read` the
   newest one in full. Proceed.
3. **Only PRIOR-session specs exist** → ask with `AskUserQuestion` which to use (list each
   with its session + date, default newest). `Read` it. Proceed.
4. **No spec anywhere** (and `$ARGUMENTS` is empty or just a vague phrase) → **STOP. Do NOT
   architect.** Ask with `AskUserQuestion`, offering:
   - **Run `/spec` first** (recommended — architecture needs a curated spec), or
   - **Describe the problem now** → if they choose this, draft a brief spec inline
     (problem · requirements · success criteria), **confirm it with the user**, and only
     then continue to design from it.

   Never invent requirements, and never design from a single sentence — if that's all you
   have, you are in case 4.

If you cannot satisfy one of cases 1–3 or complete case 4's confirmation, **end here** with
a one-line explanation. Designing without a spec is a failure, not a fallback.

## Project context

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Available specs (current session first, then prior, then legacy)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-collect.sh 'specs/*.md' || echo "No specs found"`

## Prior analysis

### Codebase map (current session first)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-collect.sh 'map-codebase.md' || echo "No codebase map"`

### Prior design constraints (reuse or update these — don't re-ask from scratch)

!`"${CLAUDE_PROJECT_DIR:-.}"/.claude/hooks/uv-out-best.sh 'architecture/constraints.md' 80 || echo "No prior constraints — gather fresh"`

### Session checkpoint

!`cat uv-out/current/checkpoints/latest.md 2>/dev/null | head -40 || echo "No checkpoint"`

## Step 1 — Establish design constraints (scaling & risk factors)

Right-sizing requires knowing the constraints — without them you can't run the Challenge
Test or judge what's over-engineering.

**If a prior `architecture/constraints.md` is loaded above, start from it — don't re-ask
from scratch.** Reconcile it:
- If the user's request already says what changed (e.g. `/architect update constraints:
  now 10× users`), apply that delta.
- Otherwise present the prior constraints and ask with `AskUserQuestion` whether to reuse
  as-is or update specific factors.
Carry unchanged factors forward verbatim; only revisit what changed.

**If there are no prior constraints**, gather them: take each factor from the spec's
non-functional requirements where stated; for anything missing, **ask the user with
`AskUserQuestion`** (group related questions; don't re-ask what the spec already answers).
For a trivial change, state your assumptions instead of asking.

Capture:
- **Scale** — customers/users today and the ~12-month expectation; requests/sec; data volume.
- **Team** — size and what they're fluent in (languages, infra). Bias toward the team's
  stack; don't design around tech they'd have to learn unless a requirement demands it.
- **Availability** — target (best-effort / 99.9% / 99.99%) and maintenance-window tolerance.
- **Consistency (CAP)** — under a network partition, prefer consistency or availability?
  Where is strong consistency actually required vs eventual acceptable?
- **Security & privacy** — sensitive data / PII? Compliance (GDPR, HIPAA, PCI, SOC 2)?
- **Fault tolerance & cost of failure** — blast radius if it fails or is wrong (internal
  toy vs revenue- or safety-critical). This sets how much resilience to invest.

These constraints drive everything downstream: pass them to the specialists in Step 2, and
use them for the Challenge Test in Step 3. **Write the reconciled set to
`<session-output-dir>/architecture/constraints.md` now** (the session dir printed above),
before designing — overwriting any prior version, and noting what changed if you updated
it. This keeps one current, auditable record of what the design is right-sized against.

## Step 2 — Consult domain specialists (only the relevant ones)

With the spec in hand, identify which domains it actually touches and consult **only those**
specialists — skip the rest and document which you skipped and why.

| Specialist | Consult when the spec involves |
|---|---|
| `distributed-systems` | meaningful scale, multiple services, messaging/queues, consistency, caching, fault tolerance |
| `llm-ai-engineering` | LLM/agent features — RAG, tools, prompts, evals, inference cost/latency |
| `ml-systems` | model training/serving, data/feature pipelines, model lifecycle/monitoring |
| `full-stack` | a web/product app — frontend/backend/API, state, auth, data layer |

For each relevant specialist, read `.claude/skills/architect/specialists/<name>.md` and
dispatch it via `Agent(general-purpose)`, passing the specialist prompt + the spec + the
codebase map. They run in parallel and return scoped, slop-guarded recommendations (with
sources where they researched).

**Most systems need 0–2 specialists.** A simple CRUD app may need none — don't consult a
specialist to look thorough. Consulting one is only worthwhile when a domain genuinely
shapes the design.

## Step 3 — Design and decompose into Acts

Synthesize the spec + any specialist input into the architecture and the Acts breakdown
(per your agent instructions). Apply `guardrails/architecture-slop.md` to the synthesis:
**every component must trace to a requirement.** Fold in a specialist recommendation only
where a requirement justifies it; call out what you deliberately kept simple.
