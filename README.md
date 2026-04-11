# UV Suite

A personal, portable framework for AI-assisted software development. Take it to any codebase, any team, any AI coding tool.

---

## What Is UV Suite?

UV Suite is a methodology and toolkit for how you approach software — from understanding an existing codebase on day one, to shipping production features through structured delivery, to reviewing and hardening what you've built. It's designed around AI coding agents but the thinking applies with or without them.

**UV Suite is agnostic.** It is not locked to Claude Code, Cursor, or Codex. The core methodology is pure Markdown — tool-independent. Implementation wrappers adapt it to whichever AI coding tool you're using today.

---

## The Three Subsystems

UV Suite is organized into three named subsystems. Each handles a distinct phase of software work, and each builds on the others.

```
┌─────────────────────────────────────────────────────────┐
│                       UV Suite                          │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  UV Index    │  │  UV Acts    │  │  UV Guard   │     │
│  │             │  │             │  │             │     │
│  │  Understand  │→│  Build      │→│  Harden     │     │
│  │  Learn       │  │  Deliver    │  │  Review     │     │
│  │  Remember    │  │  Present    │  │  Protect    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  Context &         Delivery &        Quality &          │
│  Intelligence      Execution         Guardrails         │
└─────────────────────────────────────────────────────────┘
```

### UV Index — Understand, Learn, Remember

UV Index is the intelligence layer. Before you build, you need context — about the codebase, the domain, the conventions, the history. UV Index covers:

- **Codebase mapping** — The Cartographer agent generates architecture diagrams, dependency graphs, business domain maps, and sequence diagrams
- **Context capture** — Learning about databases, APIs, service topologies, and undocumented conventions
- **Memory** — Persisting what you learn so agents don't re-discover it. Project-level memory (CLAUDE.md, portable standards), personal memory (UV Index skill library, agent memory), and team memory (shared standards, danger zones)
- **Documentation generation** — Producing structured documentation from code analysis, not from templates

**Key agents:** Cartographer

**Key artifacts:** Architecture maps, dependency graphs, CLAUDE.md, memory entries, danger zone annotations

