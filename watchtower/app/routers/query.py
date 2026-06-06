"""Query router: read-only endpoints the dashboard polls/loads."""
import os

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app import db

router = APIRouter()


@router.get("/sessions")
async def list_sessions(con: asyncpg.Connection = Depends(db.db)) -> list[dict]:
    rows = await con.fetch(
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
    return [dict(r) for r in rows]


@router.get("/sessions/{id}")
async def get_session(id: str, con: asyncpg.Connection = Depends(db.db)) -> dict:
    row = await con.fetchrow("SELECT * FROM sessions WHERE id = $1", id)
    if row is None:
        raise HTTPException(status_code=404, detail="session not found")
    return dict(row)


@router.get("/sessions/{id}/events")
async def get_session_events(
    id: str, limit: int = 100, con: asyncpg.Connection = Depends(db.db)
) -> list[dict]:
    rows = await con.fetch(
        """SELECT * FROM events
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2""",
        id, limit,
    )
    return [dict(r) for r in rows]


@router.get("/sessions/{id}/artifacts")
async def get_session_artifacts(
    id: str, con: asyncpg.Connection = Depends(db.db)
) -> list[dict]:
    row = await con.fetchrow("SELECT cwd FROM sessions WHERE id = $1", id)
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
async def list_approvals(
    status: str = "pending", con: asyncpg.Connection = Depends(db.db)
) -> list[dict]:
    rows = await con.fetch(
        "SELECT * FROM approvals WHERE status = $1 ORDER BY created_at DESC", status
    )
    return [dict(r) for r in rows]
