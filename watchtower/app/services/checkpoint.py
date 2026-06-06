"""Out-of-band session checkpoints.

Writes a markdown checkpoint from the session's recent events + git state.
No live session is required — everything is read from the database and the cwd's
git repo, so we can checkpoint a session we don't own (e.g. before closing it).
"""
import collections
import json
import os
import subprocess
from datetime import datetime, timezone

from app import db


def _git(cwd: str, *args: str) -> str:
    """Best-effort `git -C <cwd> <args>`; empty string on any failure."""
    try:
        proc = subprocess.run(
            ["git", "-C", cwd, *args],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return proc.stdout.strip() if proc.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def _git_state(cwd: str) -> str:
    branch = _git(cwd, "branch", "--show-current") or "(unknown)"
    status = _git(cwd, "status", "--short") or "(clean)"
    log = _git(cwd, "log", "--oneline", "-5") or "(no commits)"
    return (
        f"- Branch: `{branch}`\n\n"
        f"Working tree:\n```\n{status}\n```\n\n"
        f"Recent commits:\n```\n{log}\n```\n"
    )


def _summarize(events: list) -> str:
    """Derive 'what was done' from event payloads: the prompts the user sent (the
    actual asks), files edited, and a tool breakdown. Events arrive newest-first."""
    prompts, files, tools = [], collections.Counter(), collections.Counter()
    for e in events:
        raw = e.get("payload")
        try:
            p = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except (ValueError, TypeError):
            p = {}

        if e.get("event_type") == "UserPromptSubmit":
            txt = (p.get("prompt") or p.get("user_prompt") or "").strip()
            if txt:
                prompts.append(" ".join(txt.split())[:240])

        tool = e.get("tool_name") or p.get("tool_name")
        if tool:
            tools[tool] += 1
            fp = (p.get("tool_input") or {}).get("file_path")
            if fp and tool in ("Edit", "Write", "MultiEdit"):
                files[fp] += 1

    parts = []
    if prompts:
        asks = "\n".join(f"- {t}" for t in reversed(prompts[:12]))  # chronological
        parts.append(f"**Asked ({len(prompts)}):**\n{asks}")
    if files:
        touched = "\n".join(f"- `{f}` ({n}×)" for f, n in files.most_common(15))
        parts.append(f"**Files changed:**\n{touched}")
    if tools:
        breakdown = ", ".join(f"{n}× {t}" for t, n in tools.most_common(10))
        parts.append(f"**Tool usage:** {breakdown}")
    return "\n\n".join(parts) if parts else "_No recorded activity yet._"


def _render(session: dict, events: list, git_state: str, created: str) -> str:
    sid = session["id"]
    name = session.get("name") or sid

    meta_rows = [
        ("Name", session.get("name")),
        ("Kind", session.get("kind")),
        ("Purpose", session.get("purpose")),
        ("Priority", session.get("priority")),
        ("Persona", session.get("persona")),
        ("Parent", session.get("parent_id")),
        ("Started", session.get("started_at")),
        ("cwd", session.get("cwd")),
    ]
    meta = "\n".join(f"- **{k}:** {v}" for k, v in meta_rows if v)

    work = _summarize(events)

    return f"""---
session: {sid}
name: {session.get("name") or ""}
kind: {session.get("kind") or ""}
priority: {session.get("priority") or ""}
parent: {session.get("parent_id") or ""}
created: {created}
source: watchtower
---

# Checkpoint: {name}

## Session

{meta}

## What was done

{work}

## Git state

{git_state}
"""


async def write_checkpoint(session: dict) -> str:
    sid = session["id"]
    cwd = session.get("cwd") or os.getcwd()

    events = await db.fetch(
        """SELECT event_type, tool_name, command, payload, created_at
             FROM events
            WHERE session_id = ?
         ORDER BY created_at DESC
            LIMIT 200""",
        sid,
    )

    now = datetime.now(timezone.utc)
    created = now.isoformat()
    git_state = _git_state(cwd)
    content = _render(session, events, git_state, created)

    out_dir = os.path.join(cwd, "uv-out", "sessions", sid, "checkpoints")
    os.makedirs(out_dir, exist_ok=True)
    fname = f"manual-{now.strftime('%Y-%m-%d-%H%M')}.md"
    path = os.path.join(out_dir, fname)

    with open(path, "w") as f:
        f.write(content)
    with open(os.path.join(out_dir, "latest.md"), "w") as f:
        f.write(content)

    return os.path.abspath(path)
