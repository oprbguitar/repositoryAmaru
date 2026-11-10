// Bridges the observatory `providers` table with the two identifiers the
// OpenRouter data uses:
//   - vendor prefix of a model id ("anthropic/claude-..."), i.e. who *built* it;
//   - `provider_name` of an endpoint offering ("DeepInfra"), i.e. who *hosts* it.
// Both maps only contain pairings verified against the seeded provider list;
// unknown providers fall back to their own id/name instead of guessing.

/** Vendor prefixes used in OpenRouter model ids, per observatory provider id. */
const AUTHOR_PREFIXES: Record<string, string[]> = {
  openai: ["openai"],
  anthropic: ["anthropic"],
  "google-gemini": ["google"],
  mistral: ["mistralai", "mistral"],
  nvidia: ["nvidia"],
  cohere: ["cohere"],
  deepseek: ["deepseek"],
  xai: ["x-ai", "xai"],
  "hugging-face": ["huggingfaceh4"],
  "alibaba-qwen": ["qwen"],
  moonshot: ["moonshotai"],
  zhipu: ["z-ai", "thudm"],
  minimax: ["minimax"],
  ai21: ["ai21"],
  microsoft: ["microsoft"],
  meta: ["meta-llama", "meta"],
  ibm: ["ibm-granite"],
  tencent: ["tencent"],
  baidu: ["baidu"],
  bytedance: ["bytedance-seed", "bytedance"],
  stepfun: ["stepfun", "stepfun-ai"],
  liquid: ["liquid"],
  ai2: ["allenai"],
  reka: ["rekaai"],
  perplexity: ["perplexity"],
  amazon: ["amazon"],
};

/** `provider_name` values used by OpenRouter endpoints, per provider id. */
const HOST_NAMES: Record<string, string[]> = {
  openai: ["openai"],
  anthropic: ["anthropic"],
  "google-gemini": ["google", "google ai studio", "google vertex"],
  mistral: ["mistral"],
  nvidia: ["nvidia", "nvidia nim"],
  cohere: ["cohere"],
  deepseek: ["deepseek"],
  xai: ["xai", "x-ai"],
  groq: ["groq"],
  together: ["together", "together ai"],
  fireworks: ["fireworks"],
  cerebras: ["cerebras"],
  sambanova: ["sambanova"],
  deepinfra: ["deepinfra"],
  replicate: ["replicate"],
  "cloudflare-workers-ai": ["cloudflare", "cloudflare workers ai"],
  "hugging-face": ["hf inference", "hugging face"],
};

export function authorPrefixesFor(providerId: string): string[] {
  return AUTHOR_PREFIXES[providerId] ?? [providerId];
}

export function hostNamesFor(
  providerId: string,
  providerName: string,
): string[] {
  return HOST_NAMES[providerId] ?? [providerName.toLowerCase()];
}

/** True when the provider resells/hosts third-party models rather than authoring them. */
export function isAggregator(providerId: string): boolean {
  return !(providerId in AUTHOR_PREFIXES);
}
