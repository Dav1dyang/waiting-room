// A lobby you can run on your laptop: the pure core behind plain HTTP and WebSocket.
// For developing the window and the plugin without Cloudflare. Same routes as the Worker.
//   node scripts/mock-lobby.js            (port 8788; env PORT, INVITES=code1,code2, T=15000 ...)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Lobby } from '../src/lobby-core.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, '..', 'public');
const PORT = Number(process.env.PORT || 8788);
const cfg = {};
for (const k of ['T', 'F', 'N', 'G', 'P', 'Q', 'ROOM_MAX', 'PEER_COOLDOWN', 'OPEN_RETRY', 'COUNTDOWN']) if (process.env[k]) cfg[k] = Number(process.env[k]);
cfg.invites = (process.env.INVITES || '').split(',').map((s) => s.trim()).filter(Boolean);
const lobby = new Lobby(cfg);
const sockets = new Map(); // token -> ws

function runEffects(fx, res) {
  let reply = null;
  for (const f of fx) {
    if (f.type === 'reply') reply = f.body;
    else if (f.type === 'send') sockets.get(f.token)?.send(JSON.stringify(f.msg));
    else if (f.type === 'close') { const w = sockets.get(f.token); sockets.delete(f.token); w?.close(1000, 'bye'); }
  }
  if (res) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(reply ?? {})); }
  return fx;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serveStatic(pathname, res) {
  let file = pathname === '/room' ? '/room.html' : pathname === '/setup' ? '/setup.html' : pathname;
  const full = path.join(PUBLIC, path.normalize(file));
  if (!full.startsWith(PUBLIC) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const origin = `http://127.0.0.1:${PORT}`;
  const now = Date.now();
  if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
    let body = '';
    for await (const c of req) body += c;
    let j = {};
    try { j = JSON.parse(body || '{}'); } catch { res.writeHead(400); return res.end('{}'); }
    const kind = { '/api/register': 'register', '/api/hook': 'hook', '/api/off': 'off', '/api/rehearse': 'rehearse' }[url.pathname];
    if (!kind) { res.writeHead(404); return res.end('{}'); }
    return runEffects(lobby.apply({ kind, ...j, now, origin }), res);
  }
  if (req.method === 'GET' && url.pathname === '/api/count') return runEffects(lobby.apply({ kind: 'count', token: url.searchParams.get('t'), now }), res);
  if (req.method === 'GET' && url.pathname === '/api/probes') return runEffects(lobby.apply({ kind: 'probes', token: url.searchParams.get('t'), now }), res);
  if (req.method === 'GET' && url.pathname === '/api/state') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(lobby.s)); }
  if (req.method === 'GET') return serveStatic(url.pathname, res);
  res.writeHead(405); res.end();
});

const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== '/ws') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    const fx = lobby.apply({ kind: 'ws_open', ticket: url.searchParams.get('t'), now: Date.now() });
    const attach = fx.find((f) => f.type === 'attach');
    if (!attach?.ok) { ws.close(4001, 'bad ticket'); return; }
    const { token, rehearsal, conn } = attach;
    if (!rehearsal) sockets.set(token, ws); else sockets.set(token + '#r', ws);
    const key = rehearsal ? token + '#r' : token;
    // deliver this open's own effects (hello and friends) now that the socket is registered
    for (const f of fx) if (f.type === 'send' && f.token === token) ws.send(JSON.stringify(f.msg));
    ws.on('message', (data) => {
      let msg; try { msg = JSON.parse(String(data)); } catch { return; }
      if (rehearsal) return;
      runEffects(lobby.apply({ kind: 'ws_msg', token, conn, msg, now: Date.now() }));
    });
    ws.on('close', () => {
      if (sockets.get(key) === ws) sockets.delete(key);
      runEffects(lobby.apply({ kind: 'ws_close', token, conn, rehearsal, now: Date.now() }));
    });
  });
});

setInterval(() => runEffects(lobby.apply({ kind: 'tick', now: Date.now() })), 1000).unref();
server.listen(PORT, '127.0.0.1', () => console.log(`mock lobby on http://127.0.0.1:${PORT}  invites=${cfg.invites.join(',') || '(open)'}`));
