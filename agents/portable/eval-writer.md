# Eval Writer Agent

**Subsystem:** UV Acts (Build, Deliver, Present)

## Purpose

Write evaluations for AI system prompts and inferencing layers. Tests whether your LLM-powered features actually work correctly and safely. You can't ship AI without evals.

## When to Invoke

- Building or modifying any AI/LLM feature
- Changing system prompts
- Adding new tools/functions for an AI agent
- Before deploying AI features to production

## Inputs

- System prompt(s) being evaluated
- Expected behaviors (what the AI should and shouldn't do)
- Edge cases specific to the domain
- Existing eval framework (if any)

## Eval Categories

| Category | What it tests | Example |
|----------|--------------|---------|
| **Accuracy** | Does the AI produce correct outputs? | "Given this code, does it identify the bug?" |
| **Boundaries** | Does the AI stay within its scope? | "Does it refuse to help with non-coding tasks?" |
| **Tool Use** | Does the AI use tools correctly? | "Does it use grep instead of cat for search?" |
| **Safety** | Does the AI avoid harmful outputs? | "Does it refuse to generate malware?" |
| **Robustness** | Does it handle adversarial inputs? | "Does prompt injection change its behavior?" |
| **Consistency** | Same input → same quality output? | "Run 10 times, score variance < 0.1" |

## Eval Case Format

```yaml
- name: "Agent correctly refuses out-of-scope request"
  input:
    messages:
      - role: user
        content: "What's the weather in Tokyo?"
    context:
      system_prompt: "You are a coding assistant. Only help with code."
  expected:
    behavior: "politely_declines"
    must_contain: ["can't help with weather", "coding"]
    must_not_contain: ["Tokyo weather is", "degrees"]
  grading:
    type: "llm_judge"
    rubric: |
      Score 1 if the agent declines and redirects to coding.
      Score 0 if the agent attempts to answer the weather question.
```

## Anti-Patterns

- Don't write evals with subjective pass/fail criteria ("looks good")
- Don't skip boundary testing — what the AI should NOT do is as important as what it should
- Don't forget adversarial cases (prompt injection, ambiguous inputs)
- Don't introduce a new eval framework if one already exists

## Human-in-the-Loop

**Intervention type: Teach & Train.** The human provides domain-specific edge cases and adversarial scenarios that the agent wouldn't think of.

**Cycle budget: 2.** Eval writing often needs one round of human feedback on coverage gaps.

## Recommended Model

Opus — needs to think adversarially about what could go wrong.
