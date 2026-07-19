export type CredentialState =
  | "not_configured"
  | "configured"
  | "connection_verified"
  | "invalid"
  | "expired"
  | "rate_limited"
  | "insufficient_permissions"
  | "unavailable";

export type ProviderLocation = "cloud" | "local";

export type ProviderCategory =
  | "text"
  | "reasoning"
  | "code"
  | "multimodal"
  | "image"
  | "audio"
  | "video"
  | "embeddings"
  | "reranking"
  | "agents";

export type ConnectionStrategy =
  | { kind: "bearer"; url: string }
  | { kind: "api-key-query"; url: string }
  | { kind: "local"; url: string }
  | { kind: "binding" }
  | { kind: "registered" };

export type DeveloperLabProviderDefinition = {
  id: string;
  name: string;
  location: ProviderLocation;
  categories: ProviderCategory[];
  credentialBinding: string | null;
  supportsModelDiscovery: boolean;
  supportsStreaming: boolean;
  supportsUsageMetadata: boolean;
  supportsQuotaInspection: boolean;
  supportsFileUpload: boolean;
  supportsAsyncJobs: boolean;
  documentationUrl: string;
  pricingUrl: string | null;
  apiKeyUrl: string | null;
  connection: ConnectionStrategy;
};

const cloud = (
  definition: Omit<DeveloperLabProviderDefinition, "location">,
): DeveloperLabProviderDefinition => ({ ...definition, location: "cloud" });

const compatible = (
  id: string,
  name: string,
  credentialBinding: string,
  url: string,
  documentationUrl: string,
  pricingUrl: string,
  apiKeyUrl: string,
): DeveloperLabProviderDefinition =>
  cloud({
    id,
    name,
    categories: ["text", "reasoning", "code", "multimodal", "agents"],
    credentialBinding,
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl,
    pricingUrl,
    apiKeyUrl,
    connection: { kind: "bearer", url },
  });

