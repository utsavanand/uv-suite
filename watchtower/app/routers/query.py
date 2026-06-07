"""Query router: read-only endpoints the dashboard loads."""
import json
import os
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app import db


def _decode(rows: list[dict], col: str) -> list[dict]:
    """JSON columns are stored as TEXT; decode them back to objects for the API."""
    for r in rows:
        if isinstance(r.get(col), str):
            try:
                r[col] = json.loads(r[col])
            except (ValueError, TypeError):
                pass
    return rows


router = APIRouter()


@router.get("/sessions")
async def list_sessions() -> list[dict]:
    return await db.fetch(
        """SELECT s.*,
                  (SELECT count(*) FROM events e
                     WHERE e.session_id = s.id AND e.tool_name IS NOT NULL) AS tool_calls,
                  (SELECT max(e.created_at) FROM events e
                     WHERE e.session_id = s.id) AS last_event_at
             FROM sessions s
            ORDER BY COALESCE(
              (SELECT max(e.created_at) FROM events e WHERE e.session_id = s.id),
              s.started_at) DESC"""
    )


@router.get("/sessions/{id}")
async def get_session(id: str) -> dict:
    row = await db.fetchrow("SELECT * FROM sessions WHERE id = ?", id)
    if row is None:
        raise HTTPException(status_code=404, detail="session not found")
    return row


@router.get("/events")
async def list_events(limit: int = 60) -> list[dict]:
    """Recent events across all sessions, oldest-first — backfill for the heartbeat."""
    rows = await db.fetch(
        "SELECT id, session_id, event_type, tool_name, command, created_at "
        "FROM events ORDER BY id DESC LIMIT ?",
        limit,
    )
    rows.reverse()
    return rows


@router.get("/sessions/{id}/events")
async def get_session_events(id: str, limit: int = 100) -> list[dict]:
    rows = await db.fetch(
        "SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
        id, limit,
    )
    return _decode(rows, "payload")


@router.get("/sessions/{id}/artifacts")
async def get_session_artifacts(id: str) -> list[dict]:
    row = await db.fetchrow("SELECT cwd FROM sessions WHERE id = ?", id)
    if row is None:
        raise HTTPException(status_code=404, detail="session not found")

    cwd = row["cwd"]
    if not cwd:
        return []

    base = os.path.join(cwd, "uv-out", "sessions", id)
    if not os.path.isdir(base):
        return []

    artifacts = []
    for dirpath, _dirnames, filenames in os.walk(base):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            artifacts.append({
                "path": os.path.relpath(full, base),
                "size": os.path.getsize(full),
            })
    return artifacts


@router.get("/approvals")
async def list_approvals(status: str = "pending") -> list[dict]:
    rows = await db.fetch(
        "SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC", status
    )
    return _decode(rows, "request")


async def _checkpoints_dir(id: str) -> str:
    row = await db.fetchrow("SELECT cwd FROM sessions WHERE id = ?", id)
    if row is None:
        raise HTTPException(status_code=404, detail="session not found")
    return os.path.join(row["cwd"] or "", "uv-out", "sessions", id, "checkpoints")


@router.get("/sessions/{id}/checkpoints")
async def list_checkpoints(id: str) -> list[dict]:
    d = await _checkpoints_dir(id)
    if not os.path.isdir(d):
        return []
    out = [
        {"name": fn, "size": os.path.getsize(os.path.join(d, fn)),
         "modified": os.path.getmtime(os.path.join(d, fn))}
        for fn in os.listdir(d)
        if os.path.isfile(os.path.join(d, fn))
    ]
    out.sort(key=lambda c: c["modified"], reverse=True)
    return out


@router.get("/sessions/{id}/checkpoints/{name}", response_class=PlainTextResponse)
async def read_checkpoint(id: str, name: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9._-]+", name) or ".." in name:
        raise HTTPException(status_code=400, detail="invalid checkpoint name")
    full = os.path.join(await _checkpoints_dir(id), name)
    if not os.path.isfile(full):
        raise HTTPException(status_code=404, detail="checkpoint not found")
    with open(full) as f:
        return f.read()
