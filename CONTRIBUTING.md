# Contributing to UV Suite

Thanks for considering a contribution. UV Suite is meant to be opinionated but small — the goal is "fewer, sharper" not "more."

## Ground rules

- **Anti-slop applies to UV Suite itself.** The guardrails in `.claude/rules/` are the bar for code that lands here too. PRs that introduce single-implementation interfaces, vague docs, or `expect(x).toBeTruthy()` tests will be sent back.
- **No new abstraction without a second caller.** Add the second caller first; extract second.
- **Comments explain *why*, not *what*.** Defaults to none. Add one only when the code can't express the reason.
- **Cross-harness parity.** When you add a skill, hook, or agent, ship it for Claude Code, Cursor, and Codex in the same PR.

## Setup

```bash
git clone https://github.com/utsavanand/uv-suite.git
cd uv-suite
npm install
./bin/cli.js install   # installs UV Suite into the repo itself for dogfooding
```

To run Watchtower locally:

```bash
node watchtower/server.js   # http://localhost:4200
```

## Adding a skill

1. `skills/<name>/SKILL.md` — frontmatter (`name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`) plus the prompt.
2. Add a row to the Skills table in [README.md](README.md).
3. If it changes hook/agent/persona counts, update the counts in `README.md` and `package.json#description`.

## Adding a hook

1. `hooks/<name>.sh` — shebang, header comment naming the event (`PreToolUse`, `PostToolUse`, `Stop`, etc.), then the script.
2. Wire it into the right persona under `personas/`.
3. Add a row to the Hooks table in [README.md](README.md).

## Adding a guardrail

1. `guardrails/<name>.md` — pattern, detection rules, slop/not-slop examples, fix.
2. Confirm it's loaded by Professional + Auto personas.
3. Add a row to the Guardrails table in [README.md](README.md).

## PR checklist

- [ ] Counts in `README.md` and `package.json#description` are still correct.
- [ ] Cross-harness files added (Claude Code + Cursor + Codex) when applicable.
- [ ] No new dead code, no commented-out blocks.
- [ ] `node -c watchtower/server.js` passes if you touched watchtower.
- [ ] Commit message says *why*, not just *what*.

## Reporting bugs

Open an issue with: persona used, harness (Claude Code / Cursor / Codex), the skill/hook involved, and the smallest repro you can produce. Watchtower event logs (`watchtower/events.json`) are gold if you can include the relevant slice.

## Code of conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
