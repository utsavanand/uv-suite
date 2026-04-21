#!/usr/bin/env node

// UV Suite Watchtower — lightweight observability server
// Zero dependencies beyond Node.js (uses built-in http, fs, ws via raw upgrade)

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.UVS_WATCHTOWER_PORT || 4200;
const DATA_FILE = path.join(__dirname, 'events.json');
const MAX_EVENTS = 500;

// In-memory event store
let events = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    events = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
} catch (e) {
  events = [];
}

// WebSocket clients
const clients = new Set();

function broadcast(event) {
  const msg = JSON.stringify(event);
  for (const ws of clients) {
    try { ws.send(msg); } catch (e) { clients.delete(ws); }
  }
}

function saveEvents() {
  // Keep only the last MAX_EVENTS
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
}

// Minimal WebSocket handshake (no dependency needed)
const crypto = require('crypto');

function upgradeToWebSocket(req, socket) {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-5AB5DC085B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n` +
    '\r\n'
  );

  const ws = {
    send(data) {
      const buf = Buffer.from(data);
      const frame = [];
      frame.push(0x81); // text frame
      if (buf.length < 126) {
        frame.push(buf.length);
      } else if (buf.length < 65536) {
        frame.push(126, (buf.length >> 8) & 0xff, buf.length & 0xff);
      } else {
        frame.push(127);
        for (let i = 7; i >= 0; i--) frame.push((buf.length >> (i * 8)) & 0xff);
      }
      socket.write(Buffer.concat([Buffer.from(frame), buf]));
    }
  };

  clients.add(ws);
  socket.on('close', () => clients.delete(ws));
  socket.on('error', () => clients.delete(ws));

  // Send recent events on connect
  ws.send(JSON.stringify({ type: 'init', events: events.slice(-100) }));
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // POST /events — receive hook events
  if (req.method === 'POST' && req.url === '/events') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        event._ts = Date.now();
        event._id = crypto.randomUUID();
        events.push(event);
        broadcast(event);
        saveEvents();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400);
        res.end('{"error":"invalid json"}');
      }
    });
    return;
  }

  // GET /events — fetch recent events
  if (req.method === 'GET' && req.url.startsWith('/events')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(events.slice(-100)));
    return;
  }

  // GET / — serve dashboard
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    upgradeToWebSocket(req, socket);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`UV Suite Watchtower running at http://localhost:${PORT}`);
  console.log(`${events.length} events loaded from disk`);
  console.log(`Waiting for hook events on POST http://localhost:${PORT}/events`);
});
