import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeArxivXml,
  normalizeBcrp,
  normalizeCrossref,
  normalizeGeminiModels,
  normalizeGitHub,
  normalizeHuggingFace,
  normalizeOfficialFeed,
  normalizeOpenAlex,
  normalizeOpenRouter,
  normalizeSecSubmissions,
} from "../lib/external/normalizers";

const now = "2026-07-19T04:00:00.000Z";

describe("external source normalization", () => {
  it("normalizes the OpenRouter public model contract without inventing pricing", () => {
    const [record] = normalizeOpenRouter(
      {
        data: [
          {
            id: "openai/test",
            name: "Test",
            context_length: 128000,
            pricing: { prompt: "0.000001", completion: "0.000002" },
            supported_parameters: ["tools"],
          },
        ],
      },
      now,
    );
    expect(record.data).toMatchObject({
      apiIdentifier: "openai/test",
      contextLength: 128000,
      toolCalling: true,
    });
    expect(record.originalUrl).toContain("openrouter.ai");
  });

  it("normalizes Hugging Face models and explicit license tags", () => {
    const [record] = normalizeHuggingFace(
      [
        {
          id: "org/model",
          author: "org",
          tags: ["license:apache-2.0"],
          downloads: 12,
          likes: 3,
          private: false,
        },
      ],
      "model",
      now,
    );
    expect(record.data).toMatchObject({
      license: "apache-2.0",
      downloads: 12,
      localAvailability: true,
    });
  });

  it("normalizes arXiv Atom entries as provisional preprints", () => {
    const [record] = normalizeArxivXml(
      `<?xml version="1.0"?><feed><entry><id>https://arxiv.org/abs/2607.00001</id><title>Real paper</title><summary>Evidence</summary><published>2026-07-01T00:00:00Z</published><author><name>A. Author</name></author><category term="cs.AI"/><link title="pdf" href="https://arxiv.org/pdf/2607.00001"/></entry></feed>`,
      now,
    );
    expect(record.verificationStatus).toBe("provisional");
    expect(record.data).toMatchObject({
      peerReviewed: false,
      arxivId: "2607.00001",
    });
  });

  it("normalizes OpenAlex academic metadata", () => {
    const [record] = normalizeOpenAlex(
      {
        results: [
          {
            id: "https://openalex.org/W1",
            title: "Work",
            publication_date: "2026-01-02",
            cited_by_count: 4,
            primary_location: {
              landing_page_url: "https://example.org/work",
              source: { display_name: "Journal" },
            },
            open_access: { is_oa: true },
            authorships: [
              { author: { display_name: "Author" }, countries: ["PE"] },
            ],
          },
        ],
      },
      now,
    );
    expect(record.countryRegion).toBe("PE");
    expect(record.data).toMatchObject({ citationCount: 4, openAccess: true });
  });

  it("normalizes Crossref DOI records", () => {
    const [record] = normalizeCrossref(
      {
        message: {
          items: [
            {
              DOI: "10.1000/test",
              title: ["DOI work"],
              URL: "https://doi.org/10.1000/test",
              published: { "date-parts": [[2026, 2, 1]] },
              author: [{ given: "A", family: "B" }],
            },
          ],
        },
      },
      now,
    );
    expect(record.externalId).toBe("10.1000/test");
    expect(record.data.authors).toEqual(["A B"]);
  });

  it("normalizes GitHub repository snapshots without fake growth", () => {
    const [record] = normalizeGitHub(
      {
        items: [
          {
            full_name: "org/repo",
            html_url: "https://github.com/org/repo",
            owner: { login: "org" },
            stargazers_count: 10,
            forks_count: 2,
            open_issues_count: 1,
            topics: ["llm"],
          },
        ],
      },
      now,
    );
    expect(record.data).toMatchObject({ stars: 10, forks: 2, openIssues: 1 });
    expect(record.data).not.toHaveProperty("growth");
  });

  it("normalizes official RSS records as verified news", () => {
    const [record] = normalizeOfficialFeed(
      `<rss><channel><item><guid>1</guid><title>Official update</title><link>https://example.com/update</link><pubDate>Sat, 18 Jul 2026 00:00:00 GMT</pubDate></item></channel></rss>`,
      { id: "official-news", name: "Official", baseUrl: "https://example.com" },
      now,
    );
    expect(record.verificationStatus).toBe("verified");
    expect(record.data.officialSource).toBe(true);
  });

  it("normalizes SEC filings and BCRP observations", () => {
    const [filing] = normalizeSecSubmissions(
      {
        cik: "0001045810",
        name: "NVIDIA CORP",
        filings: {
          recent: {
            accessionNumber: ["0001-26-000001"],
            form: ["8-K"],
            filingDate: ["2026-07-18"],
            primaryDocument: ["filing.htm"],
          },
        },
      },
      now,
    );
    const [indicator] = normalizeBcrp(
      { periods: [{ name: "18.Jul.26", values: [{ value: "3.55" }] }] },
      now,
    );
    expect(filing.data.form).toBe("8-K");
    expect(indicator.data).toMatchObject({ value: "3.55", unit: "S/ por US$" });
  });

  it("normalizes configured Gemini model discovery without adding prices", () => {
    const [record] = normalizeGeminiModels(
      {
        models: [
          {
            name: "models/gemini-test",
            displayName: "Gemini Test",
            inputTokenLimit: 1000,
            outputTokenLimit: 100,
            supportedGenerationMethods: ["generateContent"],
          },
        ],
      },
      now,
    );
    expect(record.data).toMatchObject({
      apiIdentifier: "gemini-test",
      contextLength: 1000,
      inputPricePerToken: null,
    });
  });

  it("contains no fictional profile identity or known placeholder metrics", () => {
    const source = [
      readFileSync("src/components/layout/AppShell.tsx", "utf8"),
      readFileSync("src/features/today/TodayPage.tsx", "utf8"),
    ].join("\n");
    for (const forbidden of [
      "Ana P.",
      "Investigador",
      ">AP<",
      "128 / 128",
      "68/100",
      "$1,037.89",
    ])
      expect(source).not.toContain(forbidden);
  });
});
