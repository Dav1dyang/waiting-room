// Optional relay. With no TURN_KEY_ID and TURN_API_TOKEN in the environment nothing here
// changes anything and every room stays on the STUN server the core already puts in the
// match message. With keys, one credential is minted per room and both halves of the pair
// get the same list, STUN first.
// The budget is an estimate, not a meter: a room is counted as 22.5 MB, which is thirty
// minutes at 100 kbps. Cloudflare bills relayed egress only, so this over-counts on
// purpose. Past RELAY_BUDGET_GB in a calendar month the lobby stops minting and falls
// back to STUN, which still works for most people.

const STUN = { urls: 'stun:stun.cloudflare.com:3478' };
const ROOM_MB = 22.5;
const MB_PER_GB = 1024;
const API = 'https://rtc.live.cloudflare.com/v1/turn/keys';

export function turnConfigured(env) {
  return !!(env.TURN_KEY_ID && env.TURN_API_TOKEN);
}

/**
 * Rewrite iceServers on every match frame in fx. One mint per room, both frames share it.
 * Any failure leaves the frames alone, which means STUN only.
 */
export async function addTurn(fx, env, ctx) {
  if (!turnConfigured(env)) return;
  const rooms = new Map();
  for (const f of fx) {
    if (f.type !== 'send' || !f.msg || f.msg.type !== 'match') continue;
    const list = rooms.get(f.msg.room) || [];
    list.push(f.msg);
    rooms.set(f.msg.room, list);
  }
  for (const msgs of rooms.values()) {
    const servers = await mint(env, ctx);
    if (!servers) continue;
    for (const msg of msgs) msg.iceServers = servers;
  }
}

/** One credential from the Realtime API, or null to stay on STUN. */
async function mint(env, ctx) {
  const key = budgetKey();
  const used = (await ctx.storage.get(key)) || 0;
  const budget = Number(env.RELAY_BUDGET_GB || 500);
  if ((used * ROOM_MB) / MB_PER_GB >= budget) return null;
  const ttl = Math.round(Number(env.ROOM_MAX || 1_800_000) / 1000);
  let body;
  try {
    const res = await fetch(`${API}/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.TURN_API_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ttl }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    body = await res.json();
  } catch {
    return null;
  }
  const got = body && body.iceServers;
  const list = Array.isArray(got) ? got : got ? [got] : [];
  if (list.length === 0) return null;
  await ctx.storage.put(key, used + 1);
  return [STUN, ...list];
}

function budgetKey() {
  return 'turn:' + new Date().toISOString().slice(0, 7);
}
