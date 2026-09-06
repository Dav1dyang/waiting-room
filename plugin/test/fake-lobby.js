'use strict';
// A lobby that does nothing but remember what it was asked and answer what you told it to.
// The real one lives in worker/; this one exists so the plugin tests never need the network.
//
//   const lobby = await startLobby();
//   lobby.reply.hook = { open: lobby.url + '/room?t=abc' };
//   ... run signal.sh with WAITING_ROOM_URL=lobby.url ...
//   lobby.requests[0].json   // exactly what left the machine
//   await lobby.close();

const http = require('node:http');

function startLobby() {
  return new Promise((resolve) => {
    const lobby = {
      requests: [],
      // Canned replies, by route. Change them between runs.
      reply: {
        hook: {},
        register: { ok: true, count: 0, setup: '' },
        off: { ok: true },
        count: { count: 0, enabled: true },
      },
      // Accept the request and never answer it, so the caller's own timeout decides.
      hang: false,
      // A literal string to send instead of JSON, for testing a lobby that talks nonsense.
      rawReply: null,
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      let raw = '';
      req.setEncoding('utf8');
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch (e) { json = null; }
        lobby.requests.push({ method: req.method, path: url.pathname, query: url.searchParams, raw, json });

        if (lobby.hang) return; // never answer, never close

        if (lobby.rawReply !== null) {
          res.writeHead(200, { 'content-type': 'application/json' });
          return res.end(lobby.rawReply);
        }

        const key = {
          '/api/hook': 'hook',
          '/api/register': 'register',
          '/api/off': 'off',
          '/api/count': 'count',
        }[url.pathname];
        if (!key) { res.writeHead(404); return res.end('{}'); }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(lobby.reply[key]));
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      lobby.port = port;
      lobby.url = `http://127.0.0.1:${port}`;
      lobby.close = () => new Promise((done) => {
        server.closeAllConnections();
        server.close(() => done());
      });
      resolve(lobby);
    });
  });
}

module.exports = { startLobby };
