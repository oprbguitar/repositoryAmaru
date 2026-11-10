/**
 * Where LLMs come from: maps model records (OpenRouter, provider APIs and
 * Hugging Face) to developer organizations and aggregates them by country.
 *
 * Mapping source: the curated registry below. Each organization carries its
 * headquarters city and an official URL, verified on `ORG_REGISTRY_VERIFIED`.
 * Models whose author is not in the registry are counted as "unmapped"; they
 * are never attributed to a country by guesswork.
 */
import { COUNTRIES } from "./countries";

export const ORG_REGISTRY_VERIFIED = "2026-11-09";

export type LlmOrg = {
  id: string;
  name: string;
  /** Lowercase author slugs as they appear in OpenRouter ids / HF authors. */
  aliases: string[];
  countryCode: string;
  city: string;
  latitude: number;
  longitude: number;
  /** Official page used as the source for the headquarters. */
  sourceUrl: string;
  /** providers.id in D1 for cross-checking the country. */
  providerId?: string;
};

const org = (
  id: string,
  name: string,
  aliases: string[],
  countryCode: string,
  city: string,
  latitude: number,
  longitude: number,
  sourceUrl: string,
  providerId?: string,
): LlmOrg => ({
  id,
  name,
  aliases,
  countryCode,
  city,
  latitude,
  longitude,
  sourceUrl,
  providerId,
});

