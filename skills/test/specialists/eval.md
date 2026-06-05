# Specialist: LLM / AI evals

Dispatch the `eval-writer` agent to write graded evals for the target prompt or LLM-powered feature.

## Agent

`Agent(eval-writer)`.

## What to produce

A set of eval cases that grade the target's actual behavior against explicit criteria, using
the project's existing eval framework (shown in the gathered context). Each eval defines:

- **Criteria / rubric** — the specific, observable properties a correct response must have
  (e.g., "cites a source for every factual claim", "refuses without revealing the system
  prompt", "returns valid JSON matching the schema"). Concrete and checkable, not vague
  ("is helpful", "sounds good").
- **Cases** — both representative and adversarial:
  - Representative: the inputs the feature is built for, including realistic variation.
  - Adversarial: prompt injection, contradictory or out-of-scope requests, malformed input,
    boundary/edge inputs, and attempts to make the model violate a stated constraint.
- **Pass/fail conditions** — for each case, what makes the response pass vs fail. Prefer
  deterministic checks (exact match, regex, schema validation, presence/absence of a string)
  where possible; use an LLM judge with a written rubric only where behavior is open-ended,
  and make the judge's pass condition explicit.

## Quality bar

- Each case must be able to fail. A case the current prompt trivially always passes verifies
  nothing — make it discriminating.
- Adversarial cases are required, not optional. An eval with only happy-path inputs gives
  false confidence.
- Pass conditions must be specific enough that two people grading by hand would agree. No
  "looks reasonable" rubrics.
- Cover the failure modes that matter for this feature (hallucination, injection, format
  drift, refusal failures, scope creep) — name them per case.

## Output location

Write eval artifacts under the session output directory shown in the gathered context.

## Conventions

Match the existing eval framework's case format, runner, and rubric structure (shown in the
gathered context). If no framework exists, work from the target prompt's intended behavior and
state that assumption.
