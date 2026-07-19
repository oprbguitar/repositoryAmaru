# Security

AMARU applies a strict same-origin CSP, frame denial, MIME sniffing protection, a restrictive permissions policy, safe external-link requirements, Zod request validation, browser output encoding, a CSRF header on document mutations, and bearer authentication on internal imports.

Local files are a separate trust boundary. See `docs/local-library.md`. Extracted HTML is converted to text; untrusted markup is never rendered through `dangerouslySetInnerHTML`. The API exposes stable DTOs rather than source payloads.

The current private-local authorization is not a production identity system. Before remote deployment, add Cloudflare Access or a reviewed private authentication layer, production rate limits, audit logging, and a narrow outbound-source allowlist.
