// Measures text contrast against the *composited* background (alpha layers are
// blended, not treated as opaque) for the selectors most at risk in each theme.
// Usage: node scripts/ui-contrast.mjs [route]
import { chromium } from "@playwright/test";

const BASE = process.env.AMARU_BASE_URL ?? "http://127.0.0.1:5174";
const route = process.argv[2] ?? "/today";

const SELECTORS = [
  ".sidebar nav a",
  ".sidebar nav a.active",
  ".observatory-status .eyebrow",
  ".observatory-status .status-pair span",
  ".observatory-status a",
  ".live-strip .live-message",
  ".live-strip a",
  ".live-strip strong",
  ".page-heading p",
  ".page-heading h1",
  ".brand-copy span",
  ".utc",
  ".global-search input",
  ".secondary-button",
  ".state-badge",
  ".honest-empty p",
  ".panel-heading span",
  ".observatory-table th",
  ".observatory-table td",
  ".capability-chip",
];

const browser = await chromium.launch();
let failures = 0;

for (const theme of ["dark", "light"]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.addInitScript(
    (value) => window.localStorage.setItem("amaru-theme", value),
    theme,
  );
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const rows = await page.evaluate((selectors) => {
    const parse = (s) => {
      const n = (s.match(/[\d.]+/g) || []).map(Number);
      return { r: n[0] ?? 0, g: n[1] ?? 0, b: n[2] ?? 0, a: n[3] ?? 1 };
    };
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    /** Composite every translucent ancestor background down to an opaque colour. */
    const bgOf = (el) => {
      const stack = [];
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.a > 0) stack.push(c);
        if (c.a === 1) break;
      }
      let acc = stack.pop() ?? { r: 255, g: 255, b: 255, a: 1 };
      while (stack.length) acc = over(stack.pop(), acc);
      return acc;
    };
    const lum = (c) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };

    return selectors
      .map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const bg = bgOf(el);
        const fg = over(parse(cs.color), bg);
        const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        const ratio = (hi + 0.05) / (lo + 0.05);
        const size = parseFloat(cs.fontSize);
        const weight = Number(cs.fontWeight) || 400;
        // WCAG "large text": >=18.66px bold, or >=24px.
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        return {
          sel,
          size: cs.fontSize,
          ratio: Math.round(ratio * 100) / 100,
          need: large ? 3 : 4.5,
          pass: ratio >= (large ? 3 : 4.5),
        };
      })
      .filter(Boolean);
  }, SELECTORS);

  console.log(`\n=== ${theme} (${route}) ===`);
  for (const row of rows) {
    if (!row.pass) failures += 1;
    console.log(
      `${row.pass ? "PASS" : "FAIL"}  ${String(row.ratio).padStart(6)} (needs ${row.need})  ${row.size.padStart(6)}  ${row.sel}`,
    );
  }
  await context.close();
}

await browser.close();
console.log(`\n${failures} contrast failure(s).`);
process.exit(failures ? 1 : 0);
