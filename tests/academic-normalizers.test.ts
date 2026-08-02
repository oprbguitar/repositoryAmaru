import { describe, expect, it } from "vitest";
import {
  normalizeCore,
  normalizeDblp,
  normalizeDoaj,
  normalizeEuropePmc,
  normalizeSemanticScholar,
} from "../lib/external/academic";
import { normalizeCrossref } from "../lib/external/normalizers";

const now = "2026-08-02T00:00:00Z";

describe("Europe PMC", () => {
  it("divide authorString y respeta lo que la fuente no informa", () => {
    const records = normalizeEuropePmc(
      {
        resultList: {
          result: [
            {
              id: "42509078",
              source: "MED",
              pmid: "42509078",
              doi: "10.1016/j.landig.2026.101007",
              title: "MerMED-FM: Multimodal Medical Imaging Foundation Model.",
              authorString: "Zhou Y, Quek CWN, Ting DSW.",
              journalTitle: "Lancet Digit Health",
              firstPublicationDate: "2026-06-12",
              pubYear: "2026",
              language: "eng",
              isOpenAccess: "N",
              pubTypeList: { pubType: ["Journal Article"] },
            },
          ],
        },
      },
      now,
    );
    expect(records).toHaveLength(1);
    expect(records[0].externalId).toBe("MED:42509078");
    expect(records[0].originalUrl).toBe(
      "https://europepmc.org/article/MED/42509078",
    );
    expect(records[0].data.authors).toEqual(["Zhou Y", "Quek CWN", "Ting DSW"]);
    expect(records[0].data.openAccess).toBe(false);
    // Sin abstractText no se fabrica un resumen.
    expect(records[0].summary).toBeNull();
    expect(records[0].publishedAt).toBe("2026-06-12T00:00:00.000Z");
  });

  it("cae al año cuando no hay fecha completa", () => {
    const records = normalizeEuropePmc(
      { resultList: { result: [{ id: "1", source: "MED", pubYear: "2024" }] } },
      now,
    );
    expect(records[0].publishedAt).toBe("2024-01-01");
  });
});

describe("DOAJ", () => {
  it("compone la fecha con año y mes y extrae DOI y texto completo", () => {
    const records = normalizeDoaj(
      {
        results: [
          {
            id: "00001d35ee6a4be2b00522ba742b13fb",
            bibjson: {
              title: "Path planning approaches for multi-robot systems",
              abstract: "Revisión de enfoques clásicos y heurísticos.",
              year: "2025",
              month: "3",
              identifier: [
                { id: "2577-8196", type: "eissn" },
                { id: "10.1002/eng2.13035", type: "doi" },
              ],
              link: [{ type: "fulltext", url: "https://doi.org/10.1002/x" }],
              journal: {
                title: "Engineering Reports",
                publisher: "Wiley",
                country: "GB",
                language: ["EN"],
              },
              author: [{ name: "Semonti Banik" }],
              keywords: ["artificial intelligence", "path planning"],
            },
          },
        ],
      },
      now,
    );
    expect(records[0].publishedAt).toBe("2025-03-01");
    expect(records[0].data.doi).toBe("10.1002/eng2.13035");
    expect(records[0].originalUrl).toBe("https://doi.org/10.1002/x");
    expect(records[0].countryRegion).toBe("GB");
    expect(records[0].data.openAccess).toBe(true);
  });
});

describe("DBLP", () => {
  it("normaliza el tipo, quita el sufijo de desambiguación y acepta un autor suelto", () => {
    const records = normalizeDblp(
      {
        result: {
          hits: {
            hit: {
              info: {
                key: "journals/gis/YuLGNGLX26",
                title: "LLMTrajQuery: semantic trajectory queries.",
                authors: { author: { "@pid": "13/8698-1", text: "Xu 0001" } },
                venue: "Int. J. Geogr. Inf. Sci.",
                year: "2026",
                type: "Journal Articles",
                access: "closed",
                doi: "10.1080/13658816.2025.2569745",
                url: "https://dblp.org/rec/journals/gis/YuLGNGLX26",
              },
            },
          },
        },
      },
      now,
    );
    expect(records).toHaveLength(1);
    expect(records[0].data.authors).toEqual(["Xu"]);
    expect(records[0].data.evidenceType).toBe("journal-article");
    expect(records[0].title).toBe("LLMTrajQuery: semantic trajectory queries");
    expect(records[0].publishedAt).toBe("2026-01-01");
    // DBLP es un índice bibliográfico: no distribuye resúmenes.
    expect(records[0].summary).toBeNull();
    expect(records[0].data.openAccess).toBe(false);
  });
});

describe("Semantic Scholar", () => {
  it("toma DOI y arXiv de externalIds y marca el PDF abierto", () => {
    const records = normalizeSemanticScholar(
      {
        data: [
          {
            paperId: "abc123",
            title: "A Survey on Graph Neural Networks",
            abstract: "Resumen real de la fuente.",
            year: 2025,
            publicationDate: "2025-11-03",
            authors: [{ name: "Z. Zhang" }, { name: "Y. Liu" }],
            externalIds: { DOI: "10.1000/x", ArXiv: "2511.00001" },
            venue: "NeurIPS",
            citationCount: 42,
            publicationTypes: ["JournalArticle"],
            openAccessPdf: { url: "https://example.org/paper.pdf" },
          },
        ],
      },
      now,
    );
    expect(records[0].data.doi).toBe("10.1000/x");
    expect(records[0].data.arxivId).toBe("2511.00001");
    expect(records[0].data.citationCount).toBe(42);
    expect(records[0].data.openAccess).toBe(true);
    // «JournalArticle» se lleva al mismo vocabulario que el resto de índices.
    expect(records[0].data.evidenceType).toBe("journal-article");
  });

  it("devuelve vacío cuando la API responde un error", () => {
    expect(
      normalizeSemanticScholar({ message: "Too Many Requests" }, now),
    ).toEqual([]);
  });
});

describe("CORE", () => {
  it("usa el enlace de descarga y el idioma declarado", () => {
    const records = normalizeCore(
      {
        results: [
          {
            id: "99",
            title: "Open access study on LLM safety",
            abstract: null,
            authors: [{ name: "A. Author" }],
            publishedDate: "2026-01-15T00:00:00",
            yearPublished: 2026,
            doi: "10.5555/y",
            downloadUrl: "https://core.ac.uk/download/99.pdf",
            language: { code: "en" },
            documentType: "research",
          },
        ],
      },
      now,
    );
    expect(records[0].originalUrl).toBe("https://core.ac.uk/download/99.pdf");
    expect(records[0].language).toBe("en");
    expect(records[0].data.openAccess).toBe(true);
    expect(records[0].summary).toBeNull();
  });
});

describe("Crossref: fechas envueltas en date-parts", () => {
  it("lee published, issued o created en lugar de dejar el registro sin fecha", () => {
    const records = normalizeCrossref(
      {
        message: {
          items: [
            {
              DOI: "10.1/a",
              title: ["Sin published ni issued utilizables"],
              issued: { "date-parts": [[null]] },
              created: { "date-parts": [[2025, 2, 10]] },
            },
            {
              DOI: "10.1/b",
              title: ["Con published"],
              published: { "date-parts": [[2026, 7, 1]] },
              created: { "date-parts": [[2020, 1, 1]] },
            },
          ],
        },
      },
      now,
    );
    expect(records[0].publishedAt).toBe("2025-02-10T00:00:00.000Z");
    expect(records[1].publishedAt).toBe("2026-07-01T00:00:00.000Z");
  });
});
