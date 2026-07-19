import { describe, expect, it } from "vitest";
import {
  categoryRanking,
  computeCatalogRankings,
  parseCatalogModels,
  parseModelOfferings,
} from "../lib/external/rankings";
import {
  enrichVideoDetails,
  normalizeYouTubePlaylist,
  normalizeYouTubeSearch,
  parseIsoDuration,
} from "../lib/external/videos";
import { aggregateCountries, buildGlobalGeoJson } from "../lib/geo/aggregate";
import { countryCodeFromValue } from "../lib/geo/countries";
import { type ProjectInputs, recommend } from "../lib/laboratory/engine";

const catalogFixture = {
  data: [
    {
      id: "acme/cheap-model",
      name: "Cheap",
      created: 1_700_000_000,
      context_length: 32_000,
      hugging_face_id: "acme/cheap-model",
      pricing: { prompt: "0.0000001", completion: "0.0000002" },
      architecture: { input_modalities: ["text"] },
    },
    {
      id: "acme/big-model",
      name: "Big",
      created: 1_780_000_000,
      context_length: 1_000_000,
      pricing: { prompt: "0.000002", completion: "0.000008" },
      architecture: { input_modalities: ["text", "image"] },
    },
    {
      id: "acme/free-model:free",
      name: "Free",
      created: 1_760_000_000,
      context_length: 8_000,
      pricing: { prompt: "0", completion: "0" },
      architecture: { input_modalities: ["text"] },
    },
  ],
};

describe("rankings de modelos (OpenRouter)", () => {
  it("normaliza precios a USD por millón", () => {
    const models = parseCatalogModels(catalogFixture);
    expect(models[0].promptPricePerMillion).toBeCloseTo(0.1);
    expect(models[1].completionPricePerMillion).toBeCloseTo(8);
  });

  it("calcula órdenes deterministas con metodología visible", () => {
    const models = parseCatalogModels(catalogFixture);
    const rankings = computeCatalogRankings(models);
    const newest = rankings.filter((entry) => entry.rankingType === "newest");
    expect(newest[0].modelExternalId).toBe("acme/big-model");
    const pricing = rankings.filter(
      (entry) => entry.rankingType === "pricing-low",
    );
    // El modelo gratuito no entra en pricing-low (precio 0 no es comparable)
    expect(pricing.map((entry) => entry.modelExternalId)).toEqual([
      "acme/cheap-model",
      "acme/big-model",
    ]);
    const context = rankings.filter(
      (entry) => entry.rankingType === "context-high",
    );
    expect(context[0].modelExternalId).toBe("acme/big-model");
    expect(context[0].score).toBe(1_000_000);
    const free = rankings.filter((entry) => entry.rankingType === "free-api");
    expect(free.map((entry) => entry.modelExternalId)).toContain(
      "acme/free-model:free",
    );
    const multimodal = rankings.filter(
      (entry) => entry.rankingType === "multimodal",
    );
    expect(multimodal.map((entry) => entry.modelExternalId)).toEqual([
      "acme/big-model",
    ]);
    const openLocal = rankings.filter(
      (entry) => entry.rankingType === "open-local",
    );
    expect(openLocal.map((entry) => entry.modelExternalId)).toEqual([
      "acme/cheap-model",
    ]);
    expect(newest[0].methodology).toContain("catálogo público de OpenRouter");
  });

  it("preserva el orden de uso del ranking por categoría", () => {
    const entries = categoryRanking(catalogFixture, "category-programming");
    expect(entries[0].rankingPosition).toBe(1);
    expect(entries[0].modelExternalId).toBe("acme/cheap-model");
    expect(entries[0].methodology).toContain("category");
  });

  it("normaliza ofertas por proveedor sin fusionar precios", () => {
    const offerings = parseModelOfferings({
      data: {
        id: "acme/big-model",
        name: "Big",
        endpoints: [
          {
            name: "ProviderA | acme/big-model",
            provider_name: "ProviderA",
            context_length: 500_000,
            pricing: { prompt: "0.000001", completion: "0.000004" },
          },
          {
            name: "ProviderB | acme/big-model",
            provider_name: "ProviderB",
            context_length: 1_000_000,
            pricing: { prompt: "0.000002", completion: "0.000006" },
          },
        ],
      },
    });
    expect(offerings).toHaveLength(2);
    expect(offerings[0].inputPricePerMillion).toBeCloseTo(1);
    expect(offerings[1].inputPricePerMillion).toBeCloseTo(2);
    expect(offerings[0].providerName).not.toBe(offerings[1].providerName);
  });
});

