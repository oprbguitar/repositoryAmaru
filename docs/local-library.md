# Local research library

The library accepts JSON, JSONL/NDJSON, CSV/TSV, YAML, XML/RSS/Atom, plain text, Markdown, HTML, PDF, DOCX, XLSX, PNG, JPEG, and WebP. Images receive safe file metadata only; OCR is disabled by default. Unsupported files remain visible with `Formato todavía no procesado` rather than aborting the scan.

## Safety

- The importer resolves and validates the canonical root and each canonical file.
- Absolute paths, `..`, dot segments, nulls, files outside the root, and direct symbolic links are rejected.
- Executable/script extensions are blocked.
- Original files are opened read-only and are never modified, renamed, moved, or deleted.
- SHA-256, modification time, parser, parser version, state, and a browser-safe relative path are recorded.
- HTML scripts, styles, frames, objects, and embeds are discarded before text extraction.
- The Worker validates imported records again before persistence.

Run `pnpm ingest:local` for a scan or `pnpm ingest:watch` during active research. `pnpm export:local-library` creates normalized JSON metadata only; it does not include original private files.
