# UV Suite vs GStack vs Claude Code Built-in

Detailed feature-by-feature comparison. Honest quality assessment.

---

## At a Glance

| | Claude Code (built-in) | UV Suite | GStack (Garry Tan) |
|---|---|---|---|
| **Philosophy** | General-purpose coding assistant | Portable methodology (Acts, personas, HITL) | Virtual engineering team (roles, sprints) |
| **Target user** | Any developer | Engineers who want structure across tools | Solo founders shipping fast |
| **Skills count** | 7 bundled | 12 | 23 + 8 power tools |
| **Agent types** | 3 (Explore, Plan, general-purpose) | 10 specialized | Role-based (CEO, Designer, QA, etc.) |
| **Modes/Personas** | None | 4 (Spike, Sport, Professional, Auto) | None (one mode, all tools available) |
| **Multi-tool** | Claude Code only | Claude Code + Cursor + Codex | Claude Code + OpenClaw + Codex |
| **Browser automation** | Playwright MCP (opt-in) | Playwright MCP (opt-in) | Built-in Chromium (`/browse`, `/qa`) |
| **Install** | Built-in | `npm install -g uv-suite` | `git clone` + `./setup` |
| **License** | Proprietary (Anthropic) | MIT | MIT |

---

## Feature-by-Feature Comparison

### Planning & Strategy

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Strategic review | None | `/spec` (requirements to spec) | `/plan-ceo-review` (4 strategic modes) | GStack is deeper — challenges premises, identifies hidden products. UV Suite converts requirements but doesn't challenge them. |
| Architecture design | `/plan` (plan mode) | `/architect` (Acts breakdown, ADRs, cycle budgets) | `/plan-eng-review` (ASCII diagrams, test matrices, failure modes) | UV Suite has the richest architecture output (Acts methodology). GStack has failure mode analysis UV Suite lacks. |
| Design review | None | None | `/plan-design-review` (rates dimensions 0-10) | **Gap in UV Suite.** No design review capability. |
| DX review | None | None | `/plan-devex-review` (TTHW benchmarking, 20-45 forcing questions) | **Gap in UV Suite.** No developer experience audit. |
| Auto-plan pipeline | None | Separate skills (manual chaining) | `/autoplan` (CEO → design → eng → DX automatically) | GStack chains reviews automatically. UV Suite requires manual invocation of each skill. |
| **Quality** | Basic | Good | Excellent | GStack's planning depth (forcing questions, strategic modes, taste memory) is significantly ahead. |

### Code Review

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Code review | `/review` (local PR review) | `/review` (correctness, security, perf, slop, danger zones) | `/review` (production-bug focus, auto-fixes obvious issues) | UV Suite adds slop detection + danger zone awareness. GStack auto-fixes. |
| Security review | `/review --security` | `/review --security` (OWASP, Semgrep, Gitleaks, Trivy) | `/cso` (OWASP + STRIDE threat modeling, exploit scenarios) | GStack has threat modeling UV Suite doesn't. UV Suite integrates more external tools. |
| Slop detection | None | `/review --slop` (6 categories) + real-time grep hook | Part of `/plan-design-review` | UV Suite is the only one with dedicated anti-slop tooling. |
| Cross-model review | None | None | `/codex` (independent OpenAI review, overlapping findings) | **Gap in UV Suite.** No second-opinion from a different model. |
| **Quality** | Basic | Good | Excellent | GStack's auto-fix + threat modeling + cross-model is ahead. UV Suite's slop detection is unique. |

### Testing & QA

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Test generation | Bash tool (manual) | `/test` (framework detection, anti-slop rules) | Part of `/ship` pipeline | UV Suite has dedicated test agent with anti-slop rules. GStack bundles testing into ship. |
| Browser QA | None built-in | Playwright MCP (referenced in agents) | `/qa` (real Chromium, finds bugs, auto-fixes, regression tests) | **GStack is significantly ahead.** Full browser QA with bug detection + auto-fix. UV Suite references Playwright but doesn't have a QA skill. |
| QA reporting | None | None | `/qa-only` (report without changes) | **Gap in UV Suite.** |
| Benchmarking | None | None | `/benchmark` (page load, Core Web Vitals) | **Gap in UV Suite.** No performance benchmarking. |
| Post-deploy monitoring | None | None | `/canary` (error + regression watch) | **Gap in UV Suite.** |
| **Quality** | None | Basic | Excellent | GStack's QA pipeline (browser testing, canary, benchmarks) is far ahead. UV Suite's test-writer is good but lacks the full QA cycle. |

