#!/usr/bin/env bash
# Behavioral test: test (unit/integration mode) — generated tests target real symbols with real assertions.

TARGET="$REPO_ROOT/fixtures/pdf-qa/backend/app/qa.py"
file_exists "target: qa.py" "$TARGET"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-write-tests.out"
  if run_skill "$OUT" "/uvs-test fixtures/pdf-qa/backend/app/qa.py"; then
    # Must exercise the actual code under test.
    must_have "$OUT" "Index" "tests the Index class"
    must_have "$OUT" "answer" "tests the answer() method"
    grep -qiE '\bassert\b' "$OUT" && ok "has assertions" || bad "no assertions in generated tests"
    # Test-slop guards: no existence-only assertions, no JS leakage.
    for t in toBeTruthy toBeDefined; do must_not "$OUT" "$t" "no JS slop assertion '$t'"; done
  else
    bad "write-tests: claude -p run failed"
  fi
fi
