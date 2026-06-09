"""Control router: drives sessions (spawn, close, approve, checkpoint).

# SECURITY: these routes act on the host — they spawn processes, send keystrokes,
# kill PIDs, and write files. They must NOT be exposed to the network. The service
# is started with `--host 127.0.0.1`; keep it bound to localhost.
"""
import asyncio
import json
import os
import re
import shlex
import shutil
import signal
import subprocess
import sys
import uuid

from fastapi import APIRouter, HTTPException

from app import db
from app.models import ApprovalDecision, SpawnRequest
from app.services import checkpoint, tmux

router = APIRouter()

_SAFE_ID = re.compile(r"[A-Za-z0-9._-]{1,128}")


def _require_safe_fs(session: dict) -> None:
    """Guard the filesystem-write boundary: the session id must be a safe path
    component (no separators / traversal) and any cwd must be an existing directory.
    Session ids and cwds arrive from unauthenticated hook ingest, so don't trust them
    when they drive `os.path.join` write paths or a tmux working dir."""
    sid = session.get("id") or ""
    if not _SAFE_ID.fullmatch(sid) or sid in (".", ".."):
        raise HTTPException(status_code=400, detail="unsafe session id")
    cwd = session.get("cwd")
    if cwd and not os.path.isdir(cwd):
        raise HTTPException(status_code=400, detail="session cwd is not an existing directory")


def _terminal_app(pref: str | None = None) -> str:
    """Which macOS terminal to open. Precedence: the UI setting (pref), then the
    UVS_TERMINAL env, then the terminal that launched Watchtower (TERM_PROGRAM),
    then Terminal.app. 'auto'/empty falls through to detection."""
    for candidate in (pref, os.environ.get("UVS_TERMINAL", "")):
        c = (candidate or "").strip().lower()
        if c in ("iterm", "iterm2"):
            return "iterm"
        if c in ("terminal", "terminal.app", "apple_terminal"):
            return "terminal"
    if os.environ.get("TERM_PROGRAM") == "iTerm.app":
        return "iterm"
    return "terminal"


def _term_script(app: str, attach: str) -> str:
    if app == "iterm":
        return (
            'tell application "iTerm"\n'
            "  create window with default profile\n"
            f'  tell current session of current window to write text "{attach}"\n'
            "  activate\n"
            "end tell"
        )
    return f'tell application "Terminal" to do script "{attach}"\ntell application "Terminal" to activate'


def _open_terminal(target: str, pref: str | None = None) -> bool:
    """Best-effort: open a terminal window attached to the tmux session (macOS).
    Tries the preferred app first, then the other as a fallback."""
    if sys.platform != "darwin":
        return False
    attach = f"tmux -L {tmux.SOCKET} attach -t {shlex.quote(target)}"
    order = ["iterm", "terminal"] if _terminal_app(pref) == "iterm" else ["terminal", "iterm"]
    for app in order:
        if subprocess.run(["osascript", "-e", _term_script(app, attach)], capture_output=True).returncode == 0:
            return True
    return False

# Claude Code's permission gate is a numbered arrow-select menu confirmed with Enter and
# cancelled with Esc (verified live: the trust-folder and tool-permission prompts use the
# same widget — it is NOT a y/n prompt). Approve = select option 1 ("Yes") + Enter;
# deny = Esc. This is the one part coupled to the tool's TUI; revisit if the widget changes.


async def _load_session(id: str) -> dict:
    row = await db.fetchrow("SELECT * FROM sessions WHERE id = ?", id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"session {id} not found")
    return row


@router.post("/sessions/{id}/checkpoint")
async def checkpoint_session(id: str) -> dict:
    session = await _load_session(id)
    _require_safe_fs(session)
    path = await checkpoint.write_checkpoint(session)
    db.notify({"type": "checkpoint", "session_id": id, "path": path})
    return {"path": path}


