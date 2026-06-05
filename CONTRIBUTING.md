# Contributing to UV Suite

This is for people **changing UV Suite itself** — adding or editing skills, agents,
hooks, and personas. If you just want to *use* UV Suite, see [README.md](README.md).

## Source layout

This repo is the *source*. `uvs install` copies subsets of it into a project's
`.claude/`, `.codex/`, and `.cursor/` directories — so edit files here, not in an
installed project.

```
skills/<name>/SKILL.md   12 skills, one slash command each; SKILL.md is a thin
                         orchestrator (the prompt + its tool grants). Fan-out
                         skills carry a sub-folder the orchestrator routes into:
                           review/specialists/    one file per review specialist
                           architect/specialists/ one file per domain expert (researches)
                           test/specialists/      one file per test specialist
                           understand/modes/      one file per understand mode
                           session/operations/    one file per session operation
agents/
  claude-code/<name>.md     subagent definitions — the SINGLE SOURCE OF TRUTH
  generate.py               generates Cursor (.mdc) + Codex (.toml) from the .md files
hooks/*.sh               lifecycle automation (auto-lint, block-destructive, the
                         uv-out-*.sh session-scoped artifacts, slop-grep ambient slop)
personas/                the 4 persona configs (spike/sport/professional/auto JSON)
guardrails/              6 anti-slop rule docs → installed to .claude/rules/
knowledge/               cross-cutting reference docs (human-in-the-loop,
                         sharing-and-standards, practices)
research/                best-practices, comparison, landscape, tool-comparison
fixtures/                runnable test fixtures (pdf-qa multi-service)
tests/skills/            the skill test harness (contract + behavioral)
bin/ , uv.sh , install.sh the CLI and installer
watchtower/ , website/   dashboard and docs site
```

## How a skill works

A `SKILL.md` is a thin orchestrator with two parts. For fan-out skills, the body's
job is mostly to route: `review` and `test` dispatch to the files in their
`specialists/` folder, `understand` selects one of the files in `modes/`, and
`session` runs the matching file in `operations/`. The orchestrator stays small;
the actual instructions live in those sub-folder files.

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
   Keep the SKILL.md a thin orchestrator. If the skill fans out, put each branch in
   a sub-folder and have SKILL.md route to it: `specialists/` for review/test-style
   fan-out, `modes/` for understand-style mode selection, `operations/` for
   session-style operations.
2. If it uses a subagent, ensure `agents/claude-code/<agent>.md` exists. The Cursor and
   Codex variants are generated from it by `agents/generate.py` at install time — edit
   only the canonical `.md`.
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
