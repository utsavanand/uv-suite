# Cross-post copy

Different framing for each audience. Don't paste the HN comment verbatim.

---

## r/ClaudeAI

**Title:** I built a portable anti-slop framework for Claude Code (also works with Cursor/Codex) — 6 guardrails, 10 agents, live dashboard

**Body:**

After watching Claude Code produce the same kinds of slop on every project (single-impl factories, redundant comments, `toBeTruthy()` tests), I packaged the fixes into a single install.

What you get when you run `uv install`:
- 6 anti-slop guardrails loaded as context every turn
- 15 slash commands (`/spec`, `/architect`, `/review`, `/slop-check`, `/security-review`, `/commit`, `/checkpoint`...)
- 11 hooks (auto-lint, block destructive bash, danger-zone warnings, session timer)
- Watchtower — a zero-dep dashboard that streams every hook event live so you can see what Claude is doing
- 4 personas (Spike for research, Sport for prototyping, Professional for shipping, Auto for autonomous)

It's all Markdown + bash + a tiny Node server, no special runtime. Open source, MIT.

Repo: https://github.com/utsavanand/uv-suite

Curious what slop patterns *you* keep seeing that I should add to the guardrails.

---

## r/cursor

**Title:** UV Suite — anti-slop guardrails and 10 specialized agents that work in Cursor (and Claude Code, and Codex)

**Body:**

I keep using Cursor for prod code and getting the same slop: single-implementation interfaces "for future flexibility", comments that restate the code, tests that assert `toBeTruthy()`. Felt like the model needed a checklist, not a smarter model.

So I built UV Suite. It's a portable framework — one `uv install` drops the right format into `.cursor/rules/` (and `.claude/`, `.codex/` simultaneously). Cursor reads the guardrails as rules; you get 10 specialized agents and 15 slash-style commands.

The interesting part is the persona system: Spike (research mode, can't edit existing files), Sport (build fast, minimal hooks), Professional (full review rigor), Auto (autonomous, final-output review only).

Repo: https://github.com/utsavanand/uv-suite

Looking for feedback on whether the rules format is the right shape for Cursor specifically.

---

## r/LocalLLaMA

**Title:** UV Suite — open framework for AI coding agents with anti-slop guardrails (Claude/Cursor/Codex, MIT)

**Body:**

Most of the "make AI coding less terrible" content I've seen is "use a better model." I think the bigger lever is structured prompts and guardrails the model reads every turn.

UV Suite is my take: 6 anti-slop guardrails, 10 specialized agents (cartographer, spec-writer, architect, reviewer, anti-slop-guard, etc.), 15 slash commands, 11 hooks, and Watchtower (zero-dep Node observability dashboard).

It's all plain Markdown + JSON + bash. Portable across Claude Code, Cursor, and Codex. Could probably be adapted for local models with a thin shim, though I haven't tried.

Repo: https://github.com/utsavanand/uv-suite

---

## X / Twitter thread

**1/** AI coding agents move fast — and produce a lot of slop. Single-impl factories, redundant comments, tests that assert `toBeTruthy()`, docs full of "robust, scalable, comprehensive."

The fix isn't a smarter model. It's a checklist.

I built UV Suite. 🧵

**2/** [GIF: Watchtower dashboard with live events]

10 agents · 15 skills · 11 hooks · 6 guardrails · 4 personas.

One `uv install`, three harnesses (Claude Code, Cursor, Codex).

Open source, MIT.

**3/** The 6 guardrails are loaded as context on every turn:

· comment-slop
· overengineering-slop
· architecture-slop
· test-slop
· doc-slop
· error-handling-slop

Each one names the pattern, gives slop/not-slop examples, tells the agent how to fix it.

**4/** 4 personas, each tunes 7 knobs at once:

· Spike — research, can't edit
· Sport — build fast
· Professional — ship to prod, all hooks on
· Auto — autonomous

Pick one when you start. The harness handles the rest.

**5/** Watchtower is the part I'm most excited about. Zero-dep Node server, dashboard via SSE. Every hook event — file writes, slop catches, blocked bash, session boundaries — streams in live.

You see what your agent is actually doing.

**6/** Repo: https://github.com/utsavanand/uv-suite

Feedback wanted. Especially: which slop patterns am I missing?

---

## dev.to post

Title: **UV Suite: anti-slop guardrails and agents for AI-assisted coding**

Use the HN founder comment as the body, expanded with code examples of each slop category. Cross-link to the repo.
