# AMARU AI Observatory verification report

Verification date: 2026-07-19  
Workspace: local Windows checkout  
Deployment performed: no

## Executive conclusion

AMARU works locally as a Cloudflare-native React/Worker application. Its database migrations, local ingestion, API health, unit/component tests, browser journeys, TypeScript checks, and production build were exercised successfully.

It is not ready for a safe Internet deployment yet. The current `production` Wrangler environment lacks non-inherited D1, KV, Queue, R2, and AI bindings; the top-level remote IDs are placeholders; one lint error remains; and the application has no user authentication. These are release blockers, not evidence that the local application is broken.

Recommended status: **local milestone verified; Internet deployment blocked pending configuration, access control, and a clean release gate**.

## How the application works

### Request and data flow

1. Vite builds a React 19 single-page application and the Cloudflare Worker.
2. Static routes are served by the Cloudflare asset binding with SPA fallback.
3. Same-origin `/api/*` requests run through `worker/index.ts`.
4. D1 stores normalized documents, providers, external records, source health, market data, maps, model data, videos, and laboratory projects.
5. KV stores short-lived status and dashboard/query caches.
6. A Queue carries source synchronization jobs from the initial status request, the 15-minute cron trigger, and manual synchronization.
7. R2 is used only when a validated import includes raw file content. Normal local configuration keeps raw storage disabled.
8. Public and credentialed providers are normalized before browser delivery. Missing credentials remain explicit `not_configured` states.

### Local research ingestion

The Node-only importer reads from `LOCAL_RESEARCH_DIR`, canonicalizes the root and candidate path, rejects traversal, absolute paths and symbolic links, blocks executable extensions, limits file size, parses supported formats without execution, hashes bytes, and submits a Zod-validated DTO to the Worker. The browser receives relative display paths rather than absolute filesystem paths.

Supported parsing includes text/Markdown, HTML, JSON/JSONL, CSV/TSV, YAML, XML/RSS/Atom, DOCX, XLSX, PDF, and image metadata. Unsupported or failed parsing is recorded as an explicit status rather than silently replaced.

### User workspaces observed in routing

- Hoy
- Proveedores
- Modelos
- Open y local
- Noticias
- Investigación
- GitHub
- Videos
- Mapa global
- Perú y LATAM
- Mercado IA
- Biblioteca local
- Mi laboratorio
- Administración de fuentes

The desktop shell uses a fixed viewport and confines scrolling to internal workspaces. A separate mobile navigation is present.

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Runtime | Pass | Node `v24.14.0`, pnpm `10.31.0` |
| Existing local migrations | Pass | No pending migration in `.wrangler/state` |
| Clean isolated migration | Pass | `0001` through `0004` applied successfully in `.wrangler/verification-state` |
| Local seed | Pass | Base settings prepared without fake records |
| Local import | Pass | 1 discovered file, 1 unchanged, 0 rejected, 0 warnings |
| TypeScript | Pass | `pnpm typecheck` exit 0 |
| Unit/component suite | Pass | 11 files, 52 tests passed |
| Browser suite | Pass | 3 applicable journeys passed; 3 intentional project-specific skips |
| Browser privacy assertion | Pass | Preview exposed no `C:\\` absolute path |
| Desktop shell assertion | Pass | Body overflow remained hidden |
| Mobile shell assertion | Pass | Mobile navigation and local-library heading visible |
| Production build | Pass with warning | Worker 406.95 kB; client JS 1,432.89 kB before gzip; large-chunk warning |
| Source health | Pass/explicit partial | D1, KV, and local object storage ready; 13 connected public/configured sources; 6 `not_configured`; 4 registered-only |
| Default Cloudflare dry run | Unsafe configuration | Exit 0 but used `APP_ENV=development` and placeholder remote identifiers |
| Production Cloudflare dry run | Blocked | `APP_ENV=production`, but D1/KV/Queue/R2/AI bindings were absent because named environments do not inherit them |
| Worker startup analysis | Pass | Worker built and startup analysis completed; command is alpha |
| Lint | Fail | One source-format error in `lib/external/normalizers.ts` around line 678; after E2E, Biome also reported the ignored generated `test-results/.last-run.json` because it lacks a final newline |

