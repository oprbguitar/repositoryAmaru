# Architecture

## Current milestone

AMARU is a React 19 SPA built by Vite 8 with the official Cloudflare Vite plugin. The Worker handles same-origin `/api/*` routes and static assets are handled by the generated Cloudflare asset environment. React Router restores route and filter state; TanStack Query owns server state.

Local infrastructure uses D1 for normalized metadata and extracted text, R2 for optional raw copies, and KV for short-lived status/cache markers. Queue and cron bindings are configured for later source adapters but do not fabricate work when no source is configured.

## Trust boundaries

1. A Node-only script receives the local directory path.
2. It canonicalizes paths, rejects traversal/symlinks, checks size and extension, parses without execution, hashes the original bytes, and creates a stable DTO.
3. The Worker authenticates the internal batch endpoint and validates the full DTO with Zod.
4. D1 stores normalized browser-safe records. Raw bytes enter R2 only when `LOCAL_STORE_RAW_FILES=true`.
5. The browser receives a stable API envelope, relative paths, safe text, and explicit status fields.

## Package boundaries

- `src/`: UI, app shell, routes, and feature components.
- `worker/`: Worker entry point, API routing, persistence, scheduler, and queue consumer.
- `lib/`: shared validation, normalization, and security utilities.
- `scripts/`: Node-only filesystem ingestion and administrative utilities.
- `migrations/`: ordered D1 SQL migrations.
- `tests/`: unit, UI, and Playwright smoke tests.

Later source adapters belong under `worker/adapters/`; they must isolate failure, preserve provenance, cache batches, and never return raw provider payloads.
