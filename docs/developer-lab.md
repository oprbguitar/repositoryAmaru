# Laboratorio de APIs

`/developer-lab` is the local-first execution workspace for external AI APIs and local OpenAI-compatible servers. It is distinct from `/laboratory`: **Mi laboratorio** designs project architectures, while **Laboratorio de APIs** connects providers and records measurable executions.

## Phase 1 available now

- Provider connection directory with explicit missing, configured, verified and error states.
- Environment, encrypted D1 and encrypted temporary KV credential metadata.
- Explicit connection tests; saving a credential never triggers a provider request.
- Existing normalized model catalog exposed through the Developer Lab API.
- D1 foundation for sessions, runs and event timelines.
- Fixed desktop workspace with collapsible inspector and timeline, plus responsive layouts.

Generation, streaming, cost accounting, comparisons, media, agents and RAG are deliberately disabled until their implementation phases. The UI labels this limitation and does not fabricate results.

## Local start

```powershell
pnpm db:migrate:local
pnpm dev
```

Open `http://127.0.0.1:5174/developer-lab`. Use **Conexiones**, select a configured provider, and choose **Probar conexión**. Connection tests only call a provider's account/model-list endpoint and never run a paid generation.

## API foundation

- `GET /api/developer-lab/providers`
- `GET /api/developer-lab/providers/:id`
- `POST /api/developer-lab/providers/:id/configure`
- `POST /api/developer-lab/providers/:id/test`
- `DELETE /api/developer-lab/providers/:id/credential`
- `GET /api/developer-lab/models`
- `GET /api/developer-lab/sessions`
- `POST /api/developer-lab/sessions`

All responses use the project `ApiResponse<T>` envelope. Mutations require the same-origin AMARU CSRF header.

