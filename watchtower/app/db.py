"""Database layer — SQLite by default (zero setup), Postgres opt-in.

Pick the backend with DATABASE_URL:
  (unset) or sqlite             → SQLite file (no server, no Docker) — the default.
  postgres://… / postgresql://… → Postgres (for teams / multi-host).

The app is a single process, so the live WebSocket stream is fed by an in-process
broadcaster — no Postgres LISTEN/NOTIFY needed, which is what let us drop the server
requirement. Routers use one small async API: `fetch`, `fetchrow`, `execute`, `insert`
(all with `?` placeholders, portable to both backends) and the sync `notify(payload)`.
JSON columns are stored as TEXT in both backends; callers json.dumps on write and
json.loads on read.
"""
import asyncio
import json
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
IS_PG = DATABASE_URL.startswith(("postgres://", "postgresql://"))

if IS_PG:
    import asyncpg
else:
    import aiosqlite

    SQLITE_PATH = os.environ.get(
        "WATCHTOWER_DB",
        os.path.join(os.path.dirname(__file__), "..", "watchtower.db"),
    )

_pg_pool = None
_sqlite = None
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


def _schema() -> list[str]:
    pk = "bigserial PRIMARY KEY" if IS_PG else "INTEGER PRIMARY KEY AUTOINCREMENT"
    ts = "timestamptz DEFAULT now()" if IS_PG else "TEXT DEFAULT CURRENT_TIMESTAMP"
    return [
        f"""CREATE TABLE IF NOT EXISTS sessions (
            id text PRIMARY KEY, name text, kind text, purpose text, priority text,
            persona text, cwd text, worktree text, branch text, pid integer,
            tmux_target text, state text DEFAULT 'active',
            started_at {ts}, ended_at text)""",
        f"""CREATE TABLE IF NOT EXISTS events (
            id {pk}, session_id text, event_type text, tool_name text, command text,
            payload text, created_at {ts})""",
        f"""CREATE TABLE IF NOT EXISTS approvals (
            id {pk}, session_id text, tool_name text, command text, request text,
            status text DEFAULT 'pending', decided_by text, created_at {ts}, decided_at text)""",
        "CREATE INDEX IF NOT EXISTS idx_events_session_created ON events (session_id, created_at)",
        "CREATE INDEX IF NOT EXISTS idx_approvals_session_status ON approvals (session_id, status)",
    ]


async def init_db() -> None:
    global _pg_pool, _sqlite
    if IS_PG:
        _pg_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        async with _pg_pool.acquire() as con:
            for stmt in _schema():
                await con.execute(stmt)
    else:
        _sqlite = await aiosqlite.connect(SQLITE_PATH)
        _sqlite.row_factory = aiosqlite.Row
        for stmt in _schema():
            await _sqlite.execute(stmt)
        await _sqlite.commit()


async def close() -> None:
    if _pg_pool:
        await _pg_pool.close()
    if _sqlite:
        await _sqlite.close()


def _pg_sql(sql: str) -> str:
    """Translate `?` placeholders to `$1, $2, …` for asyncpg."""
    out, i = [], 0
    for ch in sql:
        if ch == "?":
            i += 1
            out.append(f"${i}")
        else:
            out.append(ch)
    return "".join(out)


async def fetch(sql: str, *args) -> list[dict]:
    if IS_PG:
        async with _pg_pool.acquire() as con:
            rows = await con.fetch(_pg_sql(sql), *args)
        return [dict(r) for r in rows]
    cur = await _sqlite.execute(sql, args)
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def fetchrow(sql: str, *args) -> dict | None:
    rows = await fetch(sql, *args)
    return rows[0] if rows else None


async def execute(sql: str, *args) -> None:
    if IS_PG:
        async with _pg_pool.acquire() as con:
            await con.execute(_pg_sql(sql), *args)
    else:
        async with _write_lock:
            await _sqlite.execute(sql, args)
            await _sqlite.commit()


async def insert(sql: str, *args) -> int:
    """Run an INSERT and return the new integer id (RETURNING id / lastrowid).
    Pass the INSERT without a RETURNING clause; this adds it for Postgres."""
    if IS_PG:
        async with _pg_pool.acquire() as con:
            return await con.fetchval(_pg_sql(sql) + " RETURNING id", *args)
    async with _write_lock:
        cur = await _sqlite.execute(sql, args)
        await _sqlite.commit()
        return cur.lastrowid


def notify(payload: dict) -> None:
    """Push an update to connected dashboards (in-process; works for both backends)."""
    broadcaster.publish(json.dumps(payload, default=str))


def backend() -> str:
    return "postgres" if IS_PG else "sqlite"
