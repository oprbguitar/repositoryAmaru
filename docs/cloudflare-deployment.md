# Zero-cost test deployment: GitHub and Cloudflare Workers

Last verified: 2026-07-19

This guide publishes AMARU from a private GitHub repository to a Cloudflare-provided `workers.dev` address. It is a test profile, not a production-security sign-off. No deployment was performed while writing this guide.

## 1. What “zero cost” means

The recommended test profile uses:

- GitHub Free with a private repository.
- Cloudflare Workers Free and the included `workers.dev` hostname.
- D1, Workers KV, and Queues only within their Free-plan limits.
- Workers AI and vector search disabled.
- No custom domain and no paid external API credentials.
- No raw local-file upload to R2.

Cloudflare Free limits fail or throttle after their included quotas. R2 is different: it has a monthly free tier but can generate charges beyond it and may require enabling an R2 subscription. For strict financial zero-risk testing, do not create or bind R2. AMARU will report object storage as unavailable, which is an intentional supported state.

Current official reference limits:

| Service | Free allowance relevant to this project |
| --- | --- |
| Workers | 100,000 requests/day, 10 ms CPU/request, 3 MB Worker size |
| D1 | 5 million rows read/day, 100,000 rows written/day, 5 GB total account storage; 500 MB per database |
| KV | 100,000 reads/day, 1,000 writes/day, 1 GB stored data |
| Queues | 10,000 operations/day; 24-hour retention |
| R2, optional | 10 GB-month, 1 million Class A and 10 million Class B operations/month, then usage-based charges |

Verify these values before each deployment because pricing and limits can change:

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers and KV pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [GitHub Free plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)

## 2. Prerequisites

Create free personal accounts at GitHub and Cloudflare. Install Git and Node.js 24, then verify the local toolchain:

```powershell
git --version
node --version
corepack enable
pnpm --version
pnpm install --frozen-lockfile
```

Run all commands from the project root.

## 3. Verify that private files will not enter Git

The repository already ignores `.dev.vars`, `.env.local`, `.wrangler/`, `dist/`, local research files, reports, and test artifacts. Confirm that before the first commit:

```powershell
git init -b main
git check-ignore -v .dev.vars .env.local .wrangler dist
git status --short --ignored
```

Expected: the real environment files and generated directories appear as ignored. Stop if they appear as files to be committed. Never use `git add -f` for them.

Also confirm the examples contain placeholders only:

```powershell
Get-Content .dev.vars.example
Get-Content .env.local.example
```

## 4. Create a private GitHub repository

In GitHub, choose **New repository**, name it `amaru-ai-observatory`, select **Private**, and do not initialize it with a README, license, or `.gitignore` because the local project already has those files.

Then create the first local commit and push it. Replace `<GITHUB_USER>` with the account name:

```powershell
git add .
git status --short
git diff --cached --stat
git commit -m "chore: initialize AMARU AI Observatory"
git remote add origin https://github.com/<GITHUB_USER>/amaru-ai-observatory.git
git push -u origin main
```

After pushing, open the GitHub repository and confirm that `.dev.vars`, `.env.local`, `.wrangler/`, `dist/`, and `local-research` content are absent.

GitHub Free supports unlimited private repositories with a limited feature set. Keeping this test repository private is recommended because AMARU is a private, local-first workspace.

## 5. Pass the local release gate

Do not continue while any command fails:

