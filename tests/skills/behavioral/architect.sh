#!/usr/bin/env bash
# Behavioral test: architect decomposes into Acts and does NOT over-engineer a
# deliberately tiny feature (the core anti-architecture-slop assertion).

FIX="$REPO_ROOT/tests/skills/fixtures/spec-input/todo-feature.md"
file_exists "fixture: todo-feature.md" "$FIX"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-architect.out"
  if run_skill "$OUT" "/uvs-architect $(cat "$FIX")"; then
    grep -qiE 'act ?[0-9]|## act|acts\b' "$OUT" && ok "decomposes into Acts" || bad "no Acts breakdown"
    grep -qiE 'sqlite|database|data store' "$OUT" && ok "plans the data store" || bad "no data store in plan"
    # 100 tasks, one process, single user — none of this is justified.
    for t in microservice Kafka "event sourcing" CQRS "service mesh" Kubernetes Redis "message queue"; do
      must_not "$OUT" "$t" "no over-engineering '$t'"
    done
  else
    bad "architect: claude -p run failed"
  fi
fi
