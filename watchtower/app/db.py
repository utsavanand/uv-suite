"""Async Postgres layer + a NOTIFY → WebSocket broadcaster.

A hook insert calls `notify()` which `pg_notify`s on CHANNEL; a dedicated listener
connection forwards each payload to the Broadcaster, which fans it out to connected
WebSocket subscribers. No polling.
"""
import asyncio
import json
import os

import asyncpg

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://watchtower:watchtower@localhost:5432/watchtower"
)
CHANNEL = "watchtower_events"
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "schema.sql")

pool: asyncpg.Pool | None = None


class Broadcaster:
    """Fan out NOTIFY payloads (JSON strings) to subscribed WebSocket clients."""

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


async def init_pool() -> None:
    global pool
    async def _init(con):
        await con.set_type_codec(
            "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
        )

    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10, init=_init)
    with open(SCHEMA_PATH) as f:
        schema = f.read()
    async with pool.acquire() as con:
        await con.execute(schema)


async def listen_notify() -> None:
    """Dedicated connection LISTENing on CHANNEL; forwards payloads to the broadcaster."""
    con = await asyncpg.connect(DATABASE_URL)
    await con.add_listener(CHANNEL, lambda *args: broadcaster.publish(args[-1]))
    try:
        while True:
            await asyncio.sleep(3600)
    finally:
        await con.close()


async def close_pool() -> None:
    if pool:
        await pool.close()


async def db() -> asyncpg.Connection:
    """FastAPI dependency: yields a pooled connection."""
    async with pool.acquire() as con:
        yield con


async def notify(con: asyncpg.Connection, payload: dict) -> None:
    """Emit a NOTIFY so the stream router pushes this to dashboards."""
    await con.execute("SELECT pg_notify($1, $2)", CHANNEL, json.dumps(payload, default=str))
