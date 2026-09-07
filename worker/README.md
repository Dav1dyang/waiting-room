# waiting-room lobby

One Worker and one Durable Object. `src/index.js` routes; `src/lobby-do.js` holds the queue,
the rooms and the window sockets and wraps the pure state machine in `src/lobby-core.js`,
which decides everything. `public/` is served through the ASSETS binding. `src/turn.js` is
optional relay credentials.

    npm test        the core, plus one whole wait through a real `wrangler dev`
    npm run dev     a local lobby on http://127.0.0.1:8787
    npm run mock    the same routes without Cloudflare, for page and plugin work

Every number lives in `wrangler.jsonc` under `vars`, in milliseconds, and matches
docs/PROTOCOL.md section 2. Nothing there is private. Secrets never go in that file:

    npx wrangler secret put INVITES         # DUCK,HERON. Unset or empty means anyone may register (the public lobby is open).
    npx wrangler secret put TURN_KEY_ID     # optional, Cloudflare Realtime TURN
    npx wrangler secret put TURN_API_TOKEN  # optional, both or neither

Locally those three go in `.dev.vars`; copy `.dev.vars.example`. Then:

    npx wrangler deploy

The first deploy runs the `new_sqlite_classes` migration and claims the workers.dev name.
A window with a bad ticket is upgraded and closed with code 4001, as in `scripts/mock-lobby.js`.
NOTES.md has the decisions and what is not verified yet.
