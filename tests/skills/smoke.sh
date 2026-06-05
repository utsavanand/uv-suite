#!/usr/bin/env bash
# Post-install smoke test (deterministic, no LLM).
#
# Installs UV Suite into a temp project, then executes EVERY skill's `!` blocks with
# CLAUDE_PROJECT_DIR UNSET — the exact condition Claude Code gives a skill's `!` blocks.
# Fails on any block that errors with a missing path or missing command.
#
# Catches the class of bug where a skill references a hook/path that only works in the
# source tree, or assumes an env var that isn't set at runtime (e.g. the
# $CLAUDE_PROJECT_DIR/.claude/hooks/... → /.claude/hooks/... collapse), and the
# install-doesn't-copy-sub-folders bug.
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
T=$(mktemp -d /tmp/uv-smoke-XXXX)
printf '# smoke\n' > "$T/CLAUDE.md"
echo "installing into $T ..."
bash "$REPO/install.sh" --project "$T" >/dev/null 2>&1 || true  # optional integrations may exit non-zero
[ -n "$(ls -A "$T/.claude/skills" 2>/dev/null)" ] || { echo "install did not produce .claude/skills"; exit 1; }

python3 - "$T" <<'PY'
import os, re, subprocess, sys, glob
proj = sys.argv[1]
env = {k: v for k, v in os.environ.items() if k != "CLAUDE_PROJECT_DIR"}  # as a skill ! block sees it
env["ARGUMENTS"] = ""

def blocks(md):
    out = re.findall(r'^```!\s*\n(.*?)\n```', md, re.S | re.M)   # fenced ```! ... ```
    out += re.findall(r'^!`(.*)`[ \t]*$', md, re.M)              # inline !`...`
    return out

npass, fails = 0, []
for sk in sorted(glob.glob(os.path.join(proj, ".claude/skills/*/SKILL.md"))):
    name = os.path.basename(os.path.dirname(sk))
    for i, blk in enumerate(blocks(open(sk).read())):
        try:
            r = subprocess.run(["bash", "-c", blk], cwd=proj, env=env,
                               capture_output=True, text=True, timeout=30)
        except subprocess.TimeoutExpired:
            fails.append(f"{name} block#{i}: TIMEOUT"); continue
        e = r.stderr.lower()
        if any(s in e for s in ("no such file or directory", "command not found", "unbound variable")):
            last = r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ""
            fails.append(f"{name} block#{i}: {last}")
        else:
            npass += 1

print(f"smoke: {npass} ! blocks ran clean, {len(fails)} failing")
for f in fails:
    print("  FAIL:", f)
sys.exit(1 if fails else 0)
PY
rc=$?
echo "(temp install left at $T)"
exit $rc
