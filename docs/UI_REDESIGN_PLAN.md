# AMARU — minimalist UI redesign plan

Branch: `design/minimal-ui-refresh`. Presentation-only refactor. No worker route,
API contract, query key, schema, or synchronization logic changes.

## 1. Current structure

The shell is a CSS grid in `src/app/styles/global.css` (~4 200 lines, the single
stylesheet) driving `src/components/layout/AppShell.tsx`:

```
topbar (72px)     brand · global search · theme · UTC clock · notifications · menu
sidebar (218px)   13 NavLinks + observatory status block
workspace         <Outlet /> — one feature page per route
live-strip (54px) latest verified event
mobile-tabs       4 shortcuts, shown under 900px
```

Feature pages live in `src/features/<module>/`. Most use one of two layouts:
`module-layout observatory-layout` (main + `RecordContext` panel) or
`CollapsibleLayout` (main + collapsible context panel).

## 2. What already works and must not regress

- Provenance-first presentation: every figure carries source, date, methodology.
- Honest empty states (`.honest-empty`) instead of invented data.
- Fixed `100dvh` shell with scrolling confined to workspaces and table wrappers.
- Off-canvas sidebar drawer under 900px, plus a bottom tab bar.
- Horizontal table scrollers (`.data-table-scroll`) keeping wide tables usable.
- Theme persistence via `localStorage` + `html[data-theme]`.
- Existing `prefers-reduced-motion` blocks.

Measured baseline: **no real horizontal overflow at any of 390/768/1024/1440**
across 14 routes (56 views). An initial audit reported thousands of overflows;
that audit was wrong — it counted the intentionally off-canvas drawer and
content inside `overflow-x:auto` scrollers. The corrected audit reports zero.

## 3. Real problems found

### 3.1 Accessibility (the serious ones)

| Problem | Evidence | Standard |
| --- | --- | --- |
| 358 interactive targets under 24px tall | inputs 13–20px, `Ver ficha` 21px, `Fuente original` 17px, selects 17px | WCAG 2.2 AA 2.5.8 |
| Light-theme sidebar status illegible | `.observatory-status a` **1.26:1**, `.eyebrow` 1.35:1, `.status-pair span` 2.26:1 | WCAG 1.4.3 (needs 4.5:1) |
| Light-theme live strip illegible | `.live-message` 1.61:1, `.live-strip a` 1.97:1 | WCAG 1.4.3 |

Root cause of the contrast failures: those rules hardcode dark-theme colours that
the `html[data-theme="light"]` block never remaps.

### 3.2 No design system

| Axis | Current | Target |
| --- | --- | --- |
| Radius | 9 values (4,5,6,7,8,9,10,99,999) | 4 tokens |
| Breakpoints | 8 values (520…1280) | 4 (`390/768/1024/1440` boundaries) |
| Font size | 12+ values incl. **8px, 8.5px, 9px, 9.5px** | 6 tokens, floor 11px |
| Spacing | 2,3,4,5,6,7,8,9,10,11,12,14 ad hoc | 4px-based scale |
| Gradients | 23 | keep only where they encode state |

### 3.3 Visual noise and density

- **Models table**: the "Para qué sirve" column renders every capability as a
  pill, producing 130px rows and a wall of colour. The context panel then repeats
  the same pills. Cap the inline list and keep full evidence in the panel.
- **Competing accents**: cyan, blue, green, purple and amber all used at full
  saturation for non-semantic decoration.
- **Mobile `/today`**: one metric card per row, ~118px each, each with its own
  gradient — very low information density.
- Decorative radial gradient on the shell and per-card gradients.

## 4. Design tokens to introduce

Extend the existing `:root` custom properties (no new styling technology):

```
spacing    --space-1..7        4 8 12 16 24 32 48
radius     --radius-sm/md/lg/pill   4 6 10 999
type       --text-xs..2xl      11 12 13 15 18 22   (floor 11px)
control    --control-sm/md/lg  28 32 36            (all ≥ 24px target)
layout     --sidebar-w --context-w --topbar-h --strip-h
accent     --accent (cyan) as the single primary
semantic   --ok --warn --danger --info  (reserved for state only)
```

Font stack becomes the honest system stack: `Inter` is declared today but never
loaded, so it silently falls back. No remote fonts will be added.

## 5. Responsive rules

| Width | Behaviour |
| --- | --- |
| ≥1440 | sidebar + workspace + context panel |
| 1024–1439 | context panel narrows; tables scroll |
| 768–1023 | sidebar becomes drawer; context panel moves below main content |
| ≤767 | bottom tabs; metric grid 2 columns; live strip collapses to one line |

Tables keep their horizontal scroller — content is not hidden to solve layout.

## 6. Files expected to change

- `src/app/styles/global.css` — tokens, primitives, responsive and contrast fixes
- `src/components/layout/AppShell.tsx` — markup hooks only (classes, labels)
- `src/features/observatory/ModelsRankingPage.tsx` — cap inline chips
- `src/features/observatory/CapabilityTags.tsx` — `max` prop for inline lists
- `src/features/today/TodayPage.tsx` — metric grid density
- `index.html` — favicon links, theme-color
- `LICENSE`, `NOTICE?`, `package.json`, `README.md`, `docs/index.html`
- `scripts/ui-screenshots.mjs` — validation harness (new)

Untouched: `worker/**`, `lib/**`, `migrations/**`, `types/api.ts`, all query
keys, adapters, capability derivation, cost maths, secret handling.

## 7. Testing strategy

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` after each phase.
2. `node scripts/ui-screenshots.mjs` — 14 routes × 4 widths, auditing real
   overflow and sub-24px targets, in both themes.
3. Programmatic contrast measurement on the previously failing selectors.
4. `pnpm test:e2e` (Playwright) for behavioural regressions.
5. Manual keyboard pass: focus visibility, drawer, dialogs.

## 8. Regression risks

| Risk | Mitigation |
| --- | --- |
| Class renames breaking E2E selectors | keep existing class names; add, don't rename |
| Contrast fix altering dark theme | change light-theme overrides only |
| Chip cap hiding information | full list stays in the context panel |
| Larger controls causing overflow | re-run the overflow audit after each phase |
| Token refactor changing unrelated pages | tokens map to current values where already sane |

## 9. Licensing

Add verbatim Apache-2.0 `LICENSE`, `"license": "Apache-2.0"` in `package.json`
(keeping `"private": true`), a README section, and a direct-dependency licence
review recorded in the report. `NOTICE` only if an owner is reliably identifiable.
