# Local development

Use Node 24 and pnpm. Local Cloudflare state is persisted in `.wrangler/state`; ordinary commands never connect to remote bindings.

```powershell
corepack enable
pnpm install
Copy-Item .dev.vars.example .dev.vars -Force
Copy-Item .env.local.example .env.local -Force
pnpm db:migrate:local
pnpm db:seed:local
pnpm ingest:local
pnpm dev
```

The Vite server listens at `http://127.0.0.1:5174`. API health is available at `/api/status`. Pressing `e` in a Wrangler development session opens Cloudflare Local Explorer when supported by the installed Wrangler version.

Remote work requires an explicit command and prepared resources. `pnpm dev` and all database commands shown above are local.
