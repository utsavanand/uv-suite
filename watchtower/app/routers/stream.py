"""Stream router: a single WebSocket the dashboard connects to for live updates.
Updates land on the in-process broadcaster (see app/db.py) and fan out here."""
import asyncio
import contextlib
import json
from urllib.parse import urlparse

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app import db

router = APIRouter()

_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


@router.websocket("/live")
async def live(ws: WebSocket) -> None:
    # Reject cross-origin WebSocket connections (the stream carries prompts/commands).
    origin = ws.headers.get("origin")
    if origin and urlparse(origin).hostname not in _LOCAL_HOSTS:
        await ws.close(code=1008)
        return

    await ws.accept()

    sessions = await db.fetch("SELECT * FROM sessions ORDER BY started_at DESC")
    await ws.send_text(json.dumps({"type": "snapshot", "sessions": sessions}, default=str))

    q = db.broadcaster.subscribe()
    # Race each broadcast against a pending receive so a client that disconnects while
    # idle (no events flowing) is noticed immediately, not on the next publish.
    recv = asyncio.create_task(ws.receive())
    try:
        while True:
            get = asyncio.create_task(q.get())
            done, _ = await asyncio.wait({get, recv}, return_when=asyncio.FIRST_COMPLETED)
            if recv in done:
                get.cancel()
                break  # client sent a message or disconnected
            await ws.send_text(get.result())
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        recv.cancel()
        with contextlib.suppress(Exception):
            await recv
        db.broadcaster.unsubscribe(q)
