// Hand-curated map from a publisher handle (Hugging Face author or OpenRouter
// vendor prefix) to the organisation behind it and the country of its
// headquarters. It only lists organisations whose headquarters are public
// knowledge; anything else stays "sin clasificar" instead of being guessed.
//
// Curated on 2026-11-09. Each entry can be checked against the organisation
// page on Hugging Face (https://huggingface.co/<handle>) or its corporate site.

export type OrgRegion =
  | "norteamerica"
  | "europa"
  | "asia-oriental"
  | "asia-sur"
  | "medio-oriente"
  | "latinoamerica"
  | "oceania"
  | "africa";

export type OrgKind = "official" | "community";

export type OrgInfo = {
  /** Canonical organisation name. */
  name: string;
  /** ISO 3166-1 alpha-2 code of the headquarters country. */
  country: string;
  kind: OrgKind;
};

export const ORG_CURATED_AT = "2026-11-09";

export const COUNTRY_NAMES: Record<string, string> = {
  US: "Estados Unidos",
  CN: "China",
  FR: "Francia",
  GB: "Reino Unido",
  DE: "Alemania",
  CA: "Canadá",
  KR: "Corea del Sur",
  JP: "Japón",
  IN: "India",
  IL: "Israel",
  AE: "Emiratos Árabes Unidos",
  SG: "Singapur",
  ES: "España",
  CH: "Suiza",
  RU: "Rusia",
  VN: "Vietnam",
  PL: "Polonia",
  PT: "Portugal",
  SA: "Arabia Saudita",
};

export const COUNTRY_REGIONS: Record<string, OrgRegion> = {
  US: "norteamerica",
  CA: "norteamerica",
  CN: "asia-oriental",
  KR: "asia-oriental",
  JP: "asia-oriental",
  FR: "europa",
  GB: "europa",
  DE: "europa",
  ES: "europa",
  CH: "europa",
  RU: "europa",
  PL: "europa",
  PT: "europa",
  IN: "asia-sur",
  SG: "asia-sur",
  VN: "asia-sur",
  IL: "medio-oriente",
  AE: "medio-oriente",
  SA: "medio-oriente",
};

export const REGION_LABELS: Record<OrgRegion, string> = {
  norteamerica: "Norteamérica",
  europa: "Europa",
  "asia-oriental": "Asia Oriental",
  "asia-sur": "Sur y Sudeste Asiático",
  "medio-oriente": "Medio Oriente",
  latinoamerica: "Latinoamérica",
  oceania: "Oceanía",
  africa: "África",
};

function official(name: string, country: string): OrgInfo {
  return { name, country, kind: "official" };
}