```powershell
pnpm db:migrate:local
pnpm db:seed:local
pnpm ingest:local
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

At the time this guide was written, `pnpm lint` failed on one source formatting issue in `lib/external/normalizers.ts`. After Playwright runs, Biome also scans the ignored generated file `test-results/.last-run.json` and can report its missing final newline. Fix the source format and exclude or normalize generated test output before publishing, then rerun the complete gate.

## 6. Sign in to Cloudflare

```powershell
pnpm wrangler login
pnpm wrangler whoami
```

Confirm that Wrangler shows the intended Cloudflare account. Do not continue if it is the wrong account.

## 7. Create the remote free resources

Create D1, KV, and Queue resources. These commands change Cloudflare account state but do not deploy the application:

```powershell
pnpm wrangler d1 create amaru-observatory-test --location apac
pnpm wrangler kv namespace create amaru-observatory-cache-test
pnpm wrangler queues create amaru-index-jobs-test
```

Save the D1 `database_id` and KV namespace `id` printed by Wrangler. Queue bindings use the queue name.

For strict zero-risk testing, skip R2. If the account owner accepts R2’s usage-based overage risk and wants raw-object storage later, create it explicitly:

```powershell
pnpm wrangler r2 bucket create amaru-observatory-raw-test --location apac
```

Keep `LOCAL_STORE_RAW_FILES=false` even when an empty R2 bucket exists.

## 8. Complete the production environment in `wrangler.jsonc`

The current file contains placeholder top-level IDs. They must never be deployed. In addition, D1, KV, R2, Queues, and AI are not inherited by named Wrangler environments.

Copy the real D1/KV/Queue bindings into `env.production`. Keep AI and R2 absent for the strict test profile:

```jsonc
"env": {
  "production": {
    "name": "amaru-ai-observatory-test",
    "vars": {
      "APP_ENV": "production",
      "APP_LOCALE": "es-PE",
      "ENABLE_DEMO_DATA": "false",
      "ENABLE_WORKERS_AI": "false",
      "ENABLE_VECTOR_SEARCH": "false"
    },
    "d1_databases": [
      {
        "binding": "DB",
        "database_name": "amaru-observatory-test",
        "database_id": "<REAL_D1_DATABASE_ID>",
        "migrations_dir": "migrations"
      }
    ],
    "kv_namespaces": [
      {
        "binding": "CACHE",
        "id": "<REAL_KV_NAMESPACE_ID>"
      }
    ],
    "queues": {
      "producers": [
        {
          "binding": "INDEX_QUEUE",
          "queue": "amaru-index-jobs-test"
        }
      ],
      "consumers": [
        {
          "queue": "amaru-index-jobs-test",
          "max_batch_size": 10,
          "max_batch_timeout": 30
        }
      ]
    }
  }
}
```

If R2 is explicitly accepted and created, also add this block inside `env.production`:

```jsonc
"r2_buckets": [
  {
    "binding": "RAW_BUCKET",
    "bucket_name": "amaru-observatory-raw-test"
  }
]
```

Do not add the `ai` binding while Workers AI is disabled. Wrangler may warn that omitted top-level non-inheritable bindings are absent from `production`; for the strict test profile, the R2 and AI omissions are deliberate. D1, KV, and Queue warnings are not acceptable.

## 9. Configure the one required private token

Generate a long random token in a password manager. Store it only in Cloudflare, not in GitHub or `wrangler.jsonc`:

```powershell
pnpm wrangler secret put LOCAL_IMPORT_TOKEN --env production
```

Paste the token only at Wrangler’s hidden prompt. Do not configure external API secrets for the zero-cost test. Public no-key sources will continue to work and paid/keyed sources will remain `not_configured`.

The local importer is designed for the local Worker. Do not point `.env.local` at the Internet deployment or upload private research during this test.

## 10. Build the named environment and validate without deployment

The Cloudflare Vite plugin selects named environments through `CLOUDFLARE_ENV`. In PowerShell:

```powershell
$env:CLOUDFLARE_ENV = "production"
pnpm build
pnpm wrangler deploy --dry-run --env production
Remove-Item Env:CLOUDFLARE_ENV
```

Inspect the dry-run binding table. It must show:

- `APP_ENV` as `production`.
- The real D1 database, not the all-zero placeholder.
- The real KV namespace, not the all-zero placeholder.
- `amaru-index-jobs-test` as producer and consumer.
- No AI binding in the strict test profile.

Do not deploy if the output shows `APP_ENV=development`, placeholder IDs, or missing D1/KV/Queue bindings.

## 11. Apply remote migrations

List the target migrations before changing the remote database:

```powershell
pnpm wrangler d1 migrations list DB --remote --env production
pnpm wrangler d1 migrations apply DB --remote --env production
```

Read the account and database shown by Wrangler before confirming. The four expected migrations are `0001_initial.sql` through `0004_market_sources.sql`.

## 12. Protect the test before exposing it

The application currently has no user authentication. The `x-amaru-csrf: local-ui` header is observable browser code and is not an authorization control. Without an external access layer, anyone who discovers the URL can read data and invoke write/synchronization endpoints.

Before sharing the URL, configure Cloudflare Access for the Worker’s `workers.dev` and preview URLs in **Workers & Pages → AMARU Worker → Domains**, and allow only the test users’ email addresses. Cloudflare documents that the Domains panel can place both URL types behind Access: [Workers Domains update](https://developers.cloudflare.com/changelog/post/2026-05-14-domains-tab/).

If Access is not configured, use only an empty test database, upload no private files, add no paid API keys, and do not treat the URL as private.

## 13. Deploy once from the local machine

Deployment is an explicit production write:

```powershell
$env:CLOUDFLARE_ENV = "production"
pnpm build
pnpm wrangler deploy --env production
Remove-Item Env:CLOUDFLARE_ENV
```

Wrangler publishes to a URL similar to:

```text
https://amaru-ai-observatory-test.<ACCOUNT_SUBDOMAIN>.workers.dev
```

No purchased domain is required. Cloudflare documents `wrangler deploy` and `workers.dev` as the default route: [Workers deployment guide](https://developers.cloudflare.com/workers/get-started/guide/).

## 14. Verify the online deployment

Replace `<URL>` with Wrangler’s exact result:

```powershell
$amaruUrl = "https://<URL>"
Invoke-WebRequest "$amaruUrl/api/status" -UseBasicParsing
Invoke-WebRequest "$amaruUrl/today" -UseBasicParsing
Invoke-WebRequest "$amaruUrl/local-library" -UseBasicParsing
```

Then verify in a real browser:

1. Authentication is required before any AMARU content appears.
2. `/today` renders the Spanish shell.
3. `/local-library` contains no local private document.
4. Administration shows missing credentials as `not_configured`.
5. A public-source synchronization completes or reports a source-specific error without fabricated records.
6. Response headers include CSP, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.

Check Cloudflare usage dashboards after the test. Keep usage below the Free allowances.

## 15. Optional automatic deployment from GitHub

First complete and verify one manual deployment. Then Cloudflare can connect GitHub and automatically deploy on each push. Official documentation: [Workers Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/).

In **Workers & Pages → AMARU Worker → Settings → Builds**, connect the private repository and set:

- Production branch: `main`.
- Build command: `pnpm build`.
- Deploy command: `pnpm wrangler deploy --env production`.
- Environment variable: `CLOUDFLARE_ENV=production`.
- Environment variable: `NODE_VERSION=24` if the build image does not read `.node-version`.

Cloudflare account bindings and Worker secrets remain in Cloudflare; do not add them to GitHub files. Require the same release gate locally before pushing to `main`.

## 16. Rollback and cleanup

If the test must stop, disable the `workers.dev` route or delete the Worker from the Cloudflare dashboard. Delete remote test resources only after exporting anything that must be retained. These actions are destructive and should be performed manually against the exact named resources.

Removing the GitHub repository does not remove the deployed Worker, D1 database, KV namespace, Queue, or R2 bucket. Cloudflare resources must be removed separately.
