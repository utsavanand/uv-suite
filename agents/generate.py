#!/usr/bin/env python3
"""Generate Cursor (.mdc) and Codex (.toml) agent files from the canonical
Claude Code agent definitions in agents/claude-code/*.md.

Single source of truth: edit agents/claude-code/<name>.md, then install.sh (or
`python3 agents/generate.py <cursor|codex> <dest-dir>`) regenerates the others.

Usage:
  python3 agents/generate.py cursor /path/to/.cursor/rules
  python3 agents/generate.py codex  /path/to/.codex/agents
"""
import glob
import os
import re
import sys

CANONICAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "claude-code")


def parse(md, fallback_name):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", md, re.S)
    fm, body = (m.group(1), m.group(2).strip()) if m else ("", md.strip())

    def field(key):
        mm = re.search(rf"^{key}:\s*(.*)$", fm, re.M)
        return mm.group(1).strip() if mm else ""

    # description is usually a folded scalar (`description: >` then indented lines)
    desc = field("description")
    if desc in (">", "|", ">-", "|-", ""):
        lines = fm.splitlines()
        idx = next((i for i, l in enumerate(lines) if l.startswith("description:")), None)
        if idx is not None:
            collected = []
            for l in lines[idx + 1:]:
                if re.match(r"^\s+\S", l):
                    collected.append(l.strip())
                else:
                    break
            desc = " ".join(collected) or desc
    desc = desc.strip().strip('"')

    return {
        "name": field("name") or fallback_name,
        "desc": desc,
        "model": field("model"),
        "has_write": ("Write" in fm or "Edit" in fm),
        "body": body,
    }


def to_mdc(a):
    desc = a["desc"].replace('"', '\\"')
    return f'---\ndescription: "{desc}"\nglobs: ""\nalwaysApply: false\n---\n\n{a["body"]}\n'


def to_toml(a):
    effort = "high" if a["model"] == "opus" else "medium"
    sandbox = "workspace-write" if a["has_write"] else "read-only"
    desc = a["desc"].replace("\\", "\\\\").replace('"', '\\"')
    body = a["body"].replace("\\", "\\\\").replace('"""', '\\"\\"\\"')
    return (
        f'name = "{a["name"]}"\n'
        f'description = "{desc}"\n'
        f'model_reasoning_effort = "{effort}"\n'
        f'sandbox_mode = "{sandbox}"\n\n'
        f'developer_instructions = """\n{body}\n"""\n'
    )


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ("cursor", "codex"):
        sys.exit("usage: generate.py <cursor|codex> <dest-dir>")
    fmt, dest = sys.argv[1], sys.argv[2]
    os.makedirs(dest, exist_ok=True)
    ext = ".mdc" if fmt == "cursor" else ".toml"
    render = to_mdc if fmt == "cursor" else to_toml
    n = 0
    for path in sorted(glob.glob(os.path.join(CANONICAL, "*.md"))):
        name = os.path.splitext(os.path.basename(path))[0]
        a = parse(open(path).read(), name)
        open(os.path.join(dest, name + ext), "w").write(render(a))
        n += 1
    print(f"generated {n} {fmt} agents -> {dest}")


if __name__ == "__main__":
    main()