**See:** [Agent Catalog — Cartographer](agents.md#1-cartographer-agent) | [Collaboration — Sharing & Standards](collaboration/sharing-and-standards.md)

### UV Acts — Build, Deliver, Present

UV Acts is the delivery layer. It replaces ad-hoc development with **spec-driven delivery through Acts** — sequential phases where each one tells a complete story.

- **The Acts methodology** — Sequential delivery phases with parallel tasks within. Each Act delivers a complete vertical slice of functionality
- **Human-in-the-loop** — Principled framework for when and how humans intervene: to teach, to debug, to add taste, to resolve ambiguity. Agents have cycle budgets and escalation protocols
- **Code generation** — Spec → Architecture → Acts → Tasks → Code, with dedicated agents at each step
- **Presentations & prototypes** — The Prototype Builder and Acts & Slides skill create interactive demos, stakeholder decks, and static-site prototypes
- **Mocks & scaffolding** — Rapidly building functional prototypes that validate concepts before full implementation

**Key agents:** Spec Writer, Architect, Test Writer, Eval Writer, Prototype Builder, DevOps

**Key artifacts:** Specs, Acts plans, code, tests, presentations, prototypes

**See:** [Acts Methodology](methodology/acts.md) | [Human-in-the-Loop](methodology/human-in-the-loop.md) | [Agent Catalog](agents.md)

### UV Guard — Review, Harden, Protect

UV Guard is the quality layer. AI-generated code can be subtly wrong: plausible-sounding architecture that doesn't hold up, boilerplate comments that obscure meaning, tests that pass but don't actually test anything.

- **Anti-slop detection** — Catching AI-generated low-quality output across code, tests, docs, and architecture
- **Code review** — Correctness, security, performance, and maintainability checks
- **Security audit** — OWASP top 10, dependency vulnerabilities, auth/payment-sensitive code review
- **Danger zone enforcement** — Flagging modifications to known-risky areas before the agent proceeds

**Key agents:** Reviewer, Anti-Slop Guard, Security Agent

**Key artifacts:** Review reports, slop findings, security audit results, danger zone alerts

**See:** [Anti-Slop Guardrails](anti-slop.md) | [Collaboration — Danger Zones](collaboration/sharing-and-standards.md#1-danger-zones) | [Agent Catalog — Reviewer](agents.md#4-reviewer-agent)

---

## Agent Catalog (Summary)

UV Suite defines 10 agent roles. Each has a clear purpose, inputs, outputs, and invocation pattern. They are designed as **roles**, not tool-specific implementations — you implement them as Claude Code subagents, Cursor rules, Codex agents, or manual checklists.

| # | Agent | Subsystem | Purpose | When to invoke |
|---|-------|-----------|---------|----------------|
| 1 | **Cartographer** | UV Index | Map a codebase: architecture, dependencies, domains, sequences | Entering a new codebase or unfamiliar area |
| 2 | **Spec Writer** | UV Acts | Convert requirements into technical specifications | Starting any new feature or project |
| 3 | **Architect** | UV Acts | Design system architecture and decompose into Acts | After spec is approved, before coding begins |
| 4 | **Reviewer** | UV Guard | Code review for bugs, quality, security | Before every merge; on-demand during development |
| 5 | **Test Writer** | UV Acts | Generate unit, integration, and e2e tests | After implementation, before review |
| 6 | **Eval Writer** | UV Acts | Write evaluations for AI system prompts | When building or modifying AI/LLM features |
| 7 | **Anti-Slop Guard** | UV Guard | Detect AI-generated slop in code, docs, architecture | Continuous — runs as a review layer |
| 8 | **Prototype Builder** | UV Acts | Build static-site prototypes and interactive demos | Exploring UX, validating concepts, stakeholder demos |
| 9 | **DevOps Agent** | UV Acts | CI/CD, infrastructure-as-code, deployment automation | Setting up pipelines, debugging deploys |
| 10 | **Security Agent** | UV Guard | Vulnerability scanning, OWASP checks, dependency audit | Pre-merge security review, periodic audits |

Full specifications: [agents.md](agents.md)

---

## Human-in-the-Loop

UV Acts includes a principled framework for human intervention. The core insight: **unchecked agent cycles are expensive and produce diminishing returns.** Humans add irreplaceable value at specific moments.

### Cycle Budgets

Every agent task gets a maximum number of attempts before escalating to the human. Code generation gets 3 cycles. Bug fixes get 2. Review and architecture get 1 (present findings, don't iterate alone).

### Four Intervention Types

| Type | When | What the human adds |
|------|------|---------------------|
| **Teach & Train** | Agent produces valid output that misses context | Domain knowledge, conventions, historical decisions |
| **Debug & Unblock** | Agent exhausted its cycle budget | Root cause diagnosis, environmental fixes, missing config |
| **Taste & Value** | Decision is subjective or aesthetic | Naming, UX choices, architecture tradeoffs, prioritization |
| **Resolve Ambiguity** | Requirements are unclear or contradictory | Clarification, tradeoff decisions, stakeholder alignment |

### The Learning Loop

Every human intervention is a learning opportunity. Teach & Train interventions get persisted — to CLAUDE.md (project), to memory (personal), or to portable standards (team) — so the agent doesn't need re-teaching.

Full framework: [Human-in-the-Loop](methodology/human-in-the-loop.md)

---

## Collaboration & Sharing

UV Suite is designed for teams, not just individuals. Knowledge sharing happens at four levels:

| Level | What you share | Mechanism |
|-------|---------------|-----------|
| **Personal** | Your agents, memory, preferences | `~/.claude/agents/`, memory system |
| **Project** | Project-specific agents, danger zones, standards | Committed to repo in `.claude/`, root `.md` files |
| **Team** | Cross-project standards, shared agent configs | Internal package or shared repo |
| **Community** | UV Suite methodology, portable standards | Open-source plugin or published framework |

### Danger Zones

Teams mark risky areas of the codebase in `DANGER-ZONES.md` — areas where AI agents are likely to break things due to hidden invariants. Agents check this file before modifying flagged code and escalate to the human.

### Team-Evolved Standards

Best practices, agent configurations, and guardrail rules are **living documents** that evolve through team use. Every incident, every review finding, every agent correction becomes a captured improvement.

Full guide: [Sharing & Standards](collaboration/sharing-and-standards.md)

---

## Portability

| Layer | What it is | Portable? |
|-------|-----------|-----------|
| **Methodology** | Acts framework, agent roles, HITL, review checklists | Yes — pure Markdown, works anywhere |
| **Standards** | Coding standards, naming conventions, danger zones | Yes — tool-agnostic Markdown |
| **Agent definitions** | Claude Code subagents, Cursor rules, Codex agents | No — tool-specific wrappers around portable core |
| **Skills/commands** | `/review`, `/spec`, `/map-codebase` | No — tool-specific invocations |
| **Hooks/automation** | Pre-commit checks, auto-review triggers | No — tool-specific configuration |

See: [Portable Standards](portable-standards.md) | [Installation Guide](installation/install-guide.md) | [Tool Comparison](tool-comparison.md)

---

## Installation

### One-liner (Claude Code)

```bash
cp ~/uv-suite/agents/claude-code/*.md ~/.claude/agents/
```

### Per-agent install

Only install what you need. Start with the Cartographer and Reviewer — add agents as your workflow demands them.

```bash
# Just the reviewer
cp ~/uv-suite/agents/claude-code/reviewer.md ~/.claude/agents/

# Just the anti-slop guard
cp ~/uv-suite/agents/claude-code/anti-slop-guard.md ~/.claude/agents/
```

### Extensible by design

- **One file per agent** — install, customize, or replace individually
- **One file per guardrail rule** — adopt incrementally, add custom rules
- **Portable standards** — the source of truth, from which tool-specific wrappers are generated

Full guide: [Installation](installation/install-guide.md)

---

## Document Index

### Core

| Document | What it covers |
|----------|---------------|
| [agents.md](agents.md) | Full specifications for all 10 agents — purpose, inputs, outputs, implementation |
| [acts-methodology.md](acts-methodology.md) | The Acts delivery framework — philosophy, structure, worked examples |
| [anti-slop.md](anti-slop.md) | Anti-slop guardrails — detecting and preventing AI-generated low-quality output |

### Methodology

| Document | What it covers |
|----------|---------------|
| [methodology/human-in-the-loop.md](methodology/human-in-the-loop.md) | When and how humans intervene — cycle budgets, intervention types, learning loops |

### Collaboration

| Document | What it covers |
|----------|---------------|
| [collaboration/sharing-and-standards.md](collaboration/sharing-and-standards.md) | How teams share practices, mark danger zones, evolve standards |

### Setup

| Document | What it covers |
|----------|---------------|
| [installation/install-guide.md](installation/install-guide.md) | How to install, configure, and extend UV Suite for each tool |
| [best-practices.md](best-practices.md) | Subagent patterns, remote sessions, cost optimization, daily workflow |
| [portable-standards.md](portable-standards.md) | Universal standards and tool-specific templates |
| [tool-comparison.md](tool-comparison.md) | Claude Code vs Cursor vs Codex — deep comparison with portability matrix |

---

## Design Principles

1. **Portable first** — Methodology is Markdown. Tool-specific implementations are thin wrappers.
2. **Agents are roles, not implementations** — The Reviewer role exists whether you implement it as a Claude subagent, a Cursor rule, or a mental checklist.
3. **Acts over sprints** — Sequential phases with parallel tasks within. Each Act delivers a complete slice.
4. **Human-in-the-loop by design** — Agents escalate. Humans teach. The system learns. Every intervention makes the next one unnecessary.
5. **Anti-slop by default** — Every review includes slop detection. AI output is guilty until proven useful.
6. **Share everything** — Standards, agents, danger zones, and skills are designed to be committed to repos and shared with teams.
7. **Earn complexity** — Start with the Cartographer and Reviewer. Add agents as your workflow demands them.
8. **One file, one concern** — Each agent, each guardrail rule, each standard is a single file you can install, customize, or replace independently.
