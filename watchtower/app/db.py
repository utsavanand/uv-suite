"""Database layer — embedded SQLite (no server, no Docker).

Data lives in a single file (default watchtower/watchtower.db, override with
WATCHTOWER_DB). The live WebSocket stream is fed by an in-process broadcaster, so
there is nothing external to run. Routers use one small async API: `fetch`,
`fetchrow`, `execute`, `insert` (with `?` placeholders) and the sync `notify(payload)`.
JSON columns are stored as TEXT; callers json.dumps on write and json.loads on read.
"""
import asyncio
import json
import os

import aiosqlite

SQLITE_PATH = os.environ.get(
    "WATCHTOWER_DB",
    os.path.join(os.path.dirname(__file__), "..", "watchtower.db"),
)

_db: aiosqlite.Connection | None = None
_write_lock = asyncio.Lock()


class Broadcaster:
    """Fan out payloads (JSON strings) to subscribed WebSocket clients (in-process)."""

    def __init__(self) -> None:
        self._subs: set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self._subs.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subs.discard(q)

    def publish(self, payload: str) -> None:
        for q in list(self._subs):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                pass  # slow consumer — drop rather than block ingest


broadcaster = Broadcaster()

_SCHEMA = [
    """CREATE TABLE IF NOT EXISTS sessions (
        id text PRIMARY KEY, name text, kind text, purpose text, priority text,
        persona text, cwd text, worktree text, branch text, pid integer,
        tmux_target text, state text DEFAULT 'active',
        started_at TEXT DEFAULT CURRENT_TIMESTAMP, ended_at text)""",
    """CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, session_id text, event_type text,
        tool_name text, command text, payload text,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP)""",
    """CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT, session_id text, tool_name text,
        command text, request text, status text DEFAULT 'pending', decided_by text,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, decided_at text)""",
    "CREATE INDEX IF NOT EXISTS idx_events_session_created ON events (session_id, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_approvals_session_status ON approvals (session_id, status)",
]


async def init_db() -> None:
    global _db
    _db = await aiosqlite.connect(SQLITE_PATH)
    _db.row_factory = aiosqlite.Row
    for stmt in _SCHEMA:
        await _db.execute(stmt)
    await _db.commit()


async def close() -> None:
    if _db:
        await _db.close()


async def fetch(sql: str, *args) -> list[dict]:
    cur = await _db.execute(sql, args)
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def fetchrow(sql: str, *args) -> dict | None:
    rows = await fetch(sql, *args)
    return rows[0] if rows else None


async def execute(sql: str, *args) -> None:
    async with _write_lock:
        await _db.execute(sql, args)
        await _db.commit()


async def insert(sql: str, *args) -> int:
    """Run an INSERT and return the new row id."""
    async with _write_lock:
        cur = await _db.execute(sql, args)
        await _db.commit()
        return cur.lastrowid


def notify(payload: dict) -> None:
    """Push an update to connected dashboards (in-process)."""
    broadcaster.publish(json.dumps(payload, default=str))
