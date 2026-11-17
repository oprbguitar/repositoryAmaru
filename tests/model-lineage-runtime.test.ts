import { describe, expect, it } from "vitest";
import { AGENTS, agentsForLocalModels } from "../lib/models/agents";
import {
  DEVICE_TARGETS,
  deviceById,
  deviceFromPlatform,
  fitsDevice,
  readyFor,
} from "../lib/models/devices";
import { classifyLineage } from "../lib/models/lineage";
import { BYTES_PER_GB } from "../lib/models/memory";
import { lookupOrg } from "../lib/models/organizations";
import {
  gpuVendorFrom,
  platformFrom,
  suggestRuntimes,
} from "../lib/models/runtime";

function model(partial: {
  id: string;
  topics?: string[];
  baseModels?: string[];
  baseRelation?: string | null;
}) {
  const author = partial.id.split("/")[0];
  const org = lookupOrg(author);
  return {
    id: partial.id,
    author,
    topics: partial.topics ?? [],
    baseModels: partial.baseModels ?? [],
    baseRelation: partial.baseRelation ?? null,
    originKind: org?.kind ?? ("community" as const),
    org,
  };
}

describe("classifyLineage", () => {
  it("marks curated publishers as official", () => {
    expect(classifyLineage(model({ id: "microsoft/phi-4" })).kind).toBe(
      "official",
    );
    expect(
      classifyLineage(
        model({ id: "Qwen/Qwen3-4B-GGUF", baseModels: ["Qwen/Qwen3-4B"] }),
      ).kind,
    ).toBe("official");
  });

  it("separates third-party quantizations from fine-tunes", () => {
    const repack = classifyLineage(
      model({
        id: "unsloth/Qwen3-4B-GGUF",
        baseModels: ["Qwen/Qwen3-4B"],
        baseRelation: "quantized",
      }),
    );
    expect(repack.kind).toBe("repack");
    expect(repack.baseOrg?.name).toContain("Qwen");
    const adapted = classifyLineage(
      model({
        id: "ccore/Qwen3.5-4B-GLB-3D-Coder",
        baseModels: ["Qwen/Qwen3.5-4B"],
        baseRelation: "finetune",
      }),
    );
    expect(adapted.kind).toBe("adapted");
  });

  it("flags declared uncensored models before anything else", () => {
    const result = classifyLineage(
      model({
        id: "someone/Llama-3-8B-abliterated",
        baseModels: ["meta-llama/Meta-Llama-3-8B"],
      }),
    );
    expect(result.kind).toBe("uncensored");
    expect(result.signals).toContain("abliterated");
  });

  it("falls back to community without a base or curated org", () => {
    expect(classifyLineage(model({ id: "webAI-Official/TwIL-8B" })).kind).toBe(
      "community",
    );
  });
});

describe("runtime suggestions", () => {
  it("offers GGUF desktop runtimes with the chosen quantization", () => {
    const list = suggestRuntimes({
      repo: "Qwen/Qwen3-4B-GGUF",
      formats: ["gguf"],
      pipelineTag: "text-generation",
      quant: "Q5_K_M",
      hardware: { platform: "windows", gpuVendor: "nvidia", vramGib: 8 },
    });
    expect(list[0].id).toBe("lmstudio");
    const ollama = list.find((r) => r.id === "ollama");
    expect(ollama?.commandText).toBe(
      "ollama run hf.co/Qwen/Qwen3-4B-GGUF:Q5_K_M",
    );
    expect(list.some((r) => r.id === "vllm")).toBe(false);
  });

  it("marks vLLM as not fitting on Windows", () => {
    const list = suggestRuntimes({
      repo: "org/model",
      formats: ["safetensors"],
      pipelineTag: "text-generation",
      quant: null,
      hardware: { platform: "windows", gpuVendor: "nvidia", vramGib: 24 },
    });
    expect(list.find((r) => r.id === "vllm")?.fits).toBe(false);
  });

  it("parses platform and GPU vendor hints", () => {
    expect(platformFrom("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "windows",
    );
    expect(platformFrom("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(
      "android",
    );
    expect(gpuVendorFrom("nvidia")).toBe("nvidia");
    expect(gpuVendorFrom("")).toBeNull();
  });
});

describe("device targets", () => {
  it("limits phones to small packages and flags conversions", () => {
    const android = deviceById("android");
    const small = {
      formats: ["safetensors" as const],
      estimatedPackageBytes: 2 * BYTES_PER_GB,
    };
    const big = {
      formats: ["gguf" as const],
      estimatedPackageBytes: 5 * BYTES_PER_GB,
    };
    expect(fitsDevice(small, android)).toBe(true);
    expect(readyFor(small, android)).toBe(false);
    expect(fitsDevice(big, android)).toBe(false);
    expect(fitsDevice({ estimatedPackageBytes: null }, android)).toBe(false);
  });

  it("preselects only phone platforms", () => {
    expect(deviceFromPlatform("android")).toBe("android");
    expect(deviceFromPlatform("windows")).toBeNull();
    expect(DEVICE_TARGETS.map((d) => d.id)).toContain("web");
  });
});

describe("agent catalog", () => {
  it("separates cloud custody from offline-capable agents", () => {
    expect(AGENTS.find((a) => a.id === "claude-code")?.custody).toBe("cloud");
    expect(agentsForLocalModels().every((a) => a.custody !== "cloud")).toBe(
      true,
    );
  });
});