@router.post("/sessions/{id}/close")
async def close_session(id: str) -> dict:
    session = await _load_session(id)
    _require_safe_fs(session)

    path = await checkpoint.write_checkpoint(session)

    terminated_via = None
    if session.get("tmux_target"):
        await asyncio.to_thread(tmux.kill_session, session["tmux_target"])
        terminated_via = "tmux"
    elif session.get("pid"):
        try:
            os.kill(session["pid"], signal.SIGTERM)
            terminated_via = "pid"
        except ProcessLookupError:
            terminated_via = "pid_gone"

    await db.execute(
        "UPDATE sessions SET state = 'terminated', ended_at = CURRENT_TIMESTAMP WHERE id = ?",
        id,
    )
    db.notify({"type": "session", "session_id": id, "state": "terminated"})
    return {"ok": True, "checkpoint": path, "terminated_via": terminated_via}


@router.post("/approvals/{approval_id}/decide")
async def decide_approval(approval_id: int, decision: ApprovalDecision) -> dict:
    """Resolve an approval by its own id. Actuates via send-keys when the session is
    owned (tmux); otherwise still records the decision so it clears from the UI (the
    user answers in the terminal). Never 404s on a missing/unowned session."""
    appr = await db.fetchrow("SELECT * FROM approvals WHERE id = ?", approval_id)
    if appr is None:
        raise HTTPException(status_code=404, detail="approval not found")

    sid = appr["session_id"]
    session = await db.fetchrow("SELECT * FROM sessions WHERE id = ?", sid)

    actuated = False
    if session and session.get("tmux_target"):
        keys = "1" if decision.decision == "approve" else "Escape"  # numbered menu: 1=Yes / Esc=cancel
        await asyncio.to_thread(tmux.send_keys, session["tmux_target"], keys, decision.decision == "approve")
        actuated = True

    new_status = "approved" if decision.decision == "approve" else "denied"
    await db.execute(
        "UPDATE approvals SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?",
        new_status, decision.decided_by, approval_id,
    )
    if session:
        await db.execute("UPDATE sessions SET state = 'active' WHERE id = ?", sid)
    db.notify({"type": "approval", "id": approval_id, "session_id": sid, "status": new_status})
    return {"ok": True, "status": new_status, "actuated": actuated}


@router.post("/sessions/{id}/compact")
async def compact_session(id: str) -> dict:
    session = await _load_session(id)
    if not session.get("tmux_target"):
        raise HTTPException(
            status_code=400,
            detail="session not owned by Watchtower; run /compact in the terminal",
        )
    await asyncio.to_thread(tmux.send_keys, session["tmux_target"], "/compact", True)
    db.notify({"type": "event", "session_id": id, "event_type": "Compact"})
    return {"ok": True}


@router.post("/sessions/{id}/fork")
async def fork_session(id: str, open: bool = True) -> dict:
    parent = await _load_session(id)
    _require_safe_fs(parent)
    if not tmux.has_tmux():
        raise HTTPException(status_code=400, detail="tmux not available; cannot fork")

    child = uuid.uuid4().hex
    cwd = parent.get("cwd") or os.getcwd()
    persona = parent.get("persona") or "professional"
    name = (parent.get("name") or parent["id"][:8]) + " (fork)"

    # Write a metadata file so the child's hooks attribute events to it (name, persona,
    # parent) instead of falling back to Claude's internal session id.
    try:
        meta_dir = os.path.join(cwd, ".uv-suite-state", "sessions")
        os.makedirs(meta_dir, exist_ok=True)
        with open(os.path.join(meta_dir, f"{child}.json"), "w") as f:
            json.dump(
                {"uvs_session_id": child, "name": name, "persona": persona,
                 "parent_id": id, "cwd": cwd},
                f,
            )
    except OSError:
        pass  # best-effort; the hook still tags by UVS_SESSION_ID

    settings = os.path.join(cwd, ".claude", "personas", f"{persona}.json")
    claude = "claude" + (f" --settings {shlex.quote(settings)}" if os.path.isfile(settings) else "")
    cmd = f"UVS_SESSION_ID={child} UVS_IN_TMUX=1 exec {claude}"

    try:
        target = await asyncio.to_thread(tmux.spawn, child, cmd, cwd)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    await db.execute(
        """INSERT INTO sessions (id, name, persona, cwd, tmux_target, parent_id, state)
           VALUES (?, ?, ?, ?, ?, ?, 'active')""",
        child, name, persona, cwd, target, id,
    )
    pref = await db.get_setting("terminal_app")
    opened = await asyncio.to_thread(_open_terminal, target, pref) if open else False
    db.notify({"type": "session", "session_id": child, "state": "active"})
    return {"id": child, "name": name, "tmux_target": target, "parent_id": id, "terminal_opened": opened}