export const LLM_ORGS: LlmOrg[] = [
  org(
    "openai",
    "OpenAI",
    ["openai"],
    "US",
    "San Francisco",
    37.77,
    -122.42,
    "https://openai.com/about/",
    "openai",
  ),
  org(
    "anthropic",
    "Anthropic",
    ["anthropic"],
    "US",
    "San Francisco",
    37.77,
    -122.42,
    "https://www.anthropic.com/company",
    "anthropic",
  ),
  org(
    "google",
    "Google / DeepMind",
    ["google", "google-deepmind"],
    "US",
    "Mountain View",
    37.39,
    -122.08,
    "https://deepmind.google/",
    "google-gemini",
  ),
  org(
    "meta",
    "Meta",
    ["meta-llama", "meta", "facebook"],
    "US",
    "Menlo Park",
    37.45,
    -122.18,
    "https://about.meta.com/",
  ),
  org(
    "microsoft",
    "Microsoft",
    ["microsoft"],
    "US",
    "Redmond",
    47.67,
    -122.12,
    "https://www.microsoft.com/",
  ),
  org(
    "nvidia",
    "NVIDIA",
    ["nvidia"],
    "US",
    "Santa Clara",
    37.37,
    -121.96,
    "https://www.nvidia.com/",
    "nvidia",
  ),
  org(
    "xai",
    "xAI",
    ["x-ai", "xai"],
    "US",
    "Palo Alto",
    37.44,
    -122.14,
    "https://x.ai/",
    "xai",
  ),
  org(
    "amazon",
    "Amazon",
    ["amazon"],
    "US",
    "Seattle",
    47.61,
    -122.33,
    "https://www.amazon.science/",
  ),
  org(
    "perplexity",
    "Perplexity",
    ["perplexity"],
    "US",
    "San Francisco",
    37.77,
    -122.42,
    "https://www.perplexity.ai/",
  ),
  org(
    "allenai",
    "Allen Institute for AI",
    ["allenai"],
    "US",
    "Seattle",
    47.65,
    -122.31,
    "https://allenai.org/",
  ),
  org(
    "ibm",
    "IBM",
    ["ibm-granite", "ibm"],
    "US",
    "Armonk",
    41.1,
    -73.72,
    "https://www.ibm.com/granite",
  ),
  org(
    "thinkingmachines",
    "Thinking Machines",
    ["thinkingmachines"],
    "US",
    "San Francisco",
    37.77,
    -122.42,
    "https://thinkingmachines.ai/",
  ),
  org(
    "liquid",
    "Liquid AI",
    ["liquid", "liquidai"],
    "US",
    "Cambridge",
    42.37,
    -71.11,
    "https://www.liquid.ai/",
  ),
  org(
    "deepcogito",
    "Deep Cogito",
    ["deepcogito"],
    "US",
    "San Francisco",
    37.77,
    -122.42,
    "https://www.deepcogito.com/",
  ),
  org(
    "huggingface",
    "Hugging Face",
    ["huggingfacetb", "huggingface"],
    "US",
    "Nueva York",
    40.71,
    -74.01,
    "https://huggingface.co/",
  ),
  org(
    "cohere",
    "Cohere",
    ["cohere", "cohereforai", "coherelabs"],
    "CA",
    "Toronto",
    43.65,
    -79.38,
    "https://cohere.com/",
    "cohere",
  ),
  org(
    "mistral",
    "Mistral AI",
    ["mistralai"],
    "FR",
    "París",
    48.86,
    2.35,
    "https://mistral.ai/",
    "mistral",
  ),
  org(
    "stability",
    "Stability AI",
    ["stabilityai"],
    "GB",
    "Londres",
    51.51,
    -0.13,
    "https://stability.ai/",
  ),
  org(
    "aleph-alpha",
    "Aleph Alpha",
    ["aleph-alpha"],
    "DE",
    "Heidelberg",
    49.4,
    8.67,
    "https://aleph-alpha.com/",
  ),
  org(
    "bfl",
    "Black Forest Labs",
    ["black-forest-labs"],
    "DE",
    "Friburgo",
    47.99,
    7.85,
    "https://bfl.ai/",
  ),
  org(
    "ai21",
    "AI21 Labs",
    ["ai21", "ai21labs"],
    "IL",
    "Tel Aviv",
    32.08,
    34.78,
    "https://www.ai21.com/",
  ),
  org(
    "tii",
    "Technology Innovation Institute",
    ["tiiuae"],
    "AE",
    "Abu Dabi",
    24.45,
    54.38,
    "https://www.tii.ae/",
  ),
  org(
    "deepseek",
    "DeepSeek",
    ["deepseek", "deepseek-ai"],
    "CN",
    "Hangzhou",
    30.27,
    120.16,
    "https://www.deepseek.com/",
    "deepseek",
  ),
  org(
    "alibaba",
    "Alibaba (Qwen)",
    ["qwen", "alibaba-nlp"],
    "CN",
    "Hangzhou",
    30.27,
    120.16,
    "https://qwen.ai/",
  ),
  org(
    "antgroup",
    "Ant Group (inclusionAI)",
    ["inclusionai"],
    "CN",
    "Hangzhou",
    30.27,
    120.16,
    "https://inclusionai.github.io/",
  ),
  org(
    "zhipu",
    "Zhipu AI (Z.ai)",
    ["z-ai", "zai-org", "thudm"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://z.ai/",
  ),
  org(
    "moonshot",
    "Moonshot AI",
    ["moonshotai"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://www.moonshot.ai/",
  ),
  org(
    "bytedance",
    "ByteDance Seed",
    ["bytedance", "bytedance-seed"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://seed.bytedance.com/",
  ),
  org(
    "baidu",
    "Baidu",
    ["baidu"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://www.baidu.com/",
  ),
  org(
    "xiaomi",
    "Xiaomi",
    ["xiaomi", "xiaomimimo"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://www.mi.com/",
  ),
  org(
    "meituan",
    "Meituan (LongCat)",
    ["meituan", "meituan-longcat"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://longcat.chat/",
  ),
  org(
    "01ai",
    "01.AI",
    ["01-ai"],
    "CN",
    "Pekín",
    39.9,
    116.4,
    "https://www.01.ai/",
  ),
  org(
    "minimax",
    "MiniMax",
    ["minimax", "minimaxai"],
    "CN",
    "Shanghái",
    31.23,
    121.47,
    "https://www.minimax.io/",
  ),
  org(
    "stepfun",
    "StepFun",
    ["stepfun", "stepfun-ai"],
    "CN",
    "Shanghái",
    31.23,
    121.47,
    "https://www.stepfun.com/",
  ),
  org(
    "shanghai-ai-lab",
    "Shanghai AI Laboratory",
    ["internlm"],
    "CN",
    "Shanghái",
    31.23,
    121.47,
    "https://internlm.intern-ai.org.cn/",
  ),
  org(
    "tencent",
    "Tencent",
    ["tencent"],
    "CN",
    "Shenzhen",
    22.54,
    114.06,
    "https://www.tencent.com/",
  ),
  org(
    "upstage",
    "Upstage",
    ["upstage"],
    "KR",
    "Seúl",
    37.57,
    126.98,
    "https://www.upstage.ai/",
  ),
  org(
    "lg",
    "LG AI Research",
    ["lgai-exaone"],
    "KR",
    "Seúl",
    37.57,
    126.98,
    "https://www.lgresearch.ai/",
  ),
  org(
    "sakana",
    "Sakana AI",
    ["sakana"],
    "JP",
    "Tokio",
    35.68,
    139.69,
    "https://sakana.ai/",
  ),
  org(
    "sarvam",
    "Sarvam AI",
    ["sarvamai"],
    "IN",
    "Bengaluru",
    12.97,
    77.59,
    "https://www.sarvam.ai/",
  ),
];

const ALIAS_INDEX = new Map<string, LlmOrg>();
for (const entry of LLM_ORGS) {
  for (const alias of entry.aliases) ALIAS_INDEX.set(alias, entry);
}

export function resolveOrg(author: string | null | undefined): LlmOrg | null {
  if (!author) return null;
  return ALIAS_INDEX.get(author.trim().toLowerCase()) ?? null;
}

/** "gpt-4o-mini" -> "gpt", "qwen3-235b" -> "qwen", "o3-mini" -> "o3". */
export function familyOf(slug: string): string {
  const token = slug.toLowerCase().split(/[-_./:\s]/)[0] ?? slug;
  const stripped = token.replace(/\d.*$/, "");
  return stripped.length >= 2 ? stripped : token;
}

/** MoE names: "mixtral-8x7b", "qwen3-235b-a22b", or an explicit "moe". */
export function looksLikeMoe(slug: string): boolean {
  return /(\d+x\d+b|-a\d+(\.\d+)?b|\bmoe\b|-moe)/i.test(slug);
}

export const LONG_CONTEXT_TOKENS = 200_000;

export type ModelInput = {
  source: "openrouter" | "gemini-api" | "mistral-api" | "hugging-face";
  externalId: string;
  data: Record<string, unknown>;
};

export type Traits = {
  reasoning: boolean;
  multimodal: boolean;
  longContext: boolean;
  moe: boolean;
  tools: boolean;
};

export const TRAIT_KEYS = [
  "reasoning",
  "multimodal",
  "longContext",
  "moe",
  "tools",
] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];

export type TraitCounts = Record<TraitKey, number>;

type Normalized = {
  key: string;
  org: LlmOrg;
  slug: string;
  family: string;
  title: string;
  open: boolean | null;
  /** Only OpenRouter exposes parameters and modalities. */
  traits: Traits | null;
  contextLength: number | null;
  url: string;
};

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

export function normalizeModel(input: ModelInput): Normalized | null {
  const data = input.data;
  const apiId =
    typeof data.apiIdentifier === "string"
      ? data.apiIdentifier
      : input.externalId;
  let authorSlug: string | null = null;
  let slug = apiId;
  if (input.source === "gemini-api") {
    authorSlug = "google";
    slug = apiId.replace(/^models\//, "");
  } else if (input.source === "mistral-api") {
    authorSlug = "mistralai";
  } else if (apiId.includes("/")) {
    const [author, ...rest] = apiId.split("/");
    authorSlug = author;
    slug = rest.join("/");
  }
  // "~vendor/..." are OpenRouter "latest" aliases of another entry.
  if (!authorSlug || authorSlug.startsWith("~")) return null;
  const orgEntry = resolveOrg(authorSlug);
  if (!orgEntry) return null;
  slug = slug.replace(/:.*$/, "");

  if (input.source === "hugging-face") {
    const tag = typeof data.pipelineTag === "string" ? data.pipelineTag : null;
    if (
      !tag ||
      !["text-generation", "image-text-to-text", "video-text-to-text"].includes(
        tag,
      )
    )
      return null;
  }
  const arch = (data.architecture ?? {}) as Record<string, unknown>;
  const outputs = strings(arch.output_modalities);
  if (
    input.source === "openrouter" &&
    outputs.length &&
    !outputs.includes("text")
  )
    return null;

  let open: boolean | null = null;
  if (input.source === "hugging-face") open = true;
  else if (input.source === "openrouter")
    open = typeof data.huggingFaceId === "string" && data.huggingFaceId !== "";

  const contextLength =
    typeof data.contextLength === "number" ? data.contextLength : null;
  let traits: Traits | null = null;
  if (input.source === "openrouter") {
    const params = strings(data.supportedParameters);
    const inputs = strings(arch.input_modalities);
    traits = {
      reasoning:
        params.includes("reasoning") || params.includes("include_reasoning"),
      multimodal: inputs.some((m) => m !== "text"),
      longContext: (contextLength ?? 0) >= LONG_CONTEXT_TOKENS,
      moe: looksLikeMoe(slug),
      tools: data.toolCalling === true || params.includes("tools"),
    };
  }
  const lowerSlug = slug.toLowerCase();
  return {
    key: `${orgEntry.id}/${lowerSlug}`,
    org: orgEntry,
    slug: lowerSlug,
    family: familyOf(lowerSlug),
    title: slug,
    open,
    traits,
    contextLength,
    url:
      input.source === "hugging-face"
        ? `https://huggingface.co/${apiId}`
        : input.source === "openrouter"
          ? `https://openrouter.ai/${apiId}`
          : orgEntry.sourceUrl,
  };
}

export type OrgStats = {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  city: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  models: number;
  families: number;
  open: number;
  closed: number;
  unknown: number;
  traitSample: number;
  traits: TraitCounts;
  topFamilies: Array<{ name: string; models: number }>;
  sampleModels: Array<{ title: string; open: boolean | null; url: string }>;
  provider: {
    id: string;
    name: string;
    country: string | null;
    consistent: boolean;
  } | null;
};

export type CountryStats = {
  countryCode: string;
  name: string;
  latitude: number;
  longitude: number;
  orgs: number;
  models: number;
  families: number;
  open: number;
  closed: number;
  unknown: number;
  traitSample: number;
  traits: TraitCounts;
};

export type LlmOriginsResult = {
  orgs: OrgStats[];
  countries: CountryStats[];
  totals: {
    models: number;
    orgs: number;
    countries: number;
    unmappedModels: number;
  };
};

const emptyTraits = (): TraitCounts => ({
  reasoning: 0,
  multimodal: 0,
  longContext: 0,
  moe: 0,
  tools: 0,
});

export function aggregateLlmOrigins(
  models: ModelInput[],
  providers: Array<{ id: string; name: string; country: string | null }> = [],
): LlmOriginsResult {
  const merged = new Map<string, Normalized>();
  let unmapped = 0;
  for (const input of models) {
    const normalized = normalizeModel(input);
    if (!normalized) {
      if (!String(input.data.apiIdentifier ?? input.externalId).startsWith("~"))
        unmapped += 1;
      continue;
    }
    const existing = merged.get(normalized.key);
    if (!existing) {
      merged.set(normalized.key, normalized);
      continue;
    }
    // Same model from several sources: keep openness and traits evidence.
    if (existing.open === null) existing.open = normalized.open;
    else if (normalized.open === true) existing.open = true;
    existing.traits ??= normalized.traits;
  }

  const byOrg = new Map<string, Normalized[]>();
  for (const model of merged.values()) {
    const list = byOrg.get(model.org.id) ?? [];
    list.push(model);
    byOrg.set(model.org.id, list);
  }

  const orgs: OrgStats[] = [];
  for (const [id, list] of byOrg) {
    const entry = LLM_ORGS.find((o) => o.id === id) as LlmOrg;
    const traits = emptyTraits();
    let traitSample = 0;
    const families = new Map<string, number>();
    for (const model of list) {
      families.set(model.family, (families.get(model.family) ?? 0) + 1);
      if (model.traits) {
        traitSample += 1;
        for (const key of TRAIT_KEYS) if (model.traits[key]) traits[key] += 1;
      }
    }
    const provider = providers.find((p) => p.id === entry.providerId);
    const countryName = COUNTRIES[entry.countryCode]?.name ?? entry.countryCode;
    orgs.push({
      id,
      name: entry.name,
      countryCode: entry.countryCode,
      countryName,
      city: entry.city,
      latitude: entry.latitude,
      longitude: entry.longitude,
      sourceUrl: entry.sourceUrl,
      models: list.length,
      families: families.size,
      open: list.filter((m) => m.open === true).length,
      closed: list.filter((m) => m.open === false).length,
      unknown: list.filter((m) => m.open === null).length,
      traitSample,
      traits,
      topFamilies: [...families.entries()]
        .map(([name, count]) => ({ name, models: count }))
        .sort((a, b) => b.models - a.models || a.name.localeCompare(b.name))
        .slice(0, 5),
      sampleModels: [...list]
        .sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0))
        .slice(0, 8)
        .map((m) => ({ title: m.title, open: m.open, url: m.url })),
      provider: provider
        ? {
            id: provider.id,
            name: provider.name,
            country: provider.country,
            consistent: provider.country === countryName,
          }
        : null,
    });
  }
  orgs.sort((a, b) => b.models - a.models);

  const byCountry = new Map<string, CountryStats>();
  for (const o of orgs) {
    const ref = COUNTRIES[o.countryCode];
    const c = byCountry.get(o.countryCode) ?? {
      countryCode: o.countryCode,
      name: o.countryName,
      latitude: ref?.latitude ?? o.latitude,
      longitude: ref?.longitude ?? o.longitude,
      orgs: 0,
      models: 0,
      families: 0,
      open: 0,
      closed: 0,
      unknown: 0,
      traitSample: 0,
      traits: emptyTraits(),
    };
    c.orgs += 1;
    c.models += o.models;
    c.families += o.families;
    c.open += o.open;
    c.closed += o.closed;
    c.unknown += o.unknown;
    c.traitSample += o.traitSample;
    for (const key of TRAIT_KEYS) c.traits[key] += o.traits[key];
    byCountry.set(o.countryCode, c);
  }
  const countries = [...byCountry.values()].sort((a, b) => b.models - a.models);
  return {
    orgs,
    countries,
    totals: {
      models: orgs.reduce((s, o) => s + o.models, 0),
      orgs: orgs.length,
      countries: countries.length,
      unmappedModels: unmapped,
    },
  };
}

export type LlmOriginsResponse = LlmOriginsResult & {
  asOf: string;
  registryVerifiedAt: string;
  longContextTokens: number;
  sources: Array<{ name: string; url: string; records: number }>;
  notes: string[];
};
