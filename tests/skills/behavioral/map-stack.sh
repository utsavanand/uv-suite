#!/usr/bin/env bash
# Behavioral test: map-stack against the polyglot pdf-qa fixture (known ground truth).

FIX="$REPO_ROOT/fixtures/pdf-qa"

# --- Fast tier (no LLM): the discovery patterns must recognize all 4 services. ---
svc=$(cd "$FIX" && find . -maxdepth 3 \
  \( -name package.json -o -name go.mod -o -name requirements.txt \
     -o -name pom.xml -o -name Cargo.toml -o -name pyproject.toml -o -name setup.py \) \
  -not -path '*/node_modules/*' 2>/dev/null | wc -l | tr -d ' ')
eq "discovery finds 4 service build-files" "4" "$svc"
file_exists "fixture has docker-compose" "$FIX/docker-compose.yml"

# --- Behavioral tier (--llm): run the skill, assert ground truth, forbid hallucinations. ---
if [ "$LLM_MODE" = 1 ]; then
  OUT="$REPO_ROOT/uv-out/test-map-stack.out"
  if run_skill "$OUT" "/map-stack fixtures/pdf-qa"; then
    for t in frontend bff backend sdk Go Python "@pdf-qa/sdk" REST; do
      must_have "$OUT" "$t" "names '$t'"
    done
    # The fixture has no message bus, RPC layer, or database — flagging any is a hallucination.
    for t in Kafka gRPC GraphQL PostgreSQL Redis RabbitMQ; do
      must_not "$OUT" "$t" "no hallucinated '$t'"
    done
  else
    bad "map-stack: claude -p run failed"
  fi
fi
