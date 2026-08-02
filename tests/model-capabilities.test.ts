import { describe, expect, it } from "vitest";
import {
  type CapabilityTag,
  deriveCapabilityTags,
  describePrimaryUse,
  tagMatchesQuery,
} from "../lib/models/capabilities";
import {
  authorPrefixesFor,
  hostNamesFor,
  isAggregator,
} from "../lib/models/provider-identity";

function ids(tags: CapabilityTag[]): string[] {
  return tags.map((tag) => tag.id);
}

describe("deriveCapabilityTags", () => {
  it("returns nothing when the sources published nothing", () => {
    expect(deriveCapabilityTags({})).toEqual([]);
  });

  it("emits usage tags only for categories the model actually ranks in", () => {
    const tags = deriveCapabilityTags({
      rankings: [
        { rankingType: "category-programming", position: 3 },
        { rankingType: "category-science", position: 11 },
      ],
    });
    expect(ids(tags)).toEqual(["uso-programacion", "uso-ciencia"]);
    expect(tags[0].evidence).toContain("#3");
    expect(tags[0].evidence).toContain("programming");
  });

  it("orders usage tags by best ranking position", () => {
    const tags = deriveCapabilityTags({
      rankings: [
        { rankingType: "category-translation", position: 9 },
        { rankingType: "category-programming", position: 2 },
      ],
    });
    expect(ids(tags)).toEqual(["uso-programacion", "uso-traduccion"]);
  });

  it("does not duplicate a category ranked on several dates", () => {
    const tags = deriveCapabilityTags({
      rankings: [
        { rankingType: "category-programming", position: 4 },
        { rankingType: "category-programming", position: 6 },
      ],
    });
    expect(ids(tags)).toEqual(["uso-programacion"]);
  });

  it("derives modality tags from declared architecture modalities", () => {
    const tags = deriveCapabilityTags({
      inputModalities: ["text", "image", "audio"],
      outputModalities: ["text", "image"],
    });
    expect(ids(tags)).toEqual([
      "modalidad-vision",
      "modalidad-audio",
      "salida-imagen",
    ]);
  });

  it("ignores modalities the catalog does not classify", () => {
    expect(
      deriveCapabilityTags({ inputModalities: ["text", "hologram"] }),
    ).toEqual([]);
  });

  it("derives capability tags from supported parameters", () => {
    const tags = deriveCapabilityTags({
      supportedParameters: ["tools", "response_format", "reasoning"],
    });
    expect(ids(tags)).toEqual([
      "capacidad-herramientas",
      "capacidad-estructurada",
      "capacidad-razonamiento",
    ]);
  });

  it("flags long context only above the stated threshold", () => {
    expect(ids(deriveCapabilityTags({ contextLength: 199_999 }))).toEqual([]);
    const tags = deriveCapabilityTags({ contextLength: 1_000_000 });
    expect(ids(tags)).toEqual(["capacidad-contexto-largo"]);
    expect(tags[0].evidence).toContain("1 000 000");
  });

  it("flags zero-cost access only when both prices are zero", () => {
    expect(
      ids(
        deriveCapabilityTags({
          inputPricePerToken: 0,
          outputPricePerToken: 0.000002,
        }),
      ),
    ).toEqual([]);
    expect(
      ids(
        deriveCapabilityTags({ inputPricePerToken: 0, outputPricePerToken: 0 }),
      ),
    ).toEqual(["acceso-sin-costo"]);
  });

  it("does not flag zero-cost when prices are missing", () => {
    expect(
      ids(
        deriveCapabilityTags({
          inputPricePerToken: null,
          outputPricePerToken: null,
        }),
      ),
    ).toEqual([]);
  });

  it("cites the Hugging Face id when weights are published", () => {
    const tags = deriveCapabilityTags({
      huggingFaceId: "meta-llama/Llama-3-8B",
    });
    expect(ids(tags)).toEqual(["acceso-pesos-abiertos"]);
    expect(tags[0].evidence).toContain("meta-llama/Llama-3-8B");
  });
});

describe("describePrimaryUse", () => {
  it("returns null when there is no evidence", () => {
    expect(describePrimaryUse([])).toBeNull();
  });

  it("summarises usage, modalities and capabilities", () => {
    const tags = deriveCapabilityTags({
      rankings: [{ rankingType: "category-programming", position: 1 }],
      inputModalities: ["image"],
      supportedParameters: ["tools"],
    });
    const summary = describePrimaryUse(tags);
    expect(summary).toContain("programación");
    expect(summary).toContain("visión");
    expect(summary).toContain("tool calling");
  });

  it("summarises access-only models without usage data", () => {
    expect(
      describePrimaryUse(deriveCapabilityTags({ huggingFaceId: "x/y" })),
    ).toBe(null);
  });
});

describe("tagMatchesQuery", () => {
  const tag = deriveCapabilityTags({
    rankings: [{ rankingType: "category-programming", position: 1 }],
  })[0];

  it("matches ignoring case and accents", () => {
    expect(tagMatchesQuery(tag, "PROGRAMACION")).toBe(true);
    expect(tagMatchesQuery(tag, "programación")).toBe(true);
  });

  it("matches everything on an empty query", () => {
    expect(tagMatchesQuery(tag, "  ")).toBe(true);
  });

  it("rejects unrelated terms", () => {
    expect(tagMatchesQuery(tag, "audio")).toBe(false);
  });
});

describe("provider identity", () => {
  it("maps observatory providers to OpenRouter vendor prefixes", () => {
    expect(authorPrefixesFor("google-gemini")).toEqual(["google"]);
    expect(authorPrefixesFor("mistral")).toContain("mistralai");
  });

  it("falls back to the provider id for unknown vendors", () => {
    expect(authorPrefixesFor("unknown-vendor")).toEqual(["unknown-vendor"]);
  });

  it("maps providers to the host names used by endpoint offerings", () => {
    expect(hostNamesFor("deepinfra", "DeepInfra")).toEqual(["deepinfra"]);
    expect(hostNamesFor("google-gemini", "Google Gemini")).toContain(
      "google ai studio",
    );
  });

  it("falls back to the lowercased provider name for unknown hosts", () => {
    expect(hostNamesFor("acme", "ACME Cloud")).toEqual(["acme cloud"]);
  });

  it("classifies inference hosts as aggregators", () => {
    expect(isAggregator("groq")).toBe(true);
    expect(isAggregator("anthropic")).toBe(false);
  });
});