describe("normalización de YouTube", () => {
  it("convierte resultados de búsqueda y descarta items sin videoId", () => {
    const videos = normalizeYouTubeSearch(
      {
        items: [
          {
            id: { videoId: "abc123" },
            snippet: {
              title: "RAG tutorial",
              channelId: "UCX",
              channelTitle: "Canal",
              publishedAt: "2026-01-01T00:00:00Z",
              thumbnails: { medium: { url: "https://i.ytimg.com/x.jpg" } },
            },
          },
          { id: { kind: "youtube#channel" } },
        ],
      },
      "Programación con IA",
      "programming",
      "en",
    );
    expect(videos).toHaveLength(1);
    expect(videos[0].watchUrl).toBe("https://www.youtube.com/watch?v=abc123");
    expect(videos[0].thumbnailUrl).toContain("i.ytimg.com");
  });

  it("normaliza playlists de subidas de canales oficiales", () => {
    const videos = normalizeYouTubePlaylist(
      {
        items: [
          {
            snippet: {
              title: "Release",
              channelId: "UCY",
              channelTitle: "Oficial",
              resourceId: { videoId: "zzz" },
            },
          },
        ],
      },
      "Canal oficial",
      "channel-yt-test",
    );
    expect(videos[0].externalId).toBe("zzz");
  });

  it("parsea duraciones ISO-8601 y enriquece detalles", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT15M")).toBe(900);
    expect(parseIsoDuration("bad")).toBeNull();
    const enriched = enrichVideoDetails(
      normalizeYouTubeSearch(
        {
          items: [
            {
              id: { videoId: "abc123" },
              snippet: { title: "t", channelTitle: "c" },
            },
          ],
        },
        "tema",
        "grupo",
        null,
      ),
      {
        items: [
          {
            id: "abc123",
            contentDetails: { duration: "PT10M" },
            statistics: { viewCount: "1234" },
          },
        ],
      },
    );
    expect(enriched[0].durationSeconds).toBe(600);
    expect(enriched[0].viewCount).toBe(1234);
  });
});

describe("agregación geográfica", () => {
  it("mapea nombres en español e ISO-2 a códigos", () => {
    expect(countryCodeFromValue("Perú")).toBe("PE");
    expect(countryCodeFromValue("pe")).toBe("PE");
    expect(countryCodeFromValue("Estados Unidos")).toBe("US");
    expect(countryCodeFromValue("Atlántida")).toBeNull();
  });

  it("agrega registros por país sin inventar valores", () => {
    const aggregates = aggregateCountries({
      paperCountries: ["PE", "PE", "BR"],
      providerCountries: [{ country: "Estados Unidos", models: 12 }],
      institutionCountries: ["PE"],
      newsCountries: [],
    });
    const peru = aggregates.find((entry) => entry.countryCode === "PE");
    expect(peru?.papers).toBe(2);
    expect(peru?.institutions).toBe(1);
    const us = aggregates.find((entry) => entry.countryCode === "US");
    expect(us?.providers).toBe(1);
    expect(us?.models).toBe(12);
  });

  it("genera GeoJSON solo con países con registros e instituciones con coordenadas", () => {
    const aggregates = aggregateCountries({
      paperCountries: ["PE"],
      providerCountries: [],
      institutionCountries: [],
      newsCountries: [],
    });
    const geojson = buildGlobalGeoJson(aggregates, [
      {
        id: "1",
        name: "UNI",
        countryCode: "PE",
        city: "Lima",
        latitude: -12.0,
        longitude: -77.0,
        worksCount: 100,
        homepageUrl: null,
        sourceName: "OpenAlex",
      },
    ]);
    expect(geojson.features).toHaveLength(2);
    const kinds = geojson.features.map((feature) => feature.properties.kind);
    expect(kinds).toContain("country");
    expect(kinds).toContain("institution");
  });
});