@router.delete("/sessions/{id}")
async def delete_session(id: str) -> dict:
    """Permanently remove a session and its events/approvals from Watchtower.
    Kills the live tmux session first (if owned + active) so it can't re-register.
    On-disk checkpoint files in the project's uv-out/ are left intact."""
    session = await db.fetchrow("SELECT tmux_target, state FROM sessions WHERE id = ?", id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    if session.get("tmux_target") and session.get("state") != "terminated":
        await asyncio.to_thread(tmux.kill_session, session["tmux_target"])
    await db.execute("DELETE FROM events WHERE session_id = ?", id)
    await db.execute("DELETE FROM approvals WHERE session_id = ?", id)
    await db.execute("DELETE FROM sessions WHERE id = ?", id)
    db.notify({"type": "session_deleted", "session_id": id})
    return {"ok": True, "deleted": id}


@router.post("/sessions/cleanup")
async def cleanup_sessions() -> dict:
    """Permanently remove ALL sessions (and their events/approvals). Kills any owned,
    still-live tmux sessions first. Used by the dashboard's double-confirmed cleanup."""
    live = await db.fetch(
        "SELECT tmux_target FROM sessions WHERE state != 'terminated' AND tmux_target IS NOT NULL"
    )
    for r in live:
        await asyncio.to_thread(tmux.kill_session, r["tmux_target"])
    count = (await db.fetchrow("SELECT count(*) AS n FROM sessions"))["n"]
    await db.execute("DELETE FROM events")
    await db.execute("DELETE FROM approvals")
    await db.execute("DELETE FROM sessions")
    db.notify({"type": "cleanup"})
    return {"ok": True, "deleted": count}


@router.post("/sessions/spawn")
async def spawn_session(req: SpawnRequest) -> dict:
    if not tmux.has_tmux():
        raise HTTPException(status_code=400, detail="tmux not available; cannot spawn")

    id = uuid.uuid4().hex
    cwd = req.cwd or os.getcwd()

    # Prefer the real `uvs <tool> <persona>` launcher; fall back to the bare tool.
    # tool/persona are Literals (validated by the model), and quoted here as defense in depth.
    launch = f"uvs {req.tool} {shlex.quote(req.persona)}" if shutil.which("uvs") else req.tool
    cmd = f"UVS_SESSION_ID={id} {launch}"

    try:
        target = await asyncio.to_thread(tmux.spawn, id, cmd, cwd)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    await db.execute(
        """INSERT INTO sessions (id, persona, cwd, tmux_target, state)
           VALUES (?, ?, ?, ?, 'active')
           ON CONFLICT (id) DO UPDATE SET
             persona     = COALESCE(excluded.persona, sessions.persona),
             cwd         = COALESCE(excluded.cwd, sessions.cwd),
             tmux_target = excluded.tmux_target,
             state       = 'active'""",
        id, req.persona, cwd, target,
    )
    db.notify({"type": "session", "session_id": id, "state": "active"})
    return {"id": id, "tmux_target": target}
