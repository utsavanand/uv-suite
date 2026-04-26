#!/usr/bin/env node

// UV Suite Watchtower — lightweight observability server
// Zero dependencies beyond Node.js
// Uses Server-Sent Events (SSE) instead of WebSocket — simpler, auto-reconnects

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
});