## Source health snapshot

Connected with HTTP 200 at verification time:

- OpenAlex Institutions
- BCRPData
- Frankfurter exchange rates
- SEC EDGAR
- SEC XBRL Company Facts
- Hugging Face Hub
- OpenRouter
- OpenAI News
- GitHub REST
- Crossref
- OpenAlex
- arXiv
- YouTube Data API

Explicitly `not_configured` because a credential is absent:

- Google Gemini Models API
- Groq Models API
- Mistral Models API
- OpenAI Models API
- X API v2
- Meta Graph API

Registered without an active synchronization adapter:

- ALICIA – CONCYTEC
- LA Referencia
- RENATI
- SciELO

This snapshot proves observable local state at the verification time. It does not guarantee future provider availability or quota.

## Security review

### Controls verified

- Real `.dev.vars` and `.env.local` files are ignored by Git.
- Generated `dist/`, `.wrangler/`, test results, and local research content are ignored.
- Import authorization compares a bearer token through SHA-256 digests.
- Local import DTOs are validated with Zod.
- Filesystem paths are canonicalized and restricted to the configured research root.
- Symbolic links and executable file extensions are rejected.
- Absolute paths are not returned by the tested browser flow.
- CSP, frame denial, MIME sniffing protection, referrer policy, and permissions policy are added to responses.
- Demo data, Workers AI, and vector search default to disabled.

### Risks and blockers

1. **No user authentication:** browser routes and most API routes are publicly reachable after deployment.
2. **Static CSRF marker:** `x-amaru-csrf: local-ui` is visible to any browser user and is not authorization. It protects neither manual synchronization nor laboratory/document mutations from an authenticated or direct caller.
3. **Placeholder remote bindings:** all-zero D1/KV identifiers must not reach a deployment.
4. **Incomplete named environment:** `env.production` currently inherits variables but not D1, KV, Queue, R2, or AI bindings.
5. **Private-data boundary:** the local importer should not target the public deployment during the zero-cost test.
6. **Lint gate:** the source formatter failure prevents a clean release gate, and the current Biome scope also scans generated Playwright output.
7. **Bundle size:** the client chunk should be split before broader use, although this does not block a small functional test.
8. **Cost boundary:** R2 has usage-based overage after its free allowance. Omit it for strict zero-risk testing.

## Release decision

Do not deploy the current checkout unchanged.

Before an Internet test:

1. Fix the Biome source-format error, exclude or normalize generated Playwright output, and rerun every release command.
2. Create remote D1, KV, and Queue test resources.
3. Add their real bindings under `env.production`.
4. Build with `CLOUDFLARE_ENV=production` and inspect the dry-run binding table.
5. Apply remote migrations only to the verified test D1 database.
6. Protect the Worker with Cloudflare Access before adding or displaying any private data.
7. Keep R2, Workers AI, vector search, paid providers, and raw-file uploads disabled for the zero-cost test.
8. Verify the resulting `workers.dev` URL, API status, headers, empty private library, and usage dashboards.

The complete procedure is in [cloudflare-deployment.md](cloudflare-deployment.md).

## Commands executed

```powershell
pnpm db:migrate:local
pnpm db:seed:local
pnpm ingest:local
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm sources:health
pnpm wrangler d1 migrations apply DB --local --persist-to .wrangler/verification-state
pnpm wrangler deploy --dry-run
$env:CLOUDFLARE_ENV='production'; pnpm build
pnpm wrangler deploy --dry-run --env production
pnpm wrangler check startup
```

No remote resource was created, no migration was applied remotely, no Git repository was initialized, and no deployment occurred.
