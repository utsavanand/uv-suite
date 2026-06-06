"""Control router: drives sessions (spawn, close, approve, checkpoint).

# SECURITY: these routes act on the host — they spawn processes, send keystrokes,
# kill PIDs, and write files. They must NOT be exposed to the network. The service
# is started with `--host 127.0.0.1`; keep it bound to localhost.
"""
import asyncio
import os
import shutil
import signal
import uuid

from fastapi import APIRouter, HTTPException

from app import db
from app.models import ApprovalDecision, SpawnRequest
from app.services import checkpoint, tmux

router = APIRouter()

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
    path = await checkpoint.write_checkpoint(session)
    db.notify({"type": "checkpoint", "session_id": id, "path": path})
    return {"path": path}


@router.post("/sessions/{id}/close")
async def close_session(id: str) -> dict:
    session = await _load_session(id)

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


@router.post("/sessions/{id}/approve")
async def approve_session(id: str, decision: ApprovalDecision) -> dict:
    session = await _load_session(id)

    if not session.get("tmux_target"):
        raise HTTPException(
            status_code=400,
            detail="session not owned by Watchtower; approve in the terminal",
        )

    approval = await db.fetchrow(
        """SELECT id FROM approvals
            WHERE session_id = ? AND status = 'pending'
         ORDER BY created_at DESC
            LIMIT 1""",
        id,
    )
    if approval is None:
        raise HTTPException(status_code=404, detail="no pending approval for session")

    target = session["tmux_target"]
    # Read the current prompt before answering (surfaced for debugging / UI).
    prompt = await asyncio.to_thread(tmux.capture_pane, target)
    if decision.decision == "approve":
        await asyncio.to_thread(tmux.send_keys, target, "1", True)        # select "Yes" + Enter
    else:
        await asyncio.to_thread(tmux.send_keys, target, "Escape", False)  # Esc cancels → reject

    new_status = "approved" if decision.decision == "approve" else "denied"
    await db.execute(
        "UPDATE approvals SET status = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?",
        new_status, decision.decided_by, approval["id"],
    )
    await db.execute("UPDATE sessions SET state = 'active' WHERE id = ?", id)
    db.notify({"type": "approval", "session_id": id, "status": new_status})
    return {"ok": True, "status": new_status, "prompt": prompt[-500:]}


@router.post("/sessions/spawn")
async def spawn_session(req: SpawnRequest) -> dict:
    if not tmux.has_tmux():
        raise HTTPException(status_code=400, detail="tmux not available; cannot spawn")

    id = uuid.uuid4().hex
    cwd = req.cwd or os.getcwd()

    # Prefer the real `uvs <tool> <persona>` launcher; fall back to the bare tool.
    launch = f"uvs {req.tool} {req.persona}" if shutil.which("uvs") else req.tool
    cmd = f"UVS_SESSION_ID={id} {launch}"

    try:
        target = await asyncio.to_thread(tmux.spawn, id, cmd, cwd)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
