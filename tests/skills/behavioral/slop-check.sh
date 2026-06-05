#!/usr/bin/env bash
# Behavioral test: slop-check must flag the single-impl factory and the comment slop in processor.ts.

FLAW="$REPO_ROOT/tests/skills/fixtures/flawed"
file_exists "flawed fixture: processor.ts" "$FLAW/processor.ts"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-slop-check.out"
  if run_skill "$OUT" "/slop-check tests/skills/fixtures/flawed/processor.ts"; then
    must_have "$OUT" "processor.ts" "locates processor.ts"
    grep -qiE 'factory|single implementation|over-?engineer' "$OUT" \
      && ok "flags the single-impl factory" \
      || bad "missed the over-engineering slop"
    grep -qiE 'comment' "$OUT" \
      && ok "flags the comment slop" \
      || bad "missed the comment slop"
  else
    bad "slop-check: claude -p run failed"
  fi
fi
