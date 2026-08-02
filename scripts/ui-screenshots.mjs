// Captures the interface at the four supported widths for visual review and
// reports layout defects (horizontal overflow, off-screen or clipped controls).
// Usage: node scripts/ui-screenshots.mjs <outputDir> [--themes dark,light]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.AMARU_BASE_URL ?? "http://127.0.0.1:5174";

const ROUTES = [
  "/today",
  "/providers",
  "/models",
  "/evolution",
  "/developer-lab",
  "/open-local",
  "/news",
  "/research",
  "/github",
  "/videos",
  "/map",
  "/markets",
  "/local-library",
  "/laboratory",
  "/admin/sources",
];

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
];

const outputDir = process.argv[2] ?? "docs/ui-redesign/current";
const themesArg = process.argv.find((arg) => arg.startsWith("--themes="));
const themes = themesArg ? themesArg.split("=")[1].split(",") : ["dark"];

/**
 * Layout defects that are objectively wrong regardless of taste.
 *
 * Deliberately ignores two intentional patterns that naively look like
 * overflow: the off-canvas mobile drawer (translated out of view) and content
 * inside an `overflow-x: auto` scroller (tables are meant to scroll).
 */
async function auditPage(page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const issues = [];

    const name = (el) => {
      const cls = String(el.className?.baseVal ?? el.className ?? "")
        .split(" ")
        .filter(Boolean)[0];
      return cls
        ? `${el.tagName.toLowerCase()}.${cls}`
        : el.tagName.toLowerCase();
    };

    /** True when an ancestor legitimately clips or scrolls horizontally. */
    const insideScroller = (el) => {
      for (
        let p = el.parentElement;
        p && p !== document.body;
        p = p.parentElement
      ) {
        const s = getComputedStyle(p);
        if (["auto", "scroll", "hidden"].includes(s.overflowX)) return true;
      }
      return false;
    };

    /** True when an ancestor is transformed off-screen (closed drawer). */
    const offCanvas = (el) => {
      for (let p = el; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.transform && s.transform !== "none") {
          const m = new DOMMatrixReadOnly(s.transform);
          if (Math.abs(m.m41) > 20) return true;
        }
        if (s.position === "fixed" && parseFloat(s.left) < -50) return true;
      }
      return false;
    };

    // Root scroller: the strongest signal of a real horizontal overflow.
    const scroller = document.querySelector(".workspace") ?? document.body;
    if (scroller.scrollWidth > scroller.clientWidth + 1) {
      issues.push({
        kind: "workspace-overflow",
        detail: `scrollWidth ${scroller.scrollWidth} > clientWidth ${scroller.clientWidth}`,
      });
    }

    for (const el of document.querySelectorAll("body *")) {
      if (
        !el.checkVisibility?.({ checkOpacity: false, checkVisibilityCSS: true })
      )
        continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right <= docWidth + 1) continue;
      if (insideScroller(el) || offCanvas(el)) continue;
      issues.push({
        kind: "element-overflow",
        selector: name(el),
        left: Math.round(r.left),
        right: Math.round(r.right),
      });
    }

    // Interactive targets too small to use comfortably on touch.
    const small = [];
    for (const el of document.querySelectorAll(
      "button, a[href], input, select, [role=button], [role=tab]",
    )) {
      if (
        !el.checkVisibility?.({ checkOpacity: false, checkVisibilityCSS: true })
      )
        continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (offCanvas(el)) continue;
      if (r.height < 24) {
        small.push({
          selector: name(el),
          h: Math.round(r.height),
          text: (el.textContent || "").trim().slice(0, 24),
        });
      }
    }

    return {
      issues: issues.slice(0, 12),
      overflowCount: issues.length,
      smallTargets: small.slice(0, 12),
      smallTargetCount: small.length,
    };
  });
}

const browser = await chromium.launch();
const report = [];

for (const theme of themes) {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript((value) => {
      window.localStorage.setItem("amaru-theme", value);
    }, theme);

    for (const route of ROUTES) {
      const slug = route.replace(/\//g, "-").replace(/^-/, "");
      const dir = path.join(outputDir, theme, viewport.name);
      await mkdir(dir, { recursive: true });
      try {
        await page.goto(`${BASE}${route}`, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
      } catch {
        // networkidle can never settle while polling queries run; the DOM is
        // still rendered, so continue and capture what is on screen.
      }
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(dir, `${slug}.png`) });
      const audit = await auditPage(page);
      report.push({ theme, viewport: viewport.name, route, ...audit });
      if (audit.overflowCount || audit.smallTargetCount) {
        console.log(
          `${theme} ${viewport.name}px ${route} — overflow:${audit.overflowCount} smallTargets:${audit.smallTargetCount}`,
        );
      }
    }
    await context.close();
  }
}

await browser.close();
await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

const overflow = report.reduce((total, row) => total + row.overflowCount, 0);
const small = report.reduce((total, row) => total + row.smallTargetCount, 0);
console.log(
  `\nCaptured ${report.length} views in ${outputDir}. Overflow findings: ${overflow}. Small targets: ${small}.`,
);
