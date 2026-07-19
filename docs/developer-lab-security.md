# Developer Lab security

The browser never calls a private provider API. Every credential-requiring request is executed by the local Worker.

## Credential precedence

1. Encrypted temporary KV credential (eight-hour retention).
2. AES-GCM encrypted local D1 credential.
3. Worker environment binding from ignored `.dev.vars`.

The encryption key is derived with SHA-256 from `DEVELOPER_LAB_ENCRYPTION_KEY`; each stored secret uses a fresh 96-bit IV. D1 stores ciphertext, IV, alias, last four characters and safe status metadata only.

## Browser-safe metadata

The UI may receive provider ID, alias, last four characters, storage class, state and timestamps. It never receives ciphertext, IV, authorization headers, query-string secrets, raw provider payloads or the encryption key.

Connection tests use explicit user action, a 12-second timeout and safe status normalization. Structured logs contain provider ID, state, HTTP status, latency and request ID only.

## Local boundary

State-changing routes require `x-amaru-csrf: local-ui` and reject a mismatched `Origin`. The Worker also applies CSP, frame denial, MIME-sniffing protection and a restrictive permissions policy.

This is a private local boundary, not production authentication. Do not deploy the module publicly without Cloudflare Access or an equivalent reviewed identity layer, rate limiting, audit policy and restricted outbound destinations.

The Cloudflare Vite plugin emits a preview-only `.dev.vars` file during build. `pnpm build` immediately removes that generated file and scans the remaining `dist` tree for every configured local key/token/secret value. The build fails if any value remains.