const baseInputs: ProjectInputs = {
  name: "Prueba",
  problem: "Clasificar expedientes",
  domain: "Legal",
  region: "Perú",
  users: {
    internal: true,
    external: false,
    estimatedCount: 5,
    technicalLevel: "basic",
    languages: ["es"],
  },
  dataTypes: ["PDF"],
  dailyVolumeDocuments: 10,
  averageDocumentPages: 5,
  sensitiveData: false,
  personalData: false,
  privacy: "public_cloud",
  monthlyBudgetUsd: 50,
  freeOnly: false,
  hardware: {
    cpu: "Ryzen",
    ramGb: 32,
    gpu: "RTX 3060",
    vramGb: 12,
    storageGb: 1000,
    os: "Windows",
    dockerAvailable: true,
  },
  expectedResults: ["rag"],
};

describe("motor de recomendación del laboratorio", () => {
  const context = {
    offerings: [
      {
        modelExternalId: "acme/cheap",
        modelTitle: "Cheap",
        providerName: "ProviderA",
        inputPricePerMillion: 0.1,
        outputPricePerMillion: 0.2,
        contextLength: 128_000,
        verifiedAt: "2026-07-18T00:00:00Z",
      },
      {
        modelExternalId: "acme/big",
        modelTitle: "Big",
        providerName: "ProviderB",
        inputPricePerMillion: 2,
        outputPricePerMillion: 8,
        contextLength: 1_000_000,
        verifiedAt: "2026-07-18T00:00:00Z",
      },
    ],
    openModels: [
      {
        externalId: "open/model",
        title: "Open Model",
        sourceName: "Hugging Face Hub",
        license: "apache-2.0",
        url: "https://huggingface.co/open/model",
      },
    ],
    repositories: [
      {
        externalId: "org/rag-tool",
        title: "org/rag-tool",
        stars: 5000,
        topics: ["rag"],
        url: "https://github.com/org/rag-tool",
      },
    ],
  };

  it("genera tres alternativas con costos desde precios indexados", () => {
    const alternatives = recommend(baseInputs, context);
    expect(alternatives.map((entry) => entry.kind)).toEqual([
      "economic",
      "local",
      "professional",
    ]);
    const economic = alternatives[0];
    expect(economic.models[0].id).toBe("acme/cheap");
    // 10 docs × 5 páginas × 600 tokens × 22 días = 0.66M entrada; salida 0.165M
    expect(economic.costItems[0].monthlyUsd).toBeCloseTo(
      0.66 * 0.1 + 0.165 * 0.2,
      2,
    );
    expect(economic.costComplete).toBe(true);
    const professional = alternatives[2];
    expect(professional.models[0].id).toBe("acme/big");
  });

  it("marca costo parcial cuando no hay precios indexados", () => {
    const alternatives = recommend(baseInputs, {
      offerings: [],
      openModels: [],
      repositories: [],
    });
    expect(alternatives[0].costComplete).toBe(false);
    expect(alternatives[0].models).toHaveLength(0);
    expect(alternatives[0].explanation.missingInformation.join(" ")).toContain(
      "No hay ofertas de precios indexadas",
    );
  });

  it("la arquitectura cambia según el resultado esperado", () => {
    const rag = recommend(baseInputs, context)[0];
    expect(rag.architecture).toContain("Base vectorial");
    const voice = recommend(
      { ...baseInputs, expectedResults: ["voice"] },
      context,
    )[0];
    expect(voice.architecture).toContain("Speech-to-text");
    expect(voice.architecture).not.toContain("Base vectorial");
  });

  it("respeta la restricción de privacidad local en la explicación", () => {
    const alternatives = recommend(
      { ...baseInputs, privacy: "confidential" },
      context,
    );
    expect(alternatives[0].risks.join(" ")).toContain("Incompatible");
    expect(alternatives[1].privacyLevel).toContain("Local");
  });
});
