# AMARU — minimalist UI redesign report

Branch `design/minimal-ui-refresh`. **No application deployment was performed**
— see section 13. The redesign itself was completed with no remote push;
publication to GitHub was authorised separately, afterwards.

## 1. Executive summary

A presentation-layer refactor that replaced ad-hoc styling with a token system,
fixed measured accessibility defects, rebuilt the `Hoy` dashboard, added a
language control, added Apache-2.0 licensing, a favicon, and a demo showcase.

| Measure | Before | After |
| --- | --- | --- |
| Interactive targets under 24px (WCAG 2.5.8) | **358** | **0** |
| Contrast failures (WCAG 1.4.3, both themes) | **5** (worst 1.26:1) | **0** |
| Real horizontal overflow | 0 | 0 |
| Views audited | 56 | **112** (14 routes × 4 widths × 2 themes) |
| Radius values | 9 | 4 tokens |
| Font sizes below 11px | 47 declarations | 0 |
| Hardcoded text/border colours | 95 | 0 (tokenised) |
| Unit tests | 77 | **85** |
| CSS bundle (gzip) | 25.15 kB | 26.4 kB |
| JS bundle (gzip) | 401.24 kB | 401.9 kB |

The audit tooling itself was corrected mid-flight: an initial version reported
~12 000 "overflow" findings that were false positives (the intentionally
off-canvas drawer and content inside `overflow-x:auto` scrollers). The corrected
harness reports zero, before and after. **The baseline was not broken for
overflow**; the real defects were target size and contrast.

## 2. Visual direction

Information-first and deliberately quiet:

- **One accent** (cyan). Every other hue is reserved for state — success,
  warning, danger, info. Capability chips were neutralised; group identity is a
  2px leading rule, and the accent is reserved for the chip actively filtering.
- **1px borders instead of shadows.** Decorative gradients removed from the
  shell, sidebar, panels and active navigation.
- **Typography and spacing carry hierarchy**, not containers. Type floor 11px;
  4px spacing scale; four radii.
- **Density preserved.** The Models table went from 3 visible rows to 7 by
  capping inline chips at three with a `+N` summary; the full evidence list
  stays in the context panel.

## 3. Files modified

**Design system and shell**
- `src/app/styles/global.css` — tokens, primitives, responsive and contrast work
- `src/components/layout/AppShell.tsx` — globe language control, translated shell
- `src/components/layout/navigation.ts` — labels carry translation keys

**Feature pages**
- `src/features/today/TodayPage.tsx` — rebuilt dashboard
- `src/features/today/PriceTrend.tsx` — new, inline SVG chart
- `src/features/observatory/CapabilityTags.tsx` — `max` prop and `+N` summary
- `src/features/observatory/ModelsRankingPage.tsx`, `ProviderDetail.tsx` — chip caps

**Internationalisation (new)**
- `src/i18n/dictionary.ts`, `src/i18n/LanguageProvider.tsx`, `src/main.tsx`

**Worker (one additive endpoint)**
- `worker/modules.ts`, `worker/index.ts` — `GET /api/dashboard/price-history`
- `types/api.ts`, `src/features/observatory/api.ts` — matching types and client

**Assets, docs, tooling**
- `index.html`, `public/*` — favicon set and manifest
- `LICENSE`, `package.json`, `README.md`, `docs/index.html`
- `scripts/ui-screenshots.mjs`, `scripts/ui-contrast.mjs`
- `tests/i18n.test.ts` (new, 8 tests)

**Untouched:** adapters, normalizers, capability derivation, cost maths,
migrations, query keys, secret handling, Cloudflare bindings.

## 4. Components standardised

Page headers, buttons, icon buttons, inputs, selects, search controls, tables,
panels, badges, status indicators, empty states, tabs, chips, dialogs/sheets,
mobile navigation, and a new menu primitive for the language control. No
component framework was introduced; the stack is unchanged (React, CSS, Lucide).

## 5. Responsive changes

| Width | Behaviour |
| --- | --- |
| ≥1441 | sidebar + workspace + context panel |
| 1025–1440 | narrower sidebar; context panel scrolls independently |
| 769–1024 | drawer navigation; context panel stacks below the main content |
| ≤768 | bottom tabs; 2-column metric grid; headers stack |

Fixed along the way:
- **Mobile shell regression I introduced:** an unguarded `.app-shell` rule sat
  after the drawer media query and re-added a sidebar column at 390px, squeezing
  the tab bar into 196px. Now guarded behind `min-width: 901px`.
- **Mobile tab bar stayed dark in light theme** (hardcoded background) — tokenised.
- `.page-heading` and `.status-banner` now stack instead of hiding the page
  description on small screens.
- Tab labels truncate with an ellipsis; stat labels wrap instead of clipping.

## 6. Accessibility changes

- Every interactive control clears 24×24px, including MapLibre's required
  attribution links. Verified across 112 views.
- All five light-theme contrast failures fixed by tokenising colour so themes
  override tokens rather than individual selectors. Verified with an
  **alpha-compositing** contrast script — a naive version mis-measured
  translucent backgrounds as opaque.
- Active navigation is no longer colour-only (inset rule added).
- Keyboard pass: logical tab order, every stop visible and in-viewport, visible
  focus ring on all surfaces.
- Language control is a proper `menu`/`menuitemradio`, closes on Escape and
  outside pointer, and sets `document.documentElement.lang`.
- Charts expose `role="img"` with a sentence-level `aria-label` plus `<title>`.
- `prefers-reduced-motion` honoured (existing global block retained; a
  duplicate `!important` block I added was removed as redundant).

## 7. Functional preservation

