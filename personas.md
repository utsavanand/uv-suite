# UV Suite — Personas

UV Suite has different modes for different contexts. You don't need the same rigor when prototyping a demo as when modifying a production payments service. Personas configure the cost, autonomy, and guardrail intensity to match your situation.

---

## The 7 Knobs

Every persona is a `settings.json` file that tunes these 7 configuration knobs:

| # | Knob | What it controls | How it's set |
|---|------|-----------------|--------------|
| **1** | `model` | Default model for the session | `claude-sonnet-4-6`, `claude-opus-4-6`, or inherit from session |
| **2** | `effort` | How much reasoning depth the model applies | `low` → `medium` → `high` → `max` |
| **3** | `permissions.allow` | Tools Claude can use **without asking you** | Narrow (read-only) → Selective → Wide open |
| **4** | `permissions.deny` | Tools Claude is **hard-blocked from** | Many blocks → Few → Almost none |
| **5** | `hooks` (PreToolUse) | Checks that run **before** Claude acts | None → Danger zone warnings → Destructive command blocks |
| **6** | `hooks` (PostToolUse) | Checks that run **after** Claude acts | None → Auto-lint → Lint + real-time Haiku slop check |
| **7** | `hooks` (Stop) | What happens when the session ends | Nothing → Review reminder if uncommitted changes |

Plus two things controlled by which files get installed:
- **Guardrails** (`.claude/rules/*.md`) — anti-slop rules Claude reads as context while writing code
- **Which agents are allow-listed** — controls which skills/subagents can be spawned

### How each knob maps across personas

```
Knob                  Spike          Sport          Professional     Auto
────                  ─────          ─────          ────────────     ────
model                 opus           sonnet         (inherit)        (inherit)
effort                max            high           high             max
permissions.allow     read + write   wide open      selective        everything
                      docs only
permissions.deny      edit/commit/   (none)         destructive      minimal
                      push/run
hooks.PreToolUse      none           none           block-destruct   block-destruct
                                                    + danger-zone
hooks.PostToolUse     doc-slop       lint           lint + slop      lint
hooks.Stop            none           none           review-remind    none
guardrails installed  doc-slop only  no             yes (all 6)      yes (all 6)
agents allowed        5              3              all 10           all 10
```

---

## The Four Personas

### UV Sport — Fast and flexible, for new things

**Use when:** Prototyping, demos, hackathons, new project scaffolding, concept exploration, presentations, building from scratch.

**Philosophy:** Move fast. Slop is tolerable because the code isn't going to production yet. Token cost should be low. Agents should be autonomous — don't slow down with review gates on exploratory code.

| Setting | Value | Why |
|---------|-------|-----|
| **Default model** | Sonnet | Speed over depth. Prototypes need fast iteration. |
| **Effort** | medium | Don't overthink a demo |
| **Hooks active** | auto-lint only | No slop checks, no danger zones, no review reminders. You're building new code. |
| **Agents available** | Prototype Builder, Cartographer, Spec Writer | Build fast. Understand quickly. Don't need heavy review. |
| **Cycle budgets** | 5 for all | Let agents iterate longer. New code is trial-and-error. |
| **Human checkpoints** | End of prototype only | No Act-boundary gates. Build continuously. |
| **Guardrails** | Off | No anti-slop rules. Don't constrain creativity. |
| **Cost profile** | Low (~$0.50-2 per session) | Sonnet, no Opus review agents, minimal hooks |

**Typical workflow:**
```
/spec "quick event booking app"    → 5-min spec, no approval gate
/architect "the spec above"        → Simple Acts, no cycle budgets
(build continuously)               → Sonnet, fast, autonomous
/prototype "event booking demo"    → Full interactive demo
```

### UV Professional — Full rigor, for production code

**Use when:** Production codebases, existing services, teams, code that other people depend on. Any code that will be merged, deployed, or maintained.

**Philosophy:** Every line earns its place. Slop is caught in real-time. Reviews happen at every Act boundary. Security is checked on sensitive code. Danger zones are enforced. Token cost is higher because quality matters more than speed.

| Setting | Value | Why |
|---------|-------|-----|
| **Default model** | Opus for judgment, Sonnet for generation | Best reasoning for review/architecture, fast generation for code |
| **Effort** | high | Thorough analysis on production code |
| **Hooks active** | All 5 | Auto-lint, slop check, danger zones, destructive blocks, review reminders |
| **Agents available** | All 10 | Full arsenal. Security, anti-slop, eval writer — all of it. |
| **Cycle budgets** | Standard (1-3 per task type) | Tight budgets force early escalation |
| **Human checkpoints** | Every Act boundary + every merge | Mandatory human review before progressing |
| **Guardrails** | All 6 rules active | Every anti-slop rule in .claude/rules/ |
| **Cost profile** | Higher (~$5-20 per session) | Opus for reviews, Haiku hooks on every write, full security |

