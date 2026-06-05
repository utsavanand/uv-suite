#!/usr/bin/env bash
# Shared helpers for skill tests. Source this — don't execute it directly.
# run.sh sources this once, then sources contract.sh and behavioral/*.sh.

SKILLTEST_LIB=1
# Git toplevel is authoritative (works under bash or zsh); fall back to path-relative.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -n "$REPO_ROOT" ] || REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"
: "${LLM_MODE:=0}"

PASS=0
FAIL=0
declare -a FAILMSGS=()

ok()  { PASS=$((PASS+1)); printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); FAILMSGS+=("$1"); printf '  \033[31m✗\033[0m %s\n' "$1"; }

eq()      { [ "$2" = "$3" ] && ok "$1" || bad "$1 (want '$2' got '$3')"; }
present() { [ -n "$2" ] && ok "$1" || bad "$1 (empty)"; }
file_exists() { [ -f "$2" ] && ok "$1" || bad "$1 (no file: $2)"; }

# Frontmatter helpers — operate on the leading `---` ... `---` block.
fm()      { awk -v k="$2" 'BEGIN{n=0} /^---[[:space:]]*$/{n++;next} n==1 && $0 ~ "^"k":"{sub("^"k":[[:space:]]*","");print;exit}' "$1"; }
fmblock() { awk 'BEGIN{n=0} /^---[[:space:]]*$/{n++; if(n==2)exit; next} n==1{print}' "$1"; }
fmbody()  { awk 'BEGIN{n=0} /^---[[:space:]]*$/{n++;next} n>=2{print}' "$1"; }

# Golden-facts assertions over a captured output file.
must_have() { grep -qiF -- "$2" "$1" && ok "$3" || bad "$3 — output missing '$2'"; }
must_not()  { grep -qiF -- "$2" "$1" && bad "$3 — output wrongly contains '$2'" || ok "$3"; }

# Run a skill headlessly, capturing output to $1. Skipped unless --llm.
# Grants only the tools the skills declare — no permission bypass. In -p mode the
# skill prints its result to stdout (it does not write uv-out/), so we assert on $1.
run_skill() {
  [ "$LLM_MODE" = 1 ] || return 1
  # Run from REPO_ROOT so relative paths in the prompt (e.g. fixtures/...) resolve.
  ( cd "$REPO_ROOT" && claude -p "$2" \
    --allowedTools Read Grep Glob "Write(uv-out/**)" \
      "Bash(find *)" "Bash(cat *)" "Bash(ls *)" "Bash(head *)" "Bash(wc *)" \
      "Bash(git *)" "Bash(grep *)" "Bash(graphify *)" "Bash(semgrep *)" \
    >"$1" 2>/dev/null </dev/null )
}

summary() {
  echo
  if [ "$FAIL" -gt 0 ]; then
    printf '\033[31m%d failed\033[0m, %d passed\n\nfailures:\n' "$FAIL" "$PASS"
    for m in "${FAILMSGS[@]}"; do printf '  - %s\n' "$m"; done
    return 1
  fi
  printf '\033[32mall %d checks passed\033[0m\n' "$PASS"
}
