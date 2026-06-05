#!/usr/bin/env bash
# Behavioral test: understand in both modes against the pdf-qa fixture.

FIX="$REPO_ROOT/fixtures/pdf-qa"
file_exists "fixture: pdf-qa compose (stack)" "$FIX/docker-compose.yml"
file_exists "fixture: backend entry (repo)" "$FIX/backend/app/main.py"

if [ "$LLM_MODE" = 1 ]; then
  # --- Stack mode ---
  OUT="$REPO_ROOT/uv-out/test-understand-stack.out"
  if run_skill "$OUT" "/understand fixtures/pdf-qa --stack"; then
    for t in frontend bff backend sdk Go Python REST; do must_have "$OUT" "$t" "stack names '$t'"; done
    for t in Kafka gRPC GraphQL PostgreSQL Redis; do must_not "$OUT" "$t" "stack: no hallucinated '$t'"; done
  else
    bad "understand --stack: claude -p run failed"
  fi

  # --- Repo mode ---
  OUT2="$REPO_ROOT/uv-out/test-understand-repo.out"
  if run_skill "$OUT2" "/understand fixtures/pdf-qa/backend --repo"; then
    for t in FastAPI "TF-IDF" documents ask; do must_have "$OUT2" "$t" "repo names '$t'"; done
    for t in Kafka gRPC PostgreSQL; do must_not "$OUT2" "$t" "repo: no hallucinated '$t'"; done
  else
    bad "understand --repo: claude -p run failed"
  fi
fi