**Typical workflow:**
```
/map-codebase src/payments/        → Deep architecture map before touching anything
/spec "add webhook retry logic"    → Full spec, human approves
/architect "the spec above"        → Detailed Acts with cycle budgets, human approves
(build Act by Act)                 → Sonnet for code, hooks catch slop in real-time
/review                            → Opus review at end of each Act
/security-review src/payments/     → Full OWASP audit before merge
/slop-check                        → Final slop sweep
```

### UV Auto — Maximum autonomy, let the agent run

**Use when:** You want Claude to handle the full cycle — build, test, review, iterate — with near-zero human intervention. Good for well-scoped tasks where the spec is clear, the codebase is understood, and you trust the agent to make judgment calls.

**Philosophy:** The agent does everything. It writes code, writes tests, runs them, reviews its own output, fixes issues, and iterates until the task is done. Human intervention happens only if something is truly stuck. The guardrails (anti-slop rules) are still active as context — the agent self-polices — but no hooks slow it down with interactive checks.

| Setting | Value | Why |
|---------|-------|-----|
| **Default model** | Inherit (session default) | Use whatever model you started with |
| **Effort** | high | Quality still matters, just without human gates |
| **Hooks active** | 2 (lint + destructive block) | Auto-format and prevent catastrophic commands. No slop hooks, no review reminders, no danger zone warnings. |
| **Agents available** | All 10 | Full arsenal. Agent self-selects which to use. |
| **Cycle budgets** | High (5+) | Let agents iterate deeply before escalating |
| **Human checkpoints** | None during execution | Human reviews the final output, not intermediate steps |
| **Guardrails** | All 6 rules active as context | Agent follows anti-slop rules while writing, but no hook enforcement |
| **Permissions** | Near-everything auto-approved | Write, Edit, Bash, git, npm, docker — all pre-approved. Only truly destructive commands blocked. |
| **Cost profile** | Variable (~$3-15 per session) | Depends on task complexity and iteration depth |

**Typical workflow:**
```
You: "Implement the webhook retry logic from the spec. Write tests.
      Review for security. Fix any issues. Commit when done."

(agent runs for 20-40 minutes unattended)
(writes code, writes tests, runs tests, self-reviews, fixes, commits)

You: Review the commit. Done.
```

**What makes Auto different from Sport:**
- Sport is lightweight because the *code* doesn't need rigor (prototypes, demos)
- Auto is autonomous because the *human* doesn't need to be involved (clear specs, trusted agent)
- Auto still has guardrails (anti-slop rules in context) — Sport doesn't
- Auto still blocks truly destructive commands — it's autonomous, not reckless

**When NOT to use Auto:**
- Code touching payments, auth, or PII (use Professional — security review needs human eyes)
- Ambiguous requirements (the agent will make assumptions you might not agree with)
- First time working in an unfamiliar codebase (use Learn first)
- When the team requires human review before merge (use Professional)

### UV Spike — Deep understanding, research, and documentation

**Use when:** Joining a new codebase, investigating architecture, spiking on a design problem, generating documentation, building knowledge graphs, writing architecture decision records.

**Philosophy:** Understand deeply, document what you find. Opus at max effort for maximum reasoning depth. Can write new documentation and analysis files, but cannot edit existing code, commit, or push. Documentation gets slop-checked — no "robust, scalable, comprehensive" vagueness in the output.

| Setting | Value | Why |
|---------|-------|-----|
| **Default model** | Opus | Deep understanding needs the strongest reasoning |
| **Effort** | max | Maximum depth of analysis |
| **Hooks active** | 1 (doc slop check) | Haiku scans every written doc for vague adjectives and non-specific claims |
| **Agents available** | Cartographer, Spec Writer, Architect, Anti-Slop Guard, Explore, Plan | Map, analyze, spec, design, but don't build |
| **Can write** | New files only (Write) | Documentation, specs, architecture docs, analysis, DANGER-ZONES.md |
| **Cannot do** | Edit existing code, commit, push, run commands | No risk of accidentally modifying production code |
| **Guardrails** | Doc slop prevention active | Every written file checked for documentation slop |
| **Cost profile** | Medium-high (~$3-10 per session) | Opus at max effort is expensive but worth it for deep analysis |

