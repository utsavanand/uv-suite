#!/usr/bin/env bash
# L1 contract lint — validates every skill's frontmatter. No LLM. Sourced by run.sh.

VALID_MODELS="claude-opus-4-8 claude-opus-4-7 claude-opus-4-6 claude-sonnet-4-6 claude-haiku-4-5 claude-haiku-4-5-20251001"

echo "== L1 contract (all skills) =="
for f in "$REPO_ROOT"/skills/*/SKILL.md; do
  d=$(basename "$(dirname "$f")")

  # Skip tombstones — files that don't open with a frontmatter block.
  head -1 "$f" | grep -q '^---' || { printf '  · %s skipped (no frontmatter — tombstone)\n' "$d"; continue; }

  eq "[$d] name matches dir" "$d" "$(fm "$f" name)"
  present "[$d] has description" "$(fm "$f" description)"

  agent=$(fm "$f" agent)
  [ -n "$agent" ] && file_exists "[$d] agent '$agent' defined" "$REPO_ROOT/agents/claude-code/$agent.md"

  model=$(fm "$f" model)
  if [ -n "$model" ]; then
    echo "$VALID_MODELS" | grep -qw "$model" \
      && ok "[$d] model '$model' valid" \
      || bad "[$d] model '$model' not in allowlist"
  fi

  # If the body instructs writing to uv-out, allowed-tools must grant Write.
  if fmbody "$f" | grep -qiE 'write[^.]{0,60}uv-out'; then
    fmblock "$f" | grep -q 'Write(' \
      && ok "[$d] writes uv-out → Write() granted" \
      || bad "[$d] instructs uv-out write but no Write() grant"
  fi
done
