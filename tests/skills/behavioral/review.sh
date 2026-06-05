#!/usr/bin/env bash
# Behavioral test: review must flag the planted off-by-one in paginate.py.

FLAW="$REPO_ROOT/tests/skills/fixtures/flawed"
file_exists "flawed fixture: paginate.py" "$FLAW/paginate.py"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-review.out"
  if run_skill "$OUT" "/review tests/skills/fixtures/flawed/paginate.py"; then
    must_have "$OUT" "paginate" "locates paginate.py"
    grep -qiE 'off.?by.?one|page \* size|skip|overlap|index' "$OUT" \
      && ok "flags the off-by-one" \
      || bad "missed the off-by-one bug"
  else
    bad "review: claude -p run failed"
  fi
fi
