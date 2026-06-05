#!/usr/bin/env bash
# Behavioral test: map-codebase against a single service (the pdf-qa Python backend).

FIX="$REPO_ROOT/fixtures/pdf-qa/backend"
file_exists "fixture backend has entry point" "$FIX/app/main.py"

if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-map-codebase.out"
  if run_skill "$OUT" "/map-codebase fixtures/pdf-qa/backend"; then
    for t in FastAPI "TF-IDF" pdf documents ask; do
      must_have "$OUT" "$t" "names '$t'"
    done
    for t in Kafka gRPC PostgreSQL; do
      must_not "$OUT" "$t" "no hallucinated '$t'"
    done
  else
    bad "map-codebase: claude -p run failed"
  fi
fi
