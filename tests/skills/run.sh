#!/usr/bin/env bash
# Skill test runner.
#   ./run.sh         fast tier only: contract lint + deterministic discovery (no LLM)
#   ./run.sh --llm   also run the behavioral golden-facts tier (invokes `claude -p`)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib.sh"

for a in "$@"; do [ "$a" = "--llm" ] && LLM_MODE=1; done
if [ "$LLM_MODE" = 1 ]; then
  echo "(behavioral mode: will invoke 'claude -p' — costs tokens)"
else
  echo "(fast mode: no LLM. Pass --llm to run behavioral golden-facts.)"
fi
echo

source "$HERE/contract.sh"

for t in "$HERE"/behavioral/*.sh; do
  echo
  echo "== behavioral: $(basename "$t" .sh) =="
  source "$t"
done

summary
