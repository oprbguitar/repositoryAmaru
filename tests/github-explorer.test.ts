import { describe, expect, it } from "vitest";
import { isAllowedAssetUrl } from "../lib/github/assets";
import { REPO_GROUPS } from "../lib/github/collections";
import {
  buildSignals,
  derivePagesUrl,
  isOsiLicense,
  normalizeLanguages,
  normalizeRepo,
  parseRateLimit,
} from "../lib/github/normalize";
import { buildSearchQuery, isSafeSearchQuery } from "../lib/github/query";
import { parseAiSuggestions, suggestLocally } from "../lib/github/suggest";
import {
  galleryImages,
  sanitizeReadmeHtml,
} from "../src/features/github/sanitize";

const ctx = { owner: "o", repo: "r", ref: "main", baseDir: "docs" };

describe("search query builder", () => {
  const now = new Date("2026-11-09T00:00:00Z");
  it("ORs topics through in:topics and quotes hyphenated terms", () => {
    expect(
      buildSearchQuery(
        { anyTopics: ["design-system", "ui-kit"], minStars: 50 },
        now,
      ),
    ).toBe('"design-system" OR "ui-kit" in:topics stars:>=50 archived:false');
  });
  it("uses topic: for AND and a single topic", () => {
    expect(buildSearchQuery({ topics: ["rag", "Python Tools"] }, now)).toBe(
      "topic:rag topic:python-tools archived:false",
    );
    expect(buildSearchQuery({ anyTopics: ["icons"] }, now)).toBe(
      "topic:icons archived:false",
    );
  });
  it("adds dates, language and strips operators from keywords", () => {
    const query = buildSearchQuery(
      {
        keywords: ['OR "x":y', "edge ai"],
        language: "TypeScript",
        pushedWithinDays: 30,
      },
      now,
    );
    expect(query).toContain('"x y" "edge ai" in:name,description,readme');
    expect(query).toContain("language:TypeScript");
    expect(query).toContain("pushed:>=2026-10-10");
  });
  it("rejects unsafe raw queries", () => {
    expect(isSafeSearchQuery("topic:rag stars:>10")).toBe(true);
    expect(isSafeSearchQuery("user:octocat")).toBe(false);
    expect(isSafeSearchQuery("repo:a/b rag")).toBe(false);
    expect(isSafeSearchQuery("x\u0001y")).toBe(false);
  });
  it("every curated type builds a valid query", () => {
    for (const group of REPO_GROUPS)
      for (const type of group.types)
        expect(isSafeSearchQuery(buildSearchQuery(type.spec))).toBe(true);
  });
});

describe("normalizers", () => {
  it("normalizes a repository payload", () => {
    const repo = normalizeRepo({
      id: 1,
      full_name: "mui/material-ui",
      name: "material-ui",
      owner: { login: "mui", type: "Organization", avatar_url: "a" },
      license: { spdx_id: "MIT", name: "MIT License" },
      stargazers_count: 10,
      topics: ["react", 3],
      has_pages: true,
    });
    expect(repo.owner).toBe("mui");
    expect(repo.ownerType).toBe("Organization");
    expect(repo.topics).toEqual(["react"]);
    expect(repo.license?.spdxId).toBe("MIT");
    expect(derivePagesUrl(repo)).toBe("https://mui.github.io/material-ui/");
  });
  it("computes language percentages", () => {
    const langs = normalizeLanguages({ TypeScript: 750, CSS: 250, Empty: 0 });
    expect(langs).toEqual([
      { name: "TypeScript", bytes: 750, percent: 75 },
      { name: "CSS", bytes: 250, percent: 25 },
    ]);
  });
  it("parses rate-limit headers", () => {
    const rate = parseRateLimit(
      new Headers({
        "x-ratelimit-limit": "10",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": "1794270210",
      }),
    );
    expect(rate.remaining).toBe(0);
    expect(rate.resetAt).toBe(new Date(1794270210000).toISOString());
  });
  it("builds verification signals from fetched data", () => {
    const repo = normalizeRepo({
      full_name: "a/b",
      name: "b",
      owner: { login: "a", type: "Organization" },
      license: null,
      pushed_at: "2025-01-01T00:00:00Z",
      archived: true,
    });
    const signals = buildSignals({
      repo,
      org: {
        login: "a",
        name: null,
        isVerified: true,
        blog: null,
        publicRepos: 1,
        followers: 1,
      },
      releases: [],
      now: new Date("2026-11-09T00:00:00Z"),
    });
    const state = Object.fromEntries(signals.map((s) => [s.id, s.state]));
    expect(state).toEqual({
      organization: "ok",
      license: "bad",
      activity: "bad",
      archived: "bad",
      releases: "warn",
    });
    expect(isOsiLicense("MIT")).toBe(true);
    expect(isOsiLicense("CC-BY-NC-4.0")).toBe(false);
  });
});

