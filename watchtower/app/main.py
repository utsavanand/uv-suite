"""Watchtower service entrypoint. Wires the routers built independently in app/routers/."""
import os
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import db
from app.routers import control, ingest, query, settings, stream

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

# The control API can spawn processes, send keystrokes, and kill PIDs. Binding to
# 127.0.0.1 stops the network, but a browser on the same machine can still issue
# cross-origin requests to it. Reject any state-changing request whose Origin is not
# the dashboard's own host. Requests with no Origin header (curl from hooks, the
# launcher) and reads (GET/HEAD) pass through.
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    try:
        yield
    finally:
        await db.close()


app = FastAPI(title="Watchtower", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def block_cross_origin(request: Request, call_next):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin")
        if origin and urlparse(origin).hostname not in _LOCAL_HOSTS:
            return JSONResponse({"detail": "cross-origin request blocked"}, status_code=403)
    return await call_next(request)


app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(stream.router)
app.include_router(control.router)
app.include_router(settings.router)


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def dashboard() -> FileResponse:
    return FileResponse(os.path.join(STATIC_DIR, "dashboard.html"))


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
