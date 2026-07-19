# API credentials

The local library needs no external credentials. `LOCAL_IMPORT_TOKEN` is shared only between the local Node importer and local Worker; replace the example value for routine use.

Optional provider credentials belong in ignored `.dev.vars`. Node-only local paths and importer settings belong in ignored `.env.local`. Never expose a private value through `VITE_`, `PUBLIC_`, or `NEXT_PUBLIC_`.

The following discovery adapters activate automatically when their binding exists:

| Binding | Adapter | Endpoint |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI model discovery | `GET /v1/models` |
| `GEMINI_API_KEY` | Gemini model discovery | `GET /v1beta/models` |
| `GROQ_API_KEY` | Groq account model discovery | `GET /openai/v1/models` |
| `MISTRAL_API_KEY` | Mistral account model discovery | `GET /v1/models` |
| `GITHUB_TOKEN` | Higher GitHub REST quota | Public search endpoints |
| `HUGGINGFACE_TOKEN` | Higher/private-authorized Hub quota | Public Hub endpoints |

Model endpoints do not establish pricing. AMARU leaves price fields as “No informado por la fuente” unless an independently registered official pricing source confirms the value.

For production, use `pnpm wrangler secret put NAME` interactively. Do not place real values in `wrangler.jsonc`, shell history, documentation, or commits. Source status pages may reveal only whether a credential is configured—not its value.