describe("suggestions", () => {
  it("local suggester maps keywords to topics", () => {
    const set = suggestLocally(
      "Hago dashboards con React y me interesan los agentes de IA",
    );
    expect(set.source).toBe("local");
    expect(set.suggestions.map((s) => s.label)).toContain("Agentes y LLM");
  });
  it("local suggester says when nothing matches", () => {
    expect(suggestLocally("hola").suggestions).toHaveLength(0);
  });
  it("parses fenced model JSON and drops invalid topics", () => {
    const set = parseAiSuggestions(
      '```json\n{"summary":"ok","suggestions":[{"label":"A","why":"w","topics":["Machine Learning","bad topic!!","rag"],"keywords":[]},{"label":"B","topics":[],"keywords":[]}]}\n```',
    );
    expect(set?.source).toBe("ai");
    expect(set?.suggestions).toHaveLength(1);
    expect(set?.suggestions[0].spec.anyTopics).toEqual([
      "machine-learning",
      "rag",
    ]);
  });
  it("returns null for non-JSON output", () => {
    expect(parseAiSuggestions("no json")).toBeNull();
    expect(parseAiSuggestions(null)).toBeNull();
  });
});

describe("README sanitizer", () => {
  it("removes scripts, handlers, styles and dangerous URLs", () => {
    const { html } = sanitizeReadmeHtml(
      `<p onclick="x()" style="color:red">hi<script>alert(1)</script></p>
       <a href="javascript:alert(1)">a</a><a href="java&#10;script:alert(1)">b</a>
       <iframe src="https://evil.test"></iframe><svg onload="x()"></svg>
       <img src="https://evil.test/x.png" alt="evil" onerror="x()"><form action="/x"><input name="a"></form>`,
      ctx,
    );
    expect(html).not.toMatch(
      /script|onclick|onerror|onload|style=|javascript|iframe|<svg|<form|evil\.test/i,
    );
    expect(html).toContain("hi");
    expect(html).toContain("evil");
  });
  it("rewrites relative images through the asset proxy and links to the repo", () => {
    const { html, images } = sanitizeReadmeHtml(
      '<img src="img/a.png" alt="a"><a href="../LICENSE">l</a><a href="https://x.dev/y">x</a>',
      ctx,
    );
    const raw = encodeURIComponent(
      "https://raw.githubusercontent.com/o/r/main/docs/img/a.png",
    );
    expect(html).toContain(`/api/github/asset?u=${raw}`);
    expect(images).toHaveLength(1);
    expect(html).toContain('data-gh-path="LICENSE"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
  });
  it("allows only GitHub asset hosts and filters badges from the gallery", () => {
    expect(isAllowedAssetUrl("https://camo.githubusercontent.com/abc")).toBe(
      true,
    );
    expect(isAllowedAssetUrl("http://raw.githubusercontent.com/a")).toBe(false);
    expect(isAllowedAssetUrl("https://evil.test/a.png")).toBe(false);
    const { images } = sanitizeReadmeHtml(
      '<img src="https://camo.githubusercontent.com/1" data-canonical-src="https://img.shields.io/x.svg"><img src="https://camo.githubusercontent.com/2" data-canonical-src="https://example.com/shot.png">',
      ctx,
    );
    expect(galleryImages(images)).toHaveLength(1);
  });
});
