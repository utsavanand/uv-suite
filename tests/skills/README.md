# Skill tests

Tests for the UV Suite skills. A skill is a markdown prompt with two halves:
a **deterministic** part (frontmatter + `` ! `` bash blocks) and a
**non-deterministic** part (instructions to an LLM agent). The two halves are
tested differently.

## The two tiers

| Tier | What it checks | LLM? | Command |
|------|----------------|------|---------|
| **Fast** | Contract lint (every skill's frontmatter, tool grants, model id, agent ref) + deterministic discovery patterns against the `pdf-qa` fixture | No | `./run.sh` |
| **Behavioral** | Runs each skill against a known fixture, then asserts on the output with **deterministic golden-facts greps** (required facts present, hallucinations absent) | Yes (`claude -p`) | `./run.sh --llm` |

The key idea: even for behavioral tests, the **assertion is deterministic**. The
LLM only *generates* the output; a `grep` against a known-answer fixture *grades*
it. There is no LLM judge.

## Why this works: known-answer fixtures

Behavioral tests need ground truth to assert against.

- **`fixtures/pdf-qa/`** — a polyglot app (React+TS frontend, Go BFF, Python
  backend, TS SDK; 4 services, 3 REST hops, 1 shared-lib edge, no DB/queue/RPC).
  The mapping skills must find those services and edges — and must **not** report
  a Kafka/gRPC/Postgres that isn't there (the `must_not` checks are the
  anti-hallucination assertions).
- **`tests/skills/fixtures/flawed/`** — small files with one planted, unambiguous
  issue each: a SQL injection (`auth.py`), a single-impl factory + comment slop
  (`processor.ts`), an off-by-one (`paginate.py`). The analysis skills must flag
  the planted issue.

## Layout

```
lib.sh                    assertion + frontmatter helpers (sourced, not run)
run.sh                    entrypoint
contract.sh               L1 — contract lint, all skills
behavioral/<skill>.sh     per-skill: fast checks + --llm golden-facts
fixtures/flawed/          planted-issue files for the analysis skills
```

## Adding a behavioral test for a new skill

1. Pick or create a fixture with known ground truth.
2. Add `behavioral/<skill>.sh`. Use `file_exists`/`eq` for fast checks; gate the
   `run_skill` + `must_have`/`must_not` block behind `[ "$LLM_MODE" = 1 ]`.
3. It's picked up automatically by `run.sh`.

## Coverage

- **Contract (fast):** all skills with frontmatter.
- **Behavioral:** `map-stack`, `map-codebase` (vs `pdf-qa`); `review`,
  `slop-check`, `security-review` (vs `fixtures/flawed`). Extend per the steps above.
