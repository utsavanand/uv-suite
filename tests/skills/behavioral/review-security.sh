#!/usr/bin/env bash
# Behavioral test: security-review must flag the planted SQL injection in auth.py.

FLAW="$REPO_ROOT/tests/skills/fixtures/flawed"
file_exists "flawed fixture: auth.py" "$FLAW/auth.py"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-security-review.out"
  if run_skill "$OUT" "/uvs-review --security tests/skills/fixtures/flawed/auth.py"; then
    must_have "$OUT" "auth.py" "locates auth.py"
    grep -qiE 'sql injection|sqli|injection' "$OUT" \
      && ok "flags the SQL injection" \
      || bad "missed the planted SQL injection"
  else
    bad "security-review: claude -p run failed"
  fi
fi
