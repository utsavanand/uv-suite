#!/usr/bin/env bash
# Behavioral test: spec captures the stated requirements without inventing scope.

FIX="$REPO_ROOT/tests/skills/fixtures/spec-input/todo-feature.md"
file_exists "fixture: todo-feature.md" "$FIX"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-spec.out"
  if run_skill "$OUT" "/uvs-spec $(cat "$FIX")"; then
    # The four operations + the storage choice must be specified.
    for t in add list delete SQLite; do must_have "$OUT" "$t" "spec covers '$t'"; done
    grep -qiE 'done|complete' "$OUT" && ok "spec covers mark-done" || bad "spec missing mark-done"
    # Input says no auth / ~100 tasks: adding auth or scale infra is scope creep.
    for t in OAuth JWT Kafka Redis microservice; do must_not "$OUT" "$t" "no invented scope '$t'"; done
  else
    bad "spec: claude -p run failed"
  fi
fi