No route, endpoint, request method, query key, schema, migration, adapter,
normalizer, capability derivation or cost calculation was changed. One
**additive** read-only endpoint was introduced. No secret was moved toward the
browser and no `VITE_`/`PUBLIC_`/`NEXT_PUBLIC_` prefix was added.

**No fabricated data.** The reference mockups for `Hoy` showed a 30-day,
multi-series cost chart with named premium models and figures such as
"GPT-4o $2.48 −28%". That data does not exist in the database:

- the observatory has stored exactly **two** synchronization dates
  (2026-07-19 and 2026-08-02), not thirty daily points;
- the only ranking that carries a USD score is `pricing-low`
  (`score_unit = usd_per_million_input`), which tracks the *cheapest* models,
  so the premium models in the mockup are not in it at all;
- `model_offerings` overwrites on conflict, so it holds no history either.

Rather than invent the missing series, the chart keeps the mockup's **structure**
— per-model summary cards with current price and change, a multi-series line
chart, and a legend — and fills it with real observations: one line per model,
one point per stored synchronization date, no interpolation between dates. The
five models shown are those present on every stored date, ranked by how much
their price actually moved. Current real values include Qwen3 30B A3B
0.1 → 0.0482 (−51.8%) and Mistral Small 3.2 24B 0.1 → 0.075 (−25%), across 42
models with complete history. Vertical guides mark each real observation so the
sparsity is visible, and the caption states the observation count. With fewer
than two shared dates the panel renders an honest empty state.

"Models by country" uses the real country aggregates (US 700, FR 71, CN 12,
CA 5). Health and activity panels read live source state and events.

## 8. Licensing

- `LICENSE` — official Apache-2.0, verbatim, sha256
  `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`
  (matches the canonical file at apache.org).
- `package.json` — `"license": "Apache-2.0"`; `"private": true` retained, since
  the npm private flag and open-source licensing are unrelated concerns.
- `README.md` — License section plus repository and demo links.
- **No owner was invented.** The repository has no `author` field, no project
  copyright notice, and only a first name in git config, so the appendix
  placeholder is left exactly as published for the maintainer to complete.
- **No `NOTICE` file**, for the same reason. The only third-party notices in the
  tree (Cloudflare/Microsoft, inside the wrangler-generated
  `worker-configuration.d.ts`) are preserved in that file's own header.

### Dependency licence review

All 15 direct production dependencies are permissive and Apache-2.0 compatible:

| Licence | Packages |
| --- | --- |
| MIT (11) | @tanstack/react-query, cheerio, csv-parse, exceljs, fast-xml-parser, file-type, react, react-dom, react-router-dom, zod |
| ISC (2) | lucide-react, yaml |
| BSD-2-Clause | mammoth |
| BSD-3-Clause | maplibre-gl |
| Apache-2.0 | pdfjs-dist |

No copyleft (GPL/AGPL/SSPL) or unknown licence was found. This is a mechanical
review of declared `license` fields, not legal advice.

## 9. Commands executed

```
pnpm typecheck   exit 0
pnpm lint        exit 0
pnpm test        14 files, 85 tests passed
pnpm build       client + worker built
pnpm test:e2e    6 passed, 4 skipped (project-conditional by design)
node scripts/ui-screenshots.mjs --themes=dark,light
                 112 views · overflow 0 · sub-24px targets 0
node scripts/ui-contrast.mjs /today   0 failures
node scripts/ui-contrast.mjs /models  0 failures
```

## 10. Screenshots

Curated captures (both themes, desktop and mobile) live in
`docs/ui-redesign/showcase/` as webp — 1.4 MB of PNG reduced to 480 kB — and are
embedded in the README and the demo page. Full per-route baseline and after sets
are generated into `docs/ui-redesign/{baseline,after}/`, which are gitignored.

## 11. Remaining limitations

1. **Translation coverage.** The i18n foundation is in place and the shell,
   navigation and the `Hoy` dashboard are translated. Module body copy
   (Providers, Models, News, Research, Lab, Library, …) is still Spanish-only;
   those strings need migrating key by key into `src/i18n/dictionary.ts`.
2. **Price history is sparse** — two real points. It becomes informative as
   synchronizations accumulate. This is a data-availability limit, not a bug.
3. **`Hoy` omits the mockup's world map.** The app already renders a MapLibre map
   on `/map`; embedding a second instance would add weight for little gain, so
   the dashboard shows the ranked country list and links through.
4. **`docs/index.html` is a static showcase**, not a live sandbox: it embeds real
   screenshots rather than running the app.
5. **The unused notification affordance was removed** with the bell. If
   notifications are wanted later they need a real data source.
6. Bundle warning: the JS chunk exceeds 500 kB. Pre-existing, unchanged by this
   work, and worth addressing with code splitting separately.

## 12. Recommended next steps

- Migrate remaining module copy into the dictionary; add a lint rule or test that
  fails on new hardcoded user-facing strings.
- Fill in the `LICENSE` appendix copyright line.
- Code-split the client bundle by route.
- Add visual-regression assertions to the Playwright suite using the harness.
- Consider persisting a daily price snapshot so the trend fills in faster.

## 13. Deployment confirmation

**No application deployment was performed.** `wrangler deploy` was never
invoked and no Cloudflare resource (Worker, D1, KV, R2, Queue) was created or
modified. Local state under `.wrangler/state` was never deleted.

The redesign work was carried out with no remote push, as originally
instructed. The maintainer subsequently authorised publication, so the branch
and `main` were pushed to GitHub, which republishes the GitHub Pages showcase
from `main:/docs`. That is a documentation-site publication, not an application
deployment.
