"""Out-of-band session checkpoints.

Writes a markdown checkpoint from the session's recent events + git state.
No live session is required — everything is read from the database and the cwd's
git repo, so we can checkpoint a session we don't own (e.g. before closing it).
"""
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


def _render(session: dict, events: list, git_state: str, created: str) -> str:
    sid = session["id"]
    name = session.get("name") or sid

    lines = []
    for e in events:
        raw_ts = e["created_at"]
        ts = raw_ts.isoformat() if hasattr(raw_ts, "isoformat") else (raw_ts or "")
        bits = [e["event_type"] or "Event"]
        if e["tool_name"]:
            bits.append(e["tool_name"])
        if e["command"]:
            bits.append(f"`{e['command']}`")
        lines.append(f"- {ts} — {' '.join(bits)}")
    activity = "\n".join(lines) if lines else "_No recorded events._"

    return f"""---
session: {sid}
created: {created}
source: watchtower
---

# Checkpoint: {name}

## What's in progress

<!-- TODO: optional semantic summary via `claude -p --model haiku`.
     v1 is mechanical (events + git). Do not depend on `claude` being present. -->
_Mechanical checkpoint — see recent activity and git state below._

## Recent activity

{activity}

## Git state

{git_state}
"""


async def write_checkpoint(session: dict) -> str:
    sid = session["id"]
    cwd = session.get("cwd") or os.getcwd()

    events = await db.fetch(
        """SELECT event_type, tool_name, command, created_at
             FROM events
            WHERE session_id = ?
         ORDER BY created_at DESC
            LIMIT 50""",
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
