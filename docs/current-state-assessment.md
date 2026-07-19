# Current state assessment

Date: 2026-07-18

## Existing state

The workspace contained five Spanish proposal and PRD documents under `propuesta/`. There was no package manifest, source tree, Worker, database, migration, test suite, environment example, Git metadata, or runnable application.

## Reusable material

- `propuesta/PRD técnico y visual.md` defines the product, routes, visual system, data model, and acceptance expectations.
- The remaining proposal documents define Cloudflare architecture, market-data strategy, source priorities, and the progressive-reading model.
- Eight supplied reference screens are the approved UI specification for the shell and principal modules.

## Local research discovery

A bounded, accent-insensitive scan of the workspace and nearby project directories found only folders belonging to unrelated projects. To avoid importing unrelated private material, AMARU uses the documented fallback `./local-research`. Its absolute path is stored only in ignored `.env.local`.

## Risks and strategy

- The specification is much larger than a single feature. Implementation is phased, beginning with the local foundation and highest-priority local library.
- External integrations must not block startup and must never be replaced by fabricated production records.
- Cloudflare bindings must remain local by default and deployment requires explicit authorization.
- Parser packages are isolated to the Node ingestion utility; arbitrary filesystem access is never available to the Worker.

## Protected files

All files under `propuesta/` remain untouched. No existing feature code existed to migrate.
