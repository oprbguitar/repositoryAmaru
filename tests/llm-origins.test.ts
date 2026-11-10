import { describe, expect, it } from "vitest";
import {
  aggregateLlmOrigins,
  familyOf,
  looksLikeMoe,
  type ModelInput,
} from "../lib/geo/llm-origins";

const or = (id: string, extra: Record<string, unknown> = {}): ModelInput => ({
  source: "openrouter",
  externalId: id,
  data: {
    apiIdentifier: id,
    architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    ...extra,
  },
});

describe("llm origins", () => {
  it("derives families and MoE heuristics", () => {
    expect(familyOf("gpt-4o-mini")).toBe("gpt");
    expect(familyOf("qwen3-235b-a22b")).toBe("qwen");
    expect(looksLikeMoe("qwen3-235b-a22b")).toBe(true);
    expect(looksLikeMoe("llama-3.1-70b")).toBe(false);
  });
  it("aggregates by country, dedupes sources and skips aliases and unknown authors", () => {
    const result = aggregateLlmOrigins(
      [
        or("deepseek/deepseek-r1", {
          huggingFaceId: "deepseek-ai/DeepSeek-R1",
          supportedParameters: ["reasoning"],
        }),
        or("deepseek/deepseek-chat"),
        or("~deepseek/latest"),
        or("openai/gpt-4o", { contextLength: 128000 }),
        or("nobody/model"),
        {
          source: "gemini-api",
          externalId: "models/gemini-2.5-pro",
          data: { apiIdentifier: "gemini-2.5-pro" },
        },
        or("google/gemini-2.5-pro", { contextLength: 1000000 }),
      ],
      [{ id: "deepseek", name: "DeepSeek", country: "China" }],
    );
    const cn = result.countries.find((c) => c.countryCode === "CN");
    expect(cn?.models).toBe(2);
    expect(cn?.open).toBe(1);
    expect(cn?.traits.reasoning).toBe(1);
    const google = result.orgs.find((o) => o.id === "google");
    expect(google?.models).toBe(1);
    expect(google?.traits.longContext).toBe(1);
    expect(result.totals.unmappedModels).toBe(1);
    expect(
      result.orgs.find((o) => o.id === "deepseek")?.provider?.consistent,
    ).toBe(true);
  });
});