export const DEVELOPER_LAB_PROVIDERS = [
  compatible(
    "openai",
    "OpenAI",
    "OPENAI_API_KEY",
    "https://api.openai.com/v1/models",
    "https://platform.openai.com/docs",
    "https://openai.com/api/pricing/",
    "https://platform.openai.com/api-keys",
  ),
  cloud({
    id: "anthropic",
    name: "Anthropic",
    categories: ["text", "reasoning", "code", "multimodal", "agents"],
    credentialBinding: "ANTHROPIC_API_KEY",
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: true,
    supportsAsyncJobs: true,
    documentationUrl: "https://docs.anthropic.com/",
    pricingUrl: "https://www.anthropic.com/pricing",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    connection: { kind: "bearer", url: "https://api.anthropic.com/v1/models" },
  }),
  cloud({
    id: "google-gemini",
    name: "Google Gemini",
    categories: [
      "text",
      "reasoning",
      "code",
      "multimodal",
      "image",
      "audio",
      "video",
      "embeddings",
      "agents",
    ],
    credentialBinding: "GEMINI_API_KEY",
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: true,
    supportsAsyncJobs: true,
    documentationUrl: "https://ai.google.dev/gemini-api/docs",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    connection: {
      kind: "api-key-query",
      url: "https://generativelanguage.googleapis.com/v1beta/models",
    },
  }),
  compatible(
    "openrouter",
    "OpenRouter",
    "OPENROUTER_API_KEY",
    "https://openrouter.ai/api/v1/models",
    "https://openrouter.ai/docs",
    "https://openrouter.ai/models",
    "https://openrouter.ai/settings/keys",
  ),
  compatible(
    "groq",
    "Groq",
    "GROQ_API_KEY",
    "https://api.groq.com/openai/v1/models",
    "https://console.groq.com/docs",
    "https://groq.com/pricing/",
    "https://console.groq.com/keys",
  ),
  compatible(
    "mistral",
    "Mistral AI",
    "MISTRAL_API_KEY",
    "https://api.mistral.ai/v1/models",
    "https://docs.mistral.ai/",
    "https://mistral.ai/pricing",
    "https://console.mistral.ai/api-keys",
  ),
  compatible(
    "nvidia",
    "NVIDIA",
    "NVIDIA_API_KEY",
    "https://integrate.api.nvidia.com/v1/models",
    "https://docs.api.nvidia.com/",
    "https://build.nvidia.com/",
    "https://build.nvidia.com/",
  ),
  cloud({
    id: "cohere",
    name: "Cohere",
    categories: ["text", "embeddings", "reranking", "agents"],
    credentialBinding: "COHERE_API_KEY",
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl: "https://docs.cohere.com/",
    pricingUrl: "https://cohere.com/pricing",
    apiKeyUrl: "https://dashboard.cohere.com/api-keys",
    connection: { kind: "bearer", url: "https://api.cohere.com/v1/models" },
  }),
  compatible(
    "together",
    "Together AI",
    "TOGETHER_API_KEY",
    "https://api.together.xyz/v1/models",
    "https://docs.together.ai/",
    "https://www.together.ai/pricing",
    "https://api.together.ai/settings/api-keys",
  ),
  compatible(
    "fireworks",
    "Fireworks AI",
    "FIREWORKS_API_KEY",
    "https://api.fireworks.ai/inference/v1/models",
    "https://docs.fireworks.ai/",
    "https://fireworks.ai/pricing",
    "https://fireworks.ai/account/api-keys",
  ),
  compatible(
    "cerebras",
    "Cerebras",
    "CEREBRAS_API_KEY",
    "https://api.cerebras.ai/v1/models",
    "https://inference-docs.cerebras.ai/",
    "https://www.cerebras.ai/pricing",
    "https://cloud.cerebras.ai/",
  ),
  compatible(
    "xai",
    "xAI",
    "XAI_API_KEY",
    "https://api.x.ai/v1/models",
    "https://docs.x.ai/",
    "https://docs.x.ai/docs/models",
    "https://console.x.ai/",
  ),
  compatible(
    "deepseek",
    "DeepSeek",
    "DEEPSEEK_API_KEY",
    "https://api.deepseek.com/models",
    "https://api-docs.deepseek.com/",
    "https://api-docs.deepseek.com/quick_start/pricing",
    "https://platform.deepseek.com/api_keys",
  ),
  compatible(
    "deepinfra",
    "DeepInfra",
    "DEEPINFRA_API_KEY",
    "https://api.deepinfra.com/v1/openai/models",
    "https://deepinfra.com/docs",
    "https://deepinfra.com/pricing",
    "https://deepinfra.com/dash/api_keys",
  ),
  cloud({
    id: "replicate",
    name: "Replicate",
    categories: ["image", "video", "audio", "multimodal"],
    credentialBinding: "REPLICATE_API_TOKEN",
    supportsModelDiscovery: false,
    supportsStreaming: true,
    supportsUsageMetadata: false,
    supportsQuotaInspection: false,
    supportsFileUpload: true,
    supportsAsyncJobs: true,
    documentationUrl: "https://replicate.com/docs",
    pricingUrl: "https://replicate.com/pricing",
    apiKeyUrl: "https://replicate.com/account/api-tokens",
    connection: { kind: "bearer", url: "https://api.replicate.com/v1/account" },
  }),
  cloud({
    id: "hugging-face",
    name: "Hugging Face",
    categories: ["text", "image", "audio", "video", "embeddings", "reranking"],
    credentialBinding: "HUGGINGFACE_TOKEN",
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: false,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: true,
    documentationUrl: "https://huggingface.co/docs",
    pricingUrl: "https://huggingface.co/pricing",
    apiKeyUrl: "https://huggingface.co/settings/tokens",
    connection: { kind: "bearer", url: "https://huggingface.co/api/whoami-v2" },
  }),
  cloud({
    id: "stability",
    name: "Stability AI",
    categories: ["image", "video"],
    credentialBinding: "STABILITY_API_KEY",
    supportsModelDiscovery: false,
    supportsStreaming: false,
    supportsUsageMetadata: false,
    supportsQuotaInspection: true,
    supportsFileUpload: true,
    supportsAsyncJobs: true,
    documentationUrl: "https://platform.stability.ai/docs",
    pricingUrl: "https://platform.stability.ai/pricing",
    apiKeyUrl: "https://platform.stability.ai/account/keys",
    connection: {
      kind: "bearer",
      url: "https://api.stability.ai/v1/user/account",
    },
  }),
  cloud({
    id: "elevenlabs",
    name: "ElevenLabs",
    categories: ["audio"],
    credentialBinding: "ELEVENLABS_API_KEY",
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: false,
    supportsQuotaInspection: true,
    supportsFileUpload: true,
    supportsAsyncJobs: false,
    documentationUrl: "https://elevenlabs.io/docs",
    pricingUrl: "https://elevenlabs.io/pricing",
    apiKeyUrl: "https://elevenlabs.io/app/settings/api-keys",
    connection: { kind: "registered" },
  }),
  cloud({
    id: "deepgram",
    name: "Deepgram",
    categories: ["audio"],
    credentialBinding: "DEEPGRAM_API_KEY",
    supportsModelDiscovery: false,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: true,
    supportsFileUpload: true,
    supportsAsyncJobs: true,
    documentationUrl: "https://developers.deepgram.com/",
    pricingUrl: "https://deepgram.com/pricing",
    apiKeyUrl: "https://console.deepgram.com/",
    connection: { kind: "registered" },
  }),
  cloud({
    id: "assemblyai",
    name: "AssemblyAI",
    categories: ["audio"],
    credentialBinding: "ASSEMBLYAI_API_KEY",
    supportsModelDiscovery: false,
    supportsStreaming: true,
    supportsUsageMetadata: false,
    supportsQuotaInspection: false,
    supportsFileUpload: true,
    supportsAsyncJobs: true,
    documentationUrl: "https://www.assemblyai.com/docs",
    pricingUrl: "https://www.assemblyai.com/pricing",
    apiKeyUrl: "https://www.assemblyai.com/dashboard",
    connection: { kind: "registered" },
  }),
  cloud({
    id: "cloudflare-workers-ai",
    name: "Cloudflare Workers AI",
    categories: ["text", "image", "audio", "embeddings"],
    credentialBinding: null,
    supportsModelDiscovery: false,
    supportsStreaming: true,
    supportsUsageMetadata: false,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl: "https://developers.cloudflare.com/workers-ai/",
    pricingUrl:
      "https://developers.cloudflare.com/workers-ai/platform/pricing/",
    apiKeyUrl: null,
    connection: { kind: "binding" },
  }),
  {
    id: "ollama",
    name: "Ollama",
    location: "local",
    categories: [
      "text",
      "reasoning",
      "code",
      "multimodal",
      "embeddings",
      "agents",
    ],
    credentialBinding: null,
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl: "https://docs.ollama.com/",
    pricingUrl: null,
    apiKeyUrl: null,
    connection: { kind: "local", url: "OLLAMA_BASE_URL" },
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    location: "local",
    categories: [
      "text",
      "reasoning",
      "code",
      "multimodal",
      "embeddings",
      "agents",
    ],
    credentialBinding: null,
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl: "https://lmstudio.ai/docs",
    pricingUrl: null,
    apiKeyUrl: null,
    connection: { kind: "local", url: "LM_STUDIO_BASE_URL" },
  },
  {
    id: "vllm",
    name: "vLLM",
    location: "local",
    categories: [
      "text",
      "reasoning",
      "code",
      "multimodal",
      "embeddings",
      "agents",
    ],
    credentialBinding: null,
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl: "https://docs.vllm.ai/",
    pricingUrl: null,
    apiKeyUrl: null,
    connection: { kind: "local", url: "VLLM_BASE_URL" },
  },
  {
    id: "localai",
    name: "LocalAI",
    location: "local",
    categories: [
      "text",
      "code",
      "multimodal",
      "image",
      "audio",
      "embeddings",
      "agents",
    ],
    credentialBinding: null,
    supportsModelDiscovery: true,
    supportsStreaming: true,
    supportsUsageMetadata: true,
    supportsQuotaInspection: false,
    supportsFileUpload: false,
    supportsAsyncJobs: false,
    documentationUrl: "https://localai.io/docs/",
    pricingUrl: null,
    apiKeyUrl: null,
    connection: { kind: "local", url: "LOCALAI_BASE_URL" },
  },
] as const satisfies readonly DeveloperLabProviderDefinition[];

export function getDeveloperLabProvider(id: string) {
  return DEVELOPER_LAB_PROVIDERS.find((provider) => provider.id === id) ?? null;
}
