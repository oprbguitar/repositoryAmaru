# Developer Lab current-state audit

Date: 2026-07-19

## Existing technology stack

- React 19 SPA, React Router 7, TanStack Query 5, Vite 8 and strict TypeScript.
- Cloudflare Worker module served through the official Vite plugin.
- Project-owned local bindings: D1 (`DB`), KV (`CACHE`), R2 (`RAW_BUCKET`), Queue (`INDEX_QUEUE`) and optional Workers AI (`AI`).
- Biome for lint/format, Vitest + Testing Library for unit/UI tests, and Playwright for desktop/mobile smoke tests.
- Fixed `100dvh` shell. The browser body is non-scrollable; each feature owns its internal scroll regions.

## Existing provider architecture

`providers` stores provider identity and official links. `source_registry` stores external integration status, authentication type, optional secret binding name, attribution, licensing and health metadata. `worker/external.ts` isolates public and authenticated catalog adapters and normalizes their records before persistence.

The Developer Lab must reuse provider IDs from `providers`. Its registry adds executable capability and connection metadata without creating a competing provider entity. Failure of one connection remains isolated from all other entries.

## Existing model architecture

Models are normalized `observatory_records` with `record_kind = 'model'`; provider-specific identifiers and normalized metadata remain in `external_id` and `data_json`. Live account discovery already exists for OpenAI, Gemini, Groq and Mistral through registered sources. OpenRouter and Hugging Face provide public catalog ingestion.

Phase 1 exposes those records through `/api/developer-lab/models`. It does not duplicate them in a second model table. Account-scoped discovery and capability verification belong to Phase 2.

## Existing pricing architecture

`model_offerings` stores provider-specific prices with original pricing JSON, official source identity and verification timestamp. `lib/laboratory/engine.ts` already distinguishes complete and partial cost estimates and never treats missing prices as zero. Developer Lab runs will reference this architecture in the cost phase; Phase 1 stores a nullable `cost_json` only.

## Existing secure-secret mechanisms

- Worker secrets are read from ignored `.dev.vars` and never use a browser-visible prefix.
- Internal local imports use constant-time bearer-token comparison.
- UI mutations use a same-origin custom CSRF header.
- API responses use stable envelopes and security headers; external raw payloads are normalized first.
- Production identity is intentionally not implemented. Any remote deployment requires Cloudflare Access or another reviewed private identity layer.

Developer Lab adds an isolated credential service. Environment bindings remain the preferred local method. UI-submitted credentials are encrypted with AES-GCM using `DEVELOPER_LAB_ENCRYPTION_KEY`, then stored in local D1 or temporary KV. Only alias, storage class, state and last four characters may reach the browser.

## Existing local bindings

| Binding | Current use | Developer Lab reuse |
|---|---|---|
| `DB` | normalized records, providers, prices, projects | credential metadata, sessions, runs, events and connection state |
| `CACHE` | dashboard/source caches | encrypted eight-hour temporary credentials |
| `RAW_BUCKET` | optional local source copies | reserved for later test files and generated outputs |
| `INDEX_QUEUE` | scheduled source synchronization | unchanged in Phase 1 |
| `AI` | optional Workers AI | connection/binding availability |

Normal development persists all local binding state under `.wrangler/state`.

## Components and patterns reused

- `AppShell`, sidebar navigation, mobile tabs and live strip.
- Existing navy/cyan/semantic visual tokens and internal scrolling rules in `global.css`.
- React Query query/mutation conventions.
- `ApiResponse<T>` envelopes and Spanish error states.
- `providers`, `source_registry`, `observatory_records`, `model_offerings` and `live_events`.
- Existing `Mi laboratorio` remains at `/laboratory` and keeps its architecture-design purpose.

## Migration required

Migration `0005_developer_lab_foundation.sql` adds:

- `developer_lab_provider_configs`: AES-GCM ciphertext and safe metadata only.
- `developer_lab_provider_status`: last safe connection result, latency and visible model count.
- `developer_lab_sessions`: named local test sessions.
- `developer_lab_runs`: normalized future executions with nullable usage/cost/timing/error fields.
- `developer_lab_events`: sanitized ordered run events.

No plaintext credential column exists. No provider, model or pricing table is duplicated.

## Integration risks

- Browser-entered persistence is unavailable until a strong local encryption key is configured.
- Local endpoints may not be reachable from workerd on every host configuration; unavailable is a valid state.
- Model-list endpoints verify access but do not prove billing, quota or generation capability.
- Provider APIs change independently; endpoint behavior must be revalidated in Phase 2 before capability claims.
- The local CSRF boundary is not sufficient for an internet-exposed deployment.
- Existing `providers` coverage is smaller than the Developer Lab execution registry; new identity rows should only be added when their source/licensing metadata is complete.

## Files that must remain untouched

- Every file under `propuesta/`.
- Local research source files under `LOCAL_RESEARCH_DIR`.
- Unrelated observatory modules, route behavior and existing migrations `0001` through `0004`.
- Real credential files must remain ignored and outside documentation, screenshots, exports and Git history.