**Typical workflow:**
```
/map-codebase                      → Full project architecture map
/map-codebase src/auth/            → Deep dive into auth subsystem
(ask questions)                    → "How does the webhook retry work?"
(agent writes docs)                → Architecture overview, dependency analysis
/spec "webhook retry improvements" → Structured spec from research findings
/architect "the spec above"        → Architecture proposal with Acts
/slop-check docs/                  → Verify documentation quality
```

**What Spike produces:**
- Architecture maps and diagrams (from Cartographer)
- Technical specifications (from Spec Writer)
- Architecture decision records (from Architect)
- DANGER-ZONES.md entries
- CLAUDE.md updates
- Knowledge base documentation
- Investigation reports

---

## Persona Comparison

| | UV Spike | UV Sport | UV Professional | UV Auto |
|---|---------|---------|----------------|---------|
| **For** | Research & docs | New things | Production code | Clear, scoped tasks |
| **Speed** | Thorough | Fast | Measured | Fast (unattended) |
| **Model** | Opus | Sonnet | Inherit | Inherit |
| **Effort** | max | high | high | max |
| **Hooks** | 1 (doc slop) | 1 (lint) | All 5 | 2 (lint + block) |
| **Guardrails** | Doc slop | None | All 6 | All 6 (context) |
| **Agents** | 5 | 3 | All 10 | All 10 |
| **Cost** | Medium-high | Low | Higher | Variable |
| **Human gates** | After each map | End only | Every Act | Final output only |
| **Slop tolerance** | Zero (on docs) | High | Zero | Low (self-policed) |
| **Permissions** | Read + write docs | Wide | Selective | Near-everything |
| **Can write** | New files only | Anything | Anything (reviewed) | Anything (autonomous) |
| **Cannot do** | Edit code, commit, push | — | Destructive ops | rm -rf, force push |

---

## Implementation: Persona Settings Files

Each persona is a separate `settings.json` that overrides the default.

### Installing a persona

```bash
# Sport mode (for new projects, prototyping)
./install.sh --persona sport

# Professional mode (for production codebases — this is the default)
./install.sh --persona professional

# Auto mode (fully autonomous, minimal human gates)
./install.sh --persona auto

# Spike mode (for research & documentation)
./install.sh --persona spike
```

### Switching personas mid-session

Swap the settings file:

```bash
# Switch to Sport (fast, lightweight)
cp .claude/personas/sport.json .claude/settings.local.json

# Switch to Professional (full rigor)
cp .claude/personas/professional.json .claude/settings.local.json

# Switch to Auto (let the agent run)
cp .claude/personas/auto.json .claude/settings.local.json

# Switch to Spike (research & docs)
cp .claude/personas/spike.json .claude/settings.local.json
```

`settings.local.json` overrides `settings.json` and is gitignored — so your personal mode choice doesn't affect the team's default.

---

## When to Use Each Persona

| Situation | Persona | Why |
|-----------|---------|-----|
| Building a hackathon project | **Sport** | Speed matters, quality can come later |
| Building a stakeholder demo | **Sport** | Exploratory code, needs to look good fast |
| Creating a presentation deck | **Sport** | Prototype Builder in fast mode |
| Scaffolding a new service | **Sport** | Get the foundation down, harden later |
| Fixing a bug in prod code | **Professional** | Every change matters, human review required |
| Adding a feature to an existing service | **Professional** | Team depends on this code |
| Refactoring a payment service | **Professional** | High-risk area needs full guardrails |
| Pre-merge review | **Professional** | Quality gates before shipping |
| Well-scoped feature, clear spec | **Auto** | Let the agent build + test + review end-to-end |
| Batch of small tasks (rename, migrate, update) | **Auto** | Repetitive work the agent handles well |
| Overnight/background code generation | **Auto** | Agent works while you sleep |
| Implementing from a detailed architecture doc | **Auto** | Clear instructions, agent executes |
| Joining a new team | **Spike** | Understand before changing |
| Investigating an incident | **Spike** | Read the code, document findings |
| Architecture review / design spike | **Spike** | Map the system, write ADRs |
| Generating documentation for a service | **Spike** | Opus + doc slop prevention |
| Writing a technical spec from research | **Spike** | Cartographer + Spec Writer |
| Updating DANGER-ZONES.md | **Spike** | Can write docs, can't modify code |

**The common progressions:**
- **Spike** → **Sport** → **Professional** — understand, explore, harden
- **Spike** → **Auto** — research thoroughly, then let the agent execute
- **Professional** → **Auto** — once you trust the agent on a specific codebase, let it run
- **Sport** → **Professional** — prototype fast, then switch to rigor when it matters