### Shipping & Deployment

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Ship pipeline | None | None | `/ship` (sync, test, audit coverage, open PR) | **Gap in UV Suite.** No compound ship skill. |
| Deploy & verify | None | None | `/land-and-deploy` (merge, wait CI, verify production) | **Gap in UV Suite.** No deploy verification. |
| Release docs | None | None | `/document-release` (auto-update all project docs) | **Gap in UV Suite.** No release doc automation. |
| Retrospective | Session-end hook (reflection) | `/session checkpoint` (structured session state) | `/retro` (weekly retro, per-person, shipping streaks) | GStack's retro is team-scale. UV Suite's checkpoint is session-scale. |
| **Quality** | None | Basic | Excellent | GStack owns the ship-to-prod pipeline. UV Suite has no shipping skills. |

### Codebase Understanding

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Codebase mapping | Explore agent (read-only search) | `/understand` (Graphify knowledge graph) | None | **UV Suite is ahead.** Knowledge graph output is unique. GStack has no mapping tool. |
| Multi-service mapping | None | `/understand --stack` (cross-service connections) | None | **UV Suite only.** |
| Debugging methodology | None | None | `/investigate` (root-cause, 3-attempt limit) | **Gap in UV Suite.** No structured debugging skill. |
| **Quality** | Basic | Excellent | None | UV Suite's Cartographer + Graphify is the strongest codebase understanding tool across all three. |

