# Contributing to UV Suite

This is for people **changing UV Suite itself** — adding or editing skills, agents,
hooks, and personas. If you just want to *use* UV Suite, see [README.md](README.md).

## Source layout

This repo is the *source*. `uvs install` copies subsets of it into a project's
`.claude/`, `.codex/`, and `.cursor/` directories — so edit files here, not in an
installed project.

```
skills/<name>/SKILL.md   one slash command each (the prompt + its tool grants)
agents/                  subagent definitions, one per target toolchain:
  claude-code/<name>.md     Claude Code (Markdown)
  cursor/<name>.mdc         Cursor
  portable/<name>.md        tool-agnostic
  codex/<name>.toml         Codex
hooks/*.sh               lifecycle automation (auto-lint, block-destructive, …)
personas/                the 4 persona configs (spike/sport/pro/auto)
guardrails/ , rules/     anti-slop guardrails
fixtures/                runnable test fixtures (e.g. pdf-qa)
tests/                   the test suite
bin/ , uv.sh , install.sh the CLI and installer
watchtower/ , website/   dashboard and docs site
```

## How a skill works

A `SKILL.md` has two parts:

1. **Frontmatter** — the contract. Required/used fields:
   - `name` — must equal the directory name
   - `description` — what it does and when to use it
   - `argument-hint`, `user-invocable`, `context` (`fork` runs it as a subagent)
   - `agent` — must match a file in `agents/claude-code/<agent>.md`
   - `model` — one of the current model ids (see the allowlist in `tests/skills/contract.sh`)
   - `allowed-tools` — every tool the skill uses. **If the body writes a file, you
     must grant `Write(...)`** — a common bug the contract test catches.
2. **Body** — Markdown instructions to the agent. `` ! `` blocks run bash at load
   time to gather context (e.g. `find` for discovery). `$ARGUMENTS` is the user's
   argument; prefer driving file discovery from it (`find ${T:-.}`) over hardcoding `.`.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with valid frontmatter (copy an existing skill).
2. If it uses a subagent, ensure `agents/claude-code/<agent>.md` exists (add the
   `cursor`/`portable`/`codex` variants too for cross-tool support).
3. Run `./tests/skills/run.sh` — the contract lint must pass.
4. Add a behavioral test if the skill has checkable output (see below).

## Testing

```bash
./tests/skills/run.sh          # fast: contract lint (all skills) + discovery. No LLM.
./tests/skills/run.sh --llm    # behavioral: runs each skill via `claude -p`, then
                               # asserts on output with deterministic golden-facts greps.
```

Details, including how to add a behavioral test, are in
[tests/skills/README.md](tests/skills/README.md). Fixtures with known ground truth
live in [fixtures/pdf-qa](fixtures/pdf-qa/README.md) (multi-service, for the mapping
skills) and `tests/skills/fixtures/flawed/` (planted issues, for the analysis skills).

## Conventions

- **Surgical changes** — touch only what the change needs; match existing style.
- **No slop** — the guardrails in `rules/` are enforced expectations, not suggestions:
  no single-use abstractions, no comments that restate code, no tests that can't fail,
  no vague docs. Read them before adding code.
