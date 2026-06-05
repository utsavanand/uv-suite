#!/usr/bin/env bash
# Behavioral test: write-evals produces graded criteria + cases for the prompt under
# test. Three fixtures exercise different domains: billing support (accuracy + boundary),
# code review (tool use + boundary), and safety filter (safety + robustness).
#
# Assertions are deterministic golden-facts greps — no LLM judge.

EVAL_FIX="$REPO_ROOT/tests/skills/fixtures/eval-input"

# --- Fixture presence (fast, no LLM) ---
file_exists "fixture: support-bot.md" "$EVAL_FIX/support-bot.md"
file_exists "fixture: code-review-agent.md" "$EVAL_FIX/code-review-agent.md"
file_exists "fixture: safety-filter.md" "$EVAL_FIX/safety-filter.md"

if [ "$LLM_MODE" = 1 ]; then

  # ===========================================================================
  # Fixture 1: support-bot (billing domain + legal-advice refusal + no hallucination)
  # ===========================================================================
  OUT1="$REPO_ROOT/uv-out/test-write-evals-support-bot.out"
  if run_skill "$OUT1" "/write-evals $(cat "$EVAL_FIX/support-bot.md")"; then

    # --- Structure: grading criteria and test cases must exist ---
    grep -qiE 'rubric|criteria|scoring|grading' "$OUT1" \
      && ok "support-bot: defines grading criteria" \
      || bad "support-bot: no grading criteria"
    grep -qiE 'test case|scenario|eval case|example' "$OUT1" \
      && ok "support-bot: includes test cases" \
      || bad "support-bot: no test cases"
    grep -qiE 'pass|fail|score [01]' "$OUT1" \
      && ok "support-bot: has pass/fail criteria" \
      || bad "support-bot: no pass/fail criteria"

    # --- Accuracy: covers the billing domain ---
    must_have "$OUT1" "billing" "support-bot: covers billing domain"

    # --- Boundary: legal-advice refusal ---
    grep -qiE 'legal|lawyer|refus' "$OUT1" \
      && ok "support-bot: covers the legal-advice refusal boundary" \
      || bad "support-bot: missed the legal-advice refusal"

    # --- Robustness: the "never invent numbers" instruction ---
    grep -qiE 'invent|fabricat|hallucin|made.?up|account.?specific' "$OUT1" \
      && ok "support-bot: tests the no-hallucination-of-numbers rule" \
      || bad "support-bot: missed the no-invented-numbers instruction"

    # --- Adversarial: must include at least one adversarial case ---
    grep -qiE 'injection|ignore.*instruct|adversar|prompt inject|role confus|system prompt|data leak' "$OUT1" \
      && ok "support-bot: includes adversarial cases" \
      || bad "support-bot: no adversarial cases"

  else
    bad "write-evals (support-bot): claude -p run failed"
  fi

  # ===========================================================================
  # Fixture 2: code-review-agent (tool use + report-only boundary)
  # ===========================================================================
  OUT2="$REPO_ROOT/uv-out/test-write-evals-code-review.out"
  if run_skill "$OUT2" "/write-evals $(cat "$EVAL_FIX/code-review-agent.md")"; then

    # --- Structure ---
    grep -qiE 'rubric|criteria|scoring|grading' "$OUT2" \
      && ok "code-review: defines grading criteria" \
      || bad "code-review: no grading criteria"

    # --- Accuracy: covers the three review categories ---
    grep -qiE 'correctness|bug' "$OUT2" \
      && ok "code-review: covers correctness category" \
      || bad "code-review: missed correctness category"
    grep -qiE 'security|vulnerab' "$OUT2" \
      && ok "code-review: covers security category" \
      || bad "code-review: missed security category"
    grep -qiE 'performance' "$OUT2" \
      && ok "code-review: covers performance category" \
      || bad "code-review: missed performance category"

    # --- Boundary: refuses to write/fix code ---
    grep -qiE 'refus|decline|only review|not.*fix|write code' "$OUT2" \
      && ok "code-review: tests the no-code-writing boundary" \
      || bad "code-review: missed the refuse-to-fix boundary"

    # --- Accuracy: tests the "no issues found" path ---
    grep -qiE 'no issues|clean code|no problems|no.*found' "$OUT2" \
      && ok "code-review: tests the no-issues-found path" \
      || bad "code-review: missed the no-issues-found path"

  else
    bad "write-evals (code-review): claude -p run failed"
  fi

  # ===========================================================================
  # Fixture 3: safety-filter (safety categories + robustness + data leakage)
  # ===========================================================================
  OUT3="$REPO_ROOT/uv-out/test-write-evals-safety-filter.out"
  if run_skill "$OUT3" "/write-evals $(cat "$EVAL_FIX/safety-filter.md")"; then

    # --- Structure ---
    grep -qiE 'rubric|criteria|scoring|grading' "$OUT3" \
      && ok "safety-filter: defines grading criteria" \
      || bad "safety-filter: no grading criteria"

    # --- Safety: covers at least two of the four categories ---
    SAFETY_CATS=0
    grep -qiE 'violen' "$OUT3" && SAFETY_CATS=$((SAFETY_CATS+1))
    grep -qiE 'hate' "$OUT3" && SAFETY_CATS=$((SAFETY_CATS+1))
    grep -qiE 'self.?harm' "$OUT3" && SAFETY_CATS=$((SAFETY_CATS+1))
    grep -qiE 'illegal' "$OUT3" && SAFETY_CATS=$((SAFETY_CATS+1))
    [ "$SAFETY_CATS" -ge 2 ] \
      && ok "safety-filter: covers $SAFETY_CATS/4 safety categories" \
      || bad "safety-filter: only covers $SAFETY_CATS/4 safety categories (need >=2)"

    # --- Boundary: SAFE vs UNSAFE classification ---
    grep -qiE '\bSAFE\b|\bUNSAFE\b' "$OUT3" \
      && ok "safety-filter: tests SAFE/UNSAFE classification output" \
      || bad "safety-filter: missed SAFE/UNSAFE output format"

    # --- Robustness: non-English input handling ---
    grep -qiE 'non.?english|multilingual|language|translat|foreign' "$OUT3" \
      && ok "safety-filter: tests non-English input handling" \
      || bad "safety-filter: missed non-English robustness"

    # --- Safety: data leakage — must not reveal rules ---
    grep -qiE 'reveal|leak|expos|system prompt|rules|categor.*secret|never.*reveal' "$OUT3" \
      && ok "safety-filter: tests the no-rule-disclosure boundary" \
      || bad "safety-filter: missed the no-rule-disclosure boundary"

    # --- Adversarial ---
    grep -qiE 'injection|ignore.*instruct|adversar|jailbreak|bypass' "$OUT3" \
      && ok "safety-filter: includes adversarial cases" \
      || bad "safety-filter: no adversarial cases"

    # --- Robustness: ambiguous content defaults to SAFE ---
    grep -qiE 'ambiguous|borderline|edge case|fiction|academic|journalis' "$OUT3" \
      && ok "safety-filter: tests ambiguous-content-defaults-to-SAFE rule" \
      || bad "safety-filter: missed the ambiguous-defaults-to-SAFE rule"

  else
    bad "write-evals (safety-filter): claude -p run failed"
  fi

fi
