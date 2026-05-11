#!/usr/bin/env node

// UV Suite Watchtower — lightweight observability server
// Zero dependencies beyond Node.js
// Uses Server-Sent Events (SSE) instead of WebSocket — simpler, auto-reconnects

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const autoCheckpointRunner = require("./auto-checkpoint-runner");
const snapshotManager = require("./snapshot-manager");

const PORT = process.env.UVS_WATCHTOWER_PORT || 4200;
const DATA_FILE = path.join(__dirname, "events.json");
const MAX_EVENTS = 500;

// In-memory event store
let events = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    events = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
} catch (e) {
  events = [];
}

// SSE clients
const sseClients = new Set();

function broadcast(event) {
  const data = JSON.stringify(event);
  for (const res of sseClients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

function saveEvents() {
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
  } catch (e) {
    // ignore write errors
  }
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  // POST /events — receive hook events
  if (req.method === "POST" && req.url === "/events") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const event = JSON.parse(body);
        event._ts = Date.now();
        event._id = crypto.randomUUID();
        events.push(event);
        broadcast(event);
        saveEvents();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400);
        res.end('{"error":"invalid json"}');
      }
    });
    return;
  }

  // GET /stream — SSE endpoint (replaces WebSocket)
  if (req.method === "GET" && req.url === "/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send recent events as init
    res.write(
      `data: ${JSON.stringify({ type: "init", events: events.slice(-100) })}\n\n`,
    );

    sseClients.add(res);

    // Keep-alive ping every 15 seconds
    const keepAlive = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch (e) {
        clearInterval(keepAlive);
      }
    }, 15000);

    req.on("close", () => {
      sseClients.delete(res);
      clearInterval(keepAlive);
    });
    return;
  }

  // GET /events — fetch recent events (REST fallback)
  if (req.method === "GET" && req.url.startsWith("/events")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(events.slice(-100)));
    return;
  }

  // POST /snapshots — take a snapshot of every active session
  if (req.method === "POST" && req.url === "/snapshots") {
    (async () => {
      try {
        const manifest = await snapshotManager.takeSnapshot({
          runner: autoCheckpointRunner,
          getEvents: () => events,
          broadcast: (ev) => {
            ev._ts = ev._ts || Date.now();
            ev._id = crypto.randomUUID();
            events.push(ev);
            broadcast(ev);
            saveEvents();
          },
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(manifest));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    })();
    return;
  }

  // GET /snapshots — list bundles
  if (req.method === "GET" && req.url === "/snapshots") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(snapshotManager.listSnapshots()));
    return;
  }

  // GET /snapshots/<id> — get manifest
  const snapshotMatch = req.url.match(/^\/snapshots\/([^/]+)$/);
  if (req.method === "GET" && snapshotMatch) {
    const m = snapshotManager.getSnapshot(snapshotMatch[1]);
    if (!m) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(m));
  }

  // POST /snapshots/<id>/sessions/<sid>/restore — open a new terminal tab
  // that restores the given session.
  const restoreMatch = req.url.match(
    /^\/snapshots\/([^/]+)\/sessions\/([^/]+)\/restore$/,
  );
  if (req.method === "POST" && restoreMatch) {
    const [, snapId, sid] = restoreMatch;
    const m = snapshotManager.getSnapshot(snapId);
    const session = m?.sessions?.find((s) => s.uvs_session_id === sid);
    if (!session) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: "session not in snapshot" }));
    }
    const result = snapshotManager.openTerminalForSession(session);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result));
  }

  // GET / — serve dashboard
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const html = fs.readFileSync(
      path.join(__dirname, "dashboard.html"),
      "utf-8",
    );
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.on("error", (err) => {
  if (err.code !== "EADDRINUSE") {
    console.error("Watchtower server error:", err.message);
    process.exit(1);
  }
  // Port busy — probe to see if it's an existing watchtower or another process
  const req = http.request(
    { host: "127.0.0.1", port: PORT, path: "/", method: "GET", timeout: 1500 },
    (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (/UV Suite Watchtower/.test(body)) {
          console.log(
            `UV Suite Watchtower is already running at http://localhost:${PORT}`,
          );
          process.exit(0);
        } else {
          console.error(`Port ${PORT} is in use by another process.`);
          console.error(`Set UVS_WATCHTOWER_PORT to use a different port.`);
          process.exit(1);
        }
      });
    },
  );
  req.on("error", () => {
    console.error(`Port ${PORT} is in use but not responding.`);
    console.error(`Set UVS_WATCHTOWER_PORT to use a different port.`);
    process.exit(1);
  });
  req.on("timeout", () => {
    req.destroy();
  });
  req.end();
});

server.listen(PORT, () => {
  console.log(`UV Suite Watchtower running at http://localhost:${PORT}`);
  console.log(`${events.length} events loaded from disk`);
  console.log(
    `Waiting for hook events on POST http://localhost:${PORT}/events`,
  );

  // Tier B auto-checkpoint runner. Polls every minute, calls
  // `claude -p --bare --model haiku` for each active session whose
  // configured interval has elapsed. Disable with `/auto-checkpoint off`
  // per project, or set UVS_AUTO_CHECKPOINT_DISABLED=1 to disable globally.
  if (!process.env.UVS_AUTO_CHECKPOINT_DISABLED) {
    autoCheckpointRunner.start({
      getEvents: () => events,
      broadcast: (ev) => {
        ev._ts = ev._ts || Date.now();
        ev._id = crypto.randomUUID();
        events.push(ev);
        broadcast(ev);
        saveEvents();
      },
    });
    console.log(
      "Auto-checkpoint runner started (Tier B, polls every 60s, uses claude -p)",
    );
  }
});
