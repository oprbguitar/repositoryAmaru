# AMARU AI Observatory agent rules

## Product constraints

- Keep the application local-first and Cloudflare-native. Do not add Supabase, Vercel, Firebase, or a traditional production server.
- The default UI must never invent production information. Missing sources use an explicit Spanish `not_configured`, empty, stale, or error state.
- User-facing copy is Spanish. Code, identifiers, comments, and technical documentation are English.
- Desktop uses a fixed `100dvh` shell with scrolling confined to workspaces, tables, drawers, and previews.
- Preserve every file under `propuesta/`; these documents are source material.

## Data and security

- Local imports may read only within `LOCAL_RESEARCH_DIR`. Canonicalize paths, reject traversal and unsafe symlinks, never execute or mutate source files, and never return absolute paths to the browser.
- Keep real secrets in ignored `.dev.vars` or `.env.local` files. Examples may contain placeholders only.
- Source-derived records must retain provenance, timestamps, confidence, attribution, and licensing fields. Never send raw provider payloads directly to the browser.
- Remote bindings and deployments must be explicit. Normal development uses project-owned local state under `.wrangler/state`.

## Engineering quality

- Use strict TypeScript, small feature-focused modules, Zod at trust boundaries, and consistent API envelopes.
- Add migrations for schema changes and tests for validation, normalization, path security, and observable UI behavior.
- Run typecheck, lint, tests, migrations, ingestion, and production build before claiming a milestone works.
- Do not deploy unless the user explicitly requests it.
