#!/bin/bash
# UV Suite static checks — run before commits and in CI.
# Catches the bug classes we've actually hit:
#   - README drift (claimed counts diverging from shipped files)
#   - simple_expansion patterns in skill ! blocks (breaks the harness)
#   - broken persona JSON
#   - missing shebang / non-executable hooks
#   - watchtower server.js syntax errors

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
section() { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }
ok()      { printf "  \033[32m✓\033[0m %s\n" "$1"; }
bad()     { printf "  \033[31m✗\033[0m %s\n" "$1"; fail=1; }

# --- README count drift -------------------------------------------------------

section "README counts match shipped files"

count_dir() { ls -1 "$1" 2>/dev/null | wc -l | tr -d ' '; }

skills_actual=$(count_dir skills)
hooks_actual=$(count_dir hooks)
agents_actual=$(count_dir agents/claude-code)
personas_actual=$(count_dir personas)
guardrails_actual=$(count_dir guardrails)

check_count() {
  local label="$1" actual="$2" pattern="$3"
  if grep -qE "$pattern" README.md; then
    ok "$label: $actual (README matches)"
  else
    bad "$label: $actual but README does not contain pattern '$pattern'"
  fi
}

check_count "skills"     "$skills_actual"     "$skills_actual[[:space:]]+(skills|slash commands)"
check_count "hooks"      "$hooks_actual"      "$hooks_actual[[:space:]]+hooks?"
check_count "agents"     "$agents_actual"     "$agents_actual[[:space:]]+agents?"
check_count "personas"   "$personas_actual"   "$personas_actual[[:space:]]+personas?"
check_count "guardrails" "$guardrails_actual" "$guardrails_actual[[:space:]]+(guardrails|anti-slop)"

# Every skill mentioned by name in source should also appear in README's skills table
for skill_dir in skills/*/; do
  name=$(basename "$skill_dir")
  if ! grep -qE "/${name}([[:space:]]|\`|\])" README.md; then
    bad "skill '/$name' is in skills/ but not mentioned in README"
  fi
done
ok "every skill in skills/ is referenced in README"

# --- Skill ! blocks must not use simple_expansion ----------------------------

section "Skills don't use simple_expansion in ! blocks"
# Patterns that the Claude Code harness blocks:
#   $(...)     command substitution
#   "$VAR"     quoted variable expansion
#   $VAR       bare variable expansion
# Only flag inside lines beginning with !` or ! `
for sf in skills/*/SKILL.md; do
  bad_lines=$(grep -nE '^!`' "$sf" | grep -E '\$\(|\$\{?[A-Z_][A-Z_0-9]*' || true)
  if [ -n "$bad_lines" ]; then
    bad "$sf has variable/command expansion in a ! block:"
    echo "$bad_lines" | sed 's/^/      /'
  fi
done
[ $fail -eq 0 ] && ok "no simple_expansion patterns in any skill ! block"

# --- Skill frontmatter sanity ------------------------------------------------

section "Skills have required frontmatter"
for sf in skills/*/SKILL.md; do
  for field in name description; do
    if ! grep -qE "^${field}:" "$sf"; then
      bad "$sf missing '$field' frontmatter"
    fi
  done
done
[ $fail -eq 0 ] && ok "all skills have name + description"

# --- Persona JSON validates --------------------------------------------------

section "Persona JSON is valid"
for pf in personas/*.json; do
  if python3 -m json.tool < "$pf" > /dev/null 2>&1; then
    ok "$(basename "$pf")"
  else
    bad "$(basename "$pf") is not valid JSON"
  fi
done

# --- Hooks have shebang ------------------------------------------------------

section "Hooks have shebang and are executable"
for hf in hooks/*.sh; do
  if ! head -1 "$hf" | grep -qE '^#!'; then
    bad "$(basename "$hf") missing shebang"
  fi
  if [ ! -x "$hf" ]; then
    bad "$(basename "$hf") is not executable (chmod +x)"
  fi
done
[ $fail -eq 0 ] && ok "all hooks have shebang and +x"

# --- Watchtower syntax -------------------------------------------------------

section "Watchtower syntax"
if command -v node > /dev/null; then
  if node -c watchtower/server.js 2>/dev/null; then
    ok "watchtower/server.js parses"
  else
    bad "watchtower/server.js has a syntax error"
  fi
else
  ok "node not installed, skipping"
fi

# --- Summary -----------------------------------------------------------------

echo
if [ $fail -eq 0 ]; then
  printf "\033[32mAll checks passed.\033[0m\n"
else
  printf "\033[31mChecks failed.\033[0m See above.\n"
fi
exit $fail
