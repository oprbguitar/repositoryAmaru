# Troubleshooting

## Worker or UI does not start

Confirm `node --version` is 24.x, run `pnpm install`, then `pnpm typecheck`. Port 5174 must be free.

## D1 reports a missing table

Run `pnpm db:migrate:local`. Verify local state with:

```powershell
pnpm wrangler d1 execute DB --local --persist-to .wrangler/state --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## Import finds no files

Open ignored `.env.local`, verify `LOCAL_RESEARCH_DIR`, and confirm supported files exist. The default directory contains only an instructional README until you add material.

## Import cannot reach the API

Close any unrelated process on port 5174 and rerun `pnpm ingest:local`. The script starts and stops a temporary Vite/Worker process when the app is not already running.

## A document has a warning

Open its detail panel. The warning includes the safe parser reason. The original remains unchanged and other documents continue importing.

## External modules are empty

This is expected until a supported source and any required credential are configured. AMARU intentionally does not enable demo production data.