### Memory & Context

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Auto memory | Yes (heuristic, 25KB limit) | Yes (inherits Claude's) + `/session checkpoint` + `/session restore` | Continuous checkpoint (WIP commits with context body) | GStack's approach is cleverer — checkpoints are git commits, so they survive everything. UV Suite's are files. |
| CLAUDE.md injection | Yes (you write it) | Auto-generated on install (persona, skills, practices) | Auto-generated by setup script | Both UV Suite and GStack generate CLAUDE.md. UV Suite's is richer (practices, artifacts, hooks). |
| Shared artifacts | None | `uv-out/` (agents read prior agent outputs) | Skill outputs feed into downstream skills | Similar concept, different implementation. |
| Taste memory | None | None | `/design-shotgun` learns preferences over rounds | **Gap in UV Suite.** No preference learning. |
| Session handoff | `claude --continue` / `--resume` | `/session checkpoint` + `/session restore` | WIP commits + `/context-restore` | All three solve this differently. GStack's git-based approach is most robust. |
| **Quality** | Basic | Good | Excellent | GStack's git-commit-based checkpointing and taste memory are ahead. UV Suite's checkpoint skill is simpler but explicit. |

### Modes & Personas

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Session modes | `/effort` level only | 4 personas (Spike, Sport, Professional, Auto) | None | **UV Suite only.** Different hook/guardrail/permission configs per mode. |
| Mode switching | `/effort`, model shortcuts | `uvs spike`, `uvs pro` (session-level) | N/A | UV Suite's persona system is unique. |
| Session hygiene | None | Duration tracking, break reminders, checkpoint prompts | None | **UV Suite only.** |
| **Quality** | None | Excellent | None | Persona system is UV Suite's unique differentiator. |

### Design & UI

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Design system creation | None | None | `/design-consultation` (competitive research, creative risks) | **Gap in UV Suite.** |
| Mockup generation | None | `/prototype` (React + Vite static site) | `/design-shotgun` (4-6 variants, browser comparison) | GStack generates and compares variants visually. UV Suite builds one prototype. |
| Mockup to production | None | None | `/design-html` (Pretext layout, framework detection) | **Gap in UV Suite.** |
| **Quality** | None | Basic | Excellent | GStack's design pipeline is far ahead. UV Suite's prototype builder is a starting point. |

### Developer Experience

| Feature | Claude Built-in | UV Suite | GStack | Notes |
|---------|----------------|----------|--------|-------|
| Portability | Claude Code only | Claude Code + Cursor + Codex (agents in 4 formats) | Claude Code + OpenClaw + Codex | UV Suite is more portable (includes Cursor .mdc files). |
| Installation | Built-in | `npm install -g uv-suite && uvs install` | `git clone` + `./setup` | UV Suite has npm distribution. GStack is git-clone only. |
| Self-update | Built-in | `npm update -g uv-suite` | Auto-update hourly (team mode) | GStack's auto-update is smoother. |
| Anti-slop guardrails | None | 6 guardrail rule files in .claude/rules/ | Built into `/plan-design-review` | UV Suite has standalone guardrails. GStack bakes it into design review. |
| **Quality** | N/A | Good | Good | Different strengths. UV Suite is more portable. GStack has smoother operations. |

---

## Quality Scorecard

| Area | Claude Built-in | UV Suite | GStack |
|------|----------------|----------|--------|
| Planning & Strategy | 2/5 | 3/5 | 5/5 |
| Code Review | 3/5 | 4/5 | 5/5 |
| Testing & QA | 1/5 | 3/5 | 5/5 |
| Shipping & Deploy | 1/5 | 1/5 | 5/5 |
| Codebase Understanding | 2/5 | 5/5 | 1/5 |
| Memory & Context | 2/5 | 4/5 | 5/5 |
| Modes & Personas | 1/5 | 5/5 | 1/5 |
| Design & UI | 1/5 | 2/5 | 5/5 |
| Portability | 1/5 | 5/5 | 3/5 |
| Anti-slop | 1/5 | 5/5 | 3/5 |
| Session Hygiene | 1/5 | 4/5 | 1/5 |
| **Overall** | **1.5/5** | **3.7/5** | **3.5/5** |

---

## What UV Suite Should Learn from GStack

### High priority (would significantly improve UV Suite)

1. **`/ship` compound skill** — Chain review + tests + slop-check + open PR in one command. GStack's biggest practical advantage.

2. **`/investigate` debugging skill** — Root-cause methodology with a 3-attempt limit. UV Suite has no debugging workflow.

3. **`/qa` browser testing** — Playwright MCP is registered but UV Suite has no skill that actually uses it for QA. GStack's `/qa` finds bugs, fixes them, and generates regression tests.

4. **Auto-chaining** — GStack's `/autoplan` runs CEO → design → eng review automatically. UV Suite requires manual skill invocation for each step.

### Medium priority

5. **Design review capability** — `/plan-design-review` rates dimensions 0-10. UV Suite has no design assessment.

6. **Cross-model review** — GStack's `/codex` gets a second opinion from OpenAI. Independent verification catches different bugs.

7. **Post-deploy monitoring** — `/canary` watches for errors after shipping. UV Suite stops at review.

### Low priority (nice to have)

8. **Taste memory** — Design preferences that persist and decay. Sophisticated but niche.

9. **Performance benchmarking** — Core Web Vitals baseline. Valuable but project-specific.

10. **Release documentation** — Auto-update docs after shipping. Useful but low frequency.

---

## What GStack Should Learn from UV Suite

1. **Personas** — No mode switching in GStack. You get all 23 tools all the time. Different contexts need different rigor.

2. **Codebase mapping** — GStack has no `/understand` or Graphify integration. No way to understand a new codebase structurally.

3. **Anti-slop guardrails** — GStack detects slop in design review but has no standalone guardrails or real-time hooks.

4. **Acts methodology** — GStack has sprints but no formalized delivery phases with entry/exit criteria and cycle budgets.

5. **Cursor + Codex portability** — GStack is Claude Code first. UV Suite ships .mdc and .toml files for all three tools.

6. **Session hygiene** — No duration tracking, break reminders, or checkpoint prompts in GStack.

7. **Shared artifact context** — UV Suite's `uv-out/` where agents read each other's output. GStack skills feed into each other but less formally.

---

## Where Both Beat Claude Code Built-in

| Capability | Claude Built-in | UV Suite / GStack |
|-----------|----------------|-------------------|
| Structured code review with checklist | Basic `/review` | Detailed checklists, severity levels, auto-fixes |
| Security review with external tools | Basic `/review --security` | Semgrep, Gitleaks, Trivy, OWASP + STRIDE |
| Codebase understanding | Explore agent | Knowledge graphs, multi-service mapping |
| Session continuity | `--continue` (raw history) | Structured checkpoints, handoff documents |
| Quality guardrails | None | Anti-slop rules, real-time hooks, danger zones |
| Test generation | Manual via Bash | Dedicated agents with anti-slop, framework detection |
| Customizable rigor | `/effort` only | Full persona system (model, hooks, permissions, guardrails) |

## Prompt-Depth Deep Dive (added 2026-05-17)

The feature tables above compare *capability surface*. This section compares *prompt depth* — what the skills actually instruct Claude to do. Source: read of gstack `main` branch and UV Suite at `strategy/uv-suite/`.

### Word-count comparison: `/review`

| | UV Suite | gstack |
|---|---|---|
| Main SKILL.md | 193 words | ~9,400 words |
| Sub-prompts | 0 | 7 specialist files (api-contract, data-migration, maintainability, performance, red-team, security, testing) |
| Auxiliary files | 0 | checklist.md, design-checklist.md, greptile-triage.md, TODOS-format.md |
| Total review surface | 193 words / 1 file | ~9,400 words / 12 files |

UV Suite's `/review` is essentially a context-loader: it `cat`s the diff, CLAUDE.md, DANGER-ZONES.md, and prior `uv-out/` artifacts, then hands off to a generic `reviewer` agent. gstack's `/review` is an 8-step procedure with explicit branching, parallel specialist dispatch, and an adversarial second pass via Codex.

### Structural patterns gstack uses that UV Suite doesn't

1. **Parallel specialist subagents per skill.** gstack's `/review` dispatches 7 specialists concurrently — each is its own prompt file with concern-specific detection rules. UV Suite's `/review` delegates to one `reviewer` agent that covers everything.

2. **Confidence-scored output gating.** gstack scores each finding 1-10; 7-10 surface normally, 5-6 surface with caveats, 3-4 move to appendix, 1-2 are suppressed. UV Suite has no scoring layer.

3. **Fix-First classification.** gstack tags each finding as AUTO-FIX (apply immediately) or ASK (user approval). UV Suite reports findings; the user manually decides what to fix.

4. **Fingerprint-based suppression.** gstack persists which findings a user already skipped and omits them on re-runs if the file is unchanged. UV Suite re-flags everything on every run.

5. **Cross-model adversarial review.** gstack invokes Codex as an independent second reviewer to catch blind spots in Claude's review. UV Suite has no cross-model pass.

6. **Skill coupling via persisted state.** gstack's `/ship` knows whether `/review` completed by reading state. UV Suite skills are orthogonal — no skill knows what other skills ran.

7. **Voice rules embedded per-skill.** gstack's `/review` bans "delve", "robust", "comprehensive" inside the skill prompt itself. UV Suite has the same rule globally in `rules/doc-slop.md` but doesn't reinforce per-skill.

### What gstack does NOT have

- No language-specific slop catalogs (no python-slop.md, java-slop.md). Their depth comes from procedural orchestration, not finer-grained pattern lists. Worth weighing if you were planning to add such files for parity reasons — that's not where their leverage is.
- No persona / mode-switching. All 23 tools available all the time.
- No formal codebase-mapping skill.
- No multi-tool portability (Claude Code only; UV Suite ships for Cursor + Codex too).

### Honest assessment vs the original audit question

The earlier conversation framed the gap as "UV Suite's slop rules are language-agnostic; add python-slop.md and java-slop.md." After reading gstack, that framing looks wrong:

- The slop rule files (`rules/*-slop.md`) are well-designed for their actual role — they're *guardrails* (reference docs Claude consults), not *skills* (executable procedures). Different mechanism, different evaluation criteria.
- The bigger gap is in the *skills* (e.g., `/review`) being thin compared to gstack's. Adding more rule files won't close that gap.
- The high-leverage rewrite, if taken, is restructuring `/review` (and probably `/review --security`) with specialist subagent dispatch + confidence scoring + adversarial pass. That's a significantly larger lift than adding rule files.

Not a recommendation to do that — just naming the actual tradeoff so future-you can decide deliberately.

### Upstream UV Suite bugs surfaced during this session (2026-05-17)

Two latent bugs in `strategy/uv-suite/` discovered while answering questions about prompt quality:

1. **Six skill files used `Bash("$CLAUDE_PROJECT_DIR"/.claude/hooks/*.sh *)` in `allowed-tools`.** Recent Claude Code tightening rejects shell-variable expansion inside permission patterns with `Contains simple_expansion`. Symptom: `/confirm off` (and 5 other skills) fails with `Shell command permission check failed`. Fix: replace with `Bash(*/.claude/hooks/*.sh *)` — the leading wildcard is portable across workspaces. Applied to all 6 skills in `strategy/uv-suite/skills/{confirm,checkpoint,restore,auto-checkpoint,session-init,session-end}/SKILL.md`. Also worth a GitHub issue at `utsavanand/uv-suite` so installs elsewhere don't regress.

2. **The `eval-writer` agent template referenced `"claude-haiku-4-5"` (no date suffix).** Claude Code's hook evaluator rejects un-dated Haiku IDs. The current valid alias is `claude-haiku-4-5-20251001`. Also affected three live config files in `~/.claude/`: `personas/spike.json`, `personas/professional.json`, `agents/eval-writer.md` — these used the even more stale `"claude-haiku"`. Applied to `strategy/uv-suite/agents/claude-code/eval-writer.md` and the four user-config files.

Both fixes are local-only; the upstream `utsavanand/uv-suite` repo still ships these bugs and should be patched there.

