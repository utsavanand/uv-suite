# Show HN launch — UV Suite

## Title (under 80 chars)

> Show HN: UV Suite – anti-slop guardrails and agents for Claude/Cursor/Codex

Alternates if the first feels too narrow:
- Show HN: UV Suite – portable anti-slop framework for AI coding agents
- Show HN: UV Suite – 6 guardrails, 10 agents, live dashboard for AI coding

## URL

`https://github.com/utsavanand/uv-suite`

## Founder comment (post within 5 minutes)

> Hey HN — I built UV Suite because I kept watching Claude Code, Cursor, and Codex produce the same kinds of slop on every project: single-implementation factories, comments that restate the code, tests that assert `toBeTruthy()`, docs full of "robust, scalable, comprehensive."
>
> The fix isn't a smarter model. It's a checklist the model reads on every turn.
>
> What's in the box:
>
> - **6 anti-slop guardrails** loaded as context — comment slop, overengineering, architecture slop, test slop, doc slop, error-handling slop. Each one names the pattern, gives a slop/not-slop example, and tells the agent how to fix it.
> - **10 specialized agents** organized as Index → Acts → Guard (map the codebase, build with specs/architecture/tests, then review for correctness/security/slop).
> - **15 slash commands** that drive the workflow — `/spec`, `/architect`, `/review`, `/slop-check`, `/security-review`, `/checkpoint`, etc.
> - **11 hooks** that fire automatically — auto-lint on write, slop-grep on write, block destructive bash, danger-zone warnings, session timer.
> - **Watchtower** — a zero-dep Node dashboard that streams every hook event over SSE so you can see what your agent is actually doing.
> - **4 personas** — Spike (research, no edits), Sport (build fast), Professional (ship to prod, all hooks on), Auto (autonomous).
>
> Portable. One `uv install` drops the right format into `.claude/`, `.cursor/`, and `.codex/` simultaneously.
>
> **Tech stack**: bash hooks, plain JSON for personas, Markdown for skills/agents/guardrails, Node (no deps) for Watchtower. Most of the value is in the prompts, not the runtime.
>
> **What I'd love feedback on**:
>
> 1. Are the 6 slop categories the right cut, or are there obvious ones I'm missing?
> 2. The persona system — is 4 personas the right number, or should it be a continuous knob?
> 3. Watchtower — is "live dashboard" actually useful, or is a post-session log enough?
>
> **Current limitations**:
>
> - The slop-grep hook is regex-based and intentionally conservative (no LLM, no false positives). Some real slop slips through.
> - Cross-harness parity is manual — when I add a skill I have to ship it for Claude Code, Cursor, and Codex. Working on auto-generation.
> - No Windows testing. Should work via WSL.
>
> Repo: https://github.com/utsavanand/uv-suite · Demo video: [link]
>
> Happy to answer anything.

## Posting checklist

- [ ] Tuesday or Wednesday, 8:00–9:00 AM ET (peak HN traffic)
- [ ] Post is up on GitHub with v1.0.0 tag, demo GIF in README, video linked
- [ ] Founder comment ready in clipboard, post within 5 minutes
- [ ] Be online for 4–6 hours to respond to every comment
- [ ] Do NOT ask friends to upvote. HN detects voting rings.

## After posting

- [ ] Cross-post to r/ClaudeAI, r/cursor, r/LocalLLaMA — different copy each time, see `cross-posts.md`
- [ ] X/Twitter thread with the demo GIF
- [ ] Reply to *every* HN comment, even the harsh ones. Especially the harsh ones.