/** Keys are lower-cased handles. */
const ORGS: Record<string, OrgInfo> = {
  // United States
  openai: official("OpenAI", "US"),
  "openai-community": official("OpenAI", "US"),
  anthropic: official("Anthropic", "US"),
  google: official("Google", "US"),
  "google-bert": official("Google", "US"),
  "google-t5": official("Google", "US"),
  meta: official("Meta", "US"),
  "meta-llama": official("Meta", "US"),
  facebook: official("Meta", "US"),
  facebookai: official("Meta", "US"),
  microsoft: official("Microsoft", "US"),
  nvidia: official("NVIDIA", "US"),
  "x-ai": official("xAI", "US"),
  xai: official("xAI", "US"),
  "xai-org": official("xAI", "US"),
  amazon: official("Amazon", "US"),
  apple: official("Apple", "US"),
  ibm: official("IBM", "US"),
  "ibm-granite": official("IBM", "US"),
  perplexity: official("Perplexity", "US"),
  "perplexity-ai": official("Perplexity", "US"),
  liquid: official("Liquid AI", "US"),
  liquidai: official("Liquid AI", "US"),
  nousresearch: official("Nous Research", "US"),
  writer: official("Writer", "US"),
  allenai: official("Allen Institute for AI", "US"),
  databricks: official("Databricks", "US"),
  salesforce: official("Salesforce", "US"),
  snowflake: official("Snowflake", "US"),
  "nomic-ai": official("Nomic AI", "US"),
  huggingfaceh4: official("Hugging Face", "US"),
  huggingfacetb: official("Hugging Face", "US"),
  thinkingmachines: official("Thinking Machines Lab", "US"),
  moondream: official("Moondream", "US"),
  vikhyatk: official("Moondream", "US"),
  rekaai: official("Reka AI", "US"),
  // Canada
  cohere: official("Cohere", "CA"),
  coherelabs: official("Cohere", "CA"),
  cohereforai: official("Cohere", "CA"),
  // China
  deepseek: official("DeepSeek", "CN"),
  "deepseek-ai": official("DeepSeek", "CN"),
  qwen: official("Alibaba (Qwen)", "CN"),
  alibaba: official("Alibaba", "CN"),
  "alibaba-nlp": official("Alibaba", "CN"),
  "z-ai": official("Zhipu AI (Z.ai)", "CN"),
  "zai-org": official("Zhipu AI (Z.ai)", "CN"),
  thudm: official("Zhipu AI / Tsinghua KEG", "CN"),
  moonshotai: official("Moonshot AI", "CN"),
  tencent: official("Tencent", "CN"),
  bytedance: official("ByteDance", "CN"),
  "bytedance-seed": official("ByteDance", "CN"),
  minimax: official("MiniMax", "CN"),
  minimaxai: official("MiniMax", "CN"),
  xiaomi: official("Xiaomi", "CN"),
  xiaomimimo: official("Xiaomi", "CN"),
  stepfun: official("StepFun", "CN"),
  "stepfun-ai": official("StepFun", "CN"),
  baidu: official("Baidu", "CN"),
  meituan: official("Meituan", "CN"),
  "01-ai": official("01.AI", "CN"),
  baai: official("BAAI", "CN"),
  openbmb: official("OpenBMB", "CN"),
  internlm: official("Shanghai AI Laboratory", "CN"),
  opengvlab: official("Shanghai AI Laboratory", "CN"),
  inclusionai: official("Ant Group", "CN"),
  // Europe
  mistralai: official("Mistral AI", "FR"),
  mistral: official("Mistral AI", "FR"),
  kyutai: official("Kyutai", "FR"),
  lightonai: official("LightOn", "FR"),
  stabilityai: official("Stability AI", "GB"),
  "aleph-alpha": official("Aleph Alpha", "DE"),
  "black-forest-labs": official("Black Forest Labs", "DE"),
  jinaai: official("Jina AI", "DE"),
  "bsc-lt": official("Barcelona Supercomputing Center", "ES"),
  "projecte-aina": official("Barcelona Supercomputing Center", "ES"),
  "swiss-ai": official("Swiss AI Initiative", "CH"),
  speakleash: official("SpeakLeash", "PL"),
  unbabel: official("Unbabel", "PT"),
  yandex: official("Yandex", "RU"),
  "ai-sage": official("Sber", "RU"),
  // Asia
  upstage: official("Upstage", "KR"),
  naver: official("NAVER", "KR"),
  "naver-hyperclovax": official("NAVER", "KR"),
  "lgai-exaone": official("LG AI Research", "KR"),
  sakana: official("Sakana AI", "JP"),
  sakanaai: official("Sakana AI", "JP"),
  rinna: official("rinna", "JP"),
  sarvamai: official("Sarvam AI", "IN"),
  ai4bharat: official("AI4Bharat", "IN"),
  aisingapore: official("AI Singapore", "SG"),
  seallms: official("Alibaba DAMO (SeaLLMs)", "SG"),
  vinai: official("VinAI", "VN"),
  // Middle East
  ai21: official("AI21 Labs", "IL"),
  ai21labs: official("AI21 Labs", "IL"),
  tiiuae: official("Technology Innovation Institute", "AE"),
  inceptionai: official("Inception (G42)", "AE"),
  "silma-ai": official("SILMA AI", "SA"),
};

export function lookupOrg(handle: string | null | undefined): OrgInfo | null {
  if (!handle) return null;
  return ORGS[handle.trim().toLowerCase()] ?? null;
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

export function regionOf(code: string): OrgRegion | null {
  return COUNTRY_REGIONS[code] ?? null;
}

/**
 * A repository is "official" when its publisher is a curated organisation.
 * Everything else is treated as community: unknown handles are never promoted.
 */
export function originKind(handle: string | null | undefined): OrgKind {
  return lookupOrg(handle)?.kind ?? "community";
}
