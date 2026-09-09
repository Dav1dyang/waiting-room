// The front door. Every route that touches lobby state is forwarded to one Durable Object,
// the instance named "lobby", so there is exactly one queue in the world.
// The request origin rides along in x-wr-origin because the core builds room and setup URLs
// from it and a Durable Object does not know what hostname the browser used.
// Static files come from the ASSETS binding; /room and /setup pass through this Worker so
// they get the microphone and nosniff headers.

export { LobbyObject } from './lobby-do.js';

const POST_ROUTES = new Set(['/api/register', '/api/hook', '/api/off', '/api/rehearse']);
const GET_ROUTES = new Set(['/api/count', '/api/probes', '/api/health']);
const MAX_BODY = 4096;
const HTML_HEADERS = {
  'permissions-policy': 'microphone=(self), camera=(self)',
  'x-content-type-options': 'nosniff',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === '/ws') {
      if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') {
        return json({ error: 'upgrade' }, 426);
      }
      return toLobby(request, env, url);
    }

    if (POST_ROUTES.has(p)) {
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      const read = await readJson(request);
      if (read.error) return json({ error: read.error }, 400);
      return toLobby(request, env, url, read.raw);
    }

    if (GET_ROUTES.has(p)) {
      if (request.method !== 'GET') return json({ error: 'method' }, 405);
      return toLobby(request, env, url);
    }

    if (p === '/room') return page(request, env, url, '/room.html');
    if (p === '/setup') return page(request, env, url, '/setup.html');
    if (p === '/') {
      return new Response('waiting-room\n', {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
    return env.ASSETS.fetch(request);
  },
};

/** Send a request on to the one lobby object, with the browser's origin attached. */
function toLobby(request, env, url, raw) {
  const headers = new Headers(request.headers);
  headers.set('x-wr-origin', url.origin);
  headers.set('x-wr-ip', request.headers.get('cf-connecting-ip') || '');
  // A GET keeps the original request so the WebSocket upgrade survives the copy.
  // A POST is rebuilt because its body has already been read for the size check.
  const req = raw === undefined
    ? new Request(request, { headers })
    : new Request(url, { method: 'POST', headers, body: raw });
  const stub = env.LOBBY.get(env.LOBBY.idFromName('lobby'));
  return stub.fetch(req);
}

/** Read a small JSON object, or say why not. */
async function readJson(request) {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_BODY) return { error: 'big' };
  const raw = await readBounded(request, MAX_BODY);
  if (raw === null) return { error: 'big' };
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return { error: 'json' };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'json' };
  return { raw: raw || '{}' };
}

/** Read at most `max` bytes of the body; past that, cancel the stream and say so with null. */
async function readBounded(request, max) {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      try {
        await reader.cancel();
      } catch {
        // the stream is gone either way
      }
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** Serve one file from public/ under a friendlier path, with the two HTML headers. */
async function page(request, env, url, file) {
  const target = new URL(url);
  target.pathname = file;
  target.search = '';
  const res = await env.ASSETS.fetch(new Request(target, { method: 'GET', headers: request.headers }));
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(HTML_HEADERS)) out.headers.set(k, v);
  return out;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
