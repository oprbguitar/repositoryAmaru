import type { CategoryId } from "./catalog";

/**
 * Where to run each prompt. Online tools link to their official site; local
 * models link to Ollama's library and to AMARU's «Open y local» guide.
 * Curated list (2026-11-10): products change fast, so the UI labels it as a
 * suggestion, not a ranking.
 */
export type Tool = {
  id: string;
  name: string;
  url: string;
  note: string;
  free?: boolean;
};

export const TOOLS = {
  claude: {
    id: "claude",
    name: "Claude",
    url: "https://claude.ai",
    note: "Redacción, análisis y documentos largos",
    free: true,
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com",
    note: "Uso general, imagen y análisis de archivos",
    free: true,
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google.com",
    note: "Contexto muy largo y Google Workspace",
    free: true,
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    url: "https://chat.deepseek.com",
    note: "Razonamiento visible (DeepThink)",
    free: true,
  },
  perplexity: {
    id: "perplexity",
    name: "Perplexity",
    url: "https://www.perplexity.ai",
    note: "Respuestas con fuentes citadas",
    free: true,
  },
  notebooklm: {
    id: "notebooklm",
    name: "NotebookLM",
    url: "https://notebooklm.google.com",
    note: "Sube PDFs: resúmenes, mapas y audio",
    free: true,
  },
  copilot: {
    id: "copilot",
    name: "Microsoft Copilot",
    url: "https://copilot.microsoft.com",
    note: "Asistente gratuito de Microsoft",
    free: true,
  },
  m365copilot: {
    id: "m365copilot",
    name: "Copilot en Microsoft 365",
    url: "https://www.microsoft.com/microsoft-365/copilot",
    note: "Dentro de Word, Excel, PowerPoint y Outlook",
  },
  higgsfield: {
    id: "higgsfield",
    name: "Higgsfield",
    url: "https://higgsfield.ai",
    note: "Video cinematográfico y movimientos de cámara",
  },
  dreamina: {
    id: "dreamina",
    name: "Dreamina (Seedance)",
    url: "https://dreamina.capcut.com",
    note: "Modelos Seedance de ByteDance para video",
  },
  kling: {
    id: "kling",
    name: "Kling AI",
    url: "https://klingai.com",
    note: "Video realista desde texto o imagen",
  },
  hailuo: {
    id: "hailuo",
    name: "Hailuo (MiniMax)",
    url: "https://hailuoai.video",
    note: "Video corto con buena física",
  },
  flow: {
    id: "flow",
    name: "Google Flow (Veo)",
    url: "https://labs.google/flow",
    note: "Veo con audio nativo",
  },
  sora: {
    id: "sora",
    name: "Sora",
    url: "https://sora.chatgpt.com",
    note: "Video de OpenAI",
  },
  runway: {
    id: "runway",
    name: "Runway",
    url: "https://runwayml.com",
    note: "Edición y generación de video",
  },
  elevenlabs: {
    id: "elevenlabs",
    name: "ElevenLabs",
    url: "https://elevenlabs.io",
    note: "Voces y locución",
    free: true,
  },
  suno: {
    id: "suno",
    name: "Suno",
    url: "https://suno.com",
    note: "Música generada",
    free: true,
  },
  midjourney: {
    id: "midjourney",
    name: "Midjourney",
    url: "https://www.midjourney.com",
    note: "Imagen artística",
  },
  ideogram: {
    id: "ideogram",
    name: "Ideogram",
    url: "https://ideogram.ai",
    note: "Texto exacto dentro de la imagen",
    free: true,
  },
  napkin: {
    id: "napkin",
    name: "Napkin",
    url: "https://www.napkin.ai",
    note: "Texto a diagramas (visto en el curso)",
    free: true,
  },
  mermaid: {
    id: "mermaid",
    name: "Mermaid Live",
    url: "https://mermaid.live",
    note: "Pega el código y obtén el diagrama",
    free: true,
  },
  markmap: {
    id: "markmap",
    name: "markmap",
    url: "https://markmap.js.org/repl",
    note: "Markdown a mapa mental",
    free: true,
  },
  whimsical: {
    id: "whimsical",
    name: "Whimsical",
    url: "https://whimsical.com",
    note: "Flujos y mapas colaborativos",
    free: true,
  },
  gamma: {
    id: "gamma",
    name: "Gamma",
    url: "https://gamma.app",
    note: "Presentaciones e informes visuales",
    free: true,
  },
  julius: {
    id: "julius",
    name: "Julius AI",
    url: "https://julius.ai",
    note: "Analiza CSV/Excel y grafica",
    free: true,
  },
  consensus: {
    id: "consensus",
    name: "Consensus",
    url: "https://consensus.app",
    note: "Papers con grado de acuerdo (curso)",
    free: true,
  },
  elicit: {
    id: "elicit",
    name: "Elicit",
    url: "https://elicit.com",
    note: "Tablas de evidencia de papers",
    free: true,
  },
  scholar: {
    id: "scholar",
    name: "Semantic Scholar",
    url: "https://www.semanticscholar.org",
    note: "Buscador académico abierto",
    free: true,
  },
  lovable: {
    id: "lovable",
    name: "Lovable",
    url: "https://lovable.dev",
    note: "Apps web con UI y Supabase (curso)",
    free: true,
  },
  bolt: {
    id: "bolt",
    name: "Bolt.new",
    url: "https://bolt.new",
    note: "Full-stack en el navegador (curso)",
    free: true,
  },
  v0: {
    id: "v0",
    name: "v0",
    url: "https://v0.app",
    note: "Interfaces React desde texto",
    free: true,
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    url: "https://cursor.com",
    note: "Editor con agente de código",
  },
  claudecode: {
    id: "claudecode",
    name: "Claude Code",
    url: "https://claude.com/product/claude-code",
    note: "Agente de código en la terminal",
  },
  n8n: {
    id: "n8n",
    name: "n8n",
    url: "https://n8n.io",
    note: "Automatizaciones y agentes (curso)",
    free: true,
  },
  dify: {
    id: "dify",
    name: "Dify",
    url: "https://dify.ai",
    note: "Agentes y RAG visual (curso)",
    free: true,
  },
} satisfies Record<string, Tool>;

export type LocalModel = {
  name: string;
  ollama: string;
  size: string;
  ram: string;
  use: string;
};

/** Small open models that run on a normal laptop (Q4 quantisation). */
export const LOCAL_MODELS = {
  llama32: {
    name: "Llama 3.2 3B",
    ollama: "llama3.2",
    size: "≈2 GB",
    ram: "8 GB RAM",
    use: "Texto rápido y resúmenes cortos",
  },
  qwen3: {
    name: "Qwen3 8B",
    ollama: "qwen3",
    size: "≈5 GB",
    ram: "16 GB RAM",
    use: "Razonamiento y español sólido",
  },
  gemma3: {
    name: "Gemma 3 4B",
    ollama: "gemma3",
    size: "≈3 GB",
    ram: "8 GB RAM",
    use: "Texto e imágenes (multimodal)",
  },
  deepseekR1: {
    name: "DeepSeek-R1 8B",
    ollama: "deepseek-r1",
    size: "≈5 GB",
    ram: "16 GB RAM",
    use: "Cadena de pensamiento visible",
  },
  qwenCoder: {
    name: "Qwen2.5-Coder 7B",
    ollama: "qwen2.5-coder",
    size: "≈5 GB",
    ram: "16 GB RAM",
    use: "Programación",
  },
  mistral: {
    name: "Mistral 7B",
    ollama: "mistral",
    size: "≈4 GB",
    ram: "16 GB RAM",
    use: "Redacción y documentos privados",
  },
} satisfies Record<string, LocalModel>;

type ToolKey = keyof typeof TOOLS;
type LocalKey = keyof typeof LOCAL_MODELS;

export const SUGGESTIONS: Record<
  CategoryId,
  { online: ToolKey[]; local: LocalKey[]; tip: string }
> = {
  razonamiento: {
    online: ["claude", "chatgpt", "deepseek", "gemini"],
    local: ["deepseekR1", "qwen3"],
    tip: "Usa un modelo «razonador» (DeepThink, modo pensar) para los pasos de evaluación.",
  },
  video: {
    online: [
      "higgsfield",
      "dreamina",
      "kling",
      "flow",
      "hailuo",
      "sora",
      "runway",
      "elevenlabs",
      "suno",
    ],
    local: ["qwen3"],
    tip: "Redacta guion y fichas en Claude o ChatGPT; pega los prompts finales en la herramienta de video.",
  },
  imagen: {
    online: ["ideogram", "chatgpt", "gemini", "midjourney"],
    local: ["gemma3"],
    tip: "Para texto exacto en la imagen, Ideogram y GPT-Image suelen acertar más.",
  },
  informes: {
    online: ["claude", "gemini", "perplexity", "gamma"],
    local: ["mistral", "qwen3"],
    tip: "Perplexity para reunir fuentes, Claude para redactar y Gamma para presentarlo.",
  },
  mapas: {
    online: ["markmap", "napkin", "whimsical", "mermaid"],
    local: ["llama32"],
    tip: "Pide salida Markdown o mermaid y pégala en markmap o Mermaid Live.",
  },
  juridico: {
    online: ["claude", "gemini", "notebooklm"],
    local: ["mistral"],
    tip: "Para expedientes confidenciales, prefiere un modelo local. Siempre valida con un abogado.",
  },
  software: {
    online: ["lovable", "bolt", "v0", "cursor", "claudecode"],
    local: ["qwenCoder"],
    tip: "Prototipo rápido en Lovable o Bolt; proyecto serio con un agente de código y pruebas.",
  },
  investigacion: {
    online: ["consensus", "elicit", "scholar", "perplexity", "notebooklm"],
    local: ["qwen3"],
    tip: "Verifica cada DOI: los modelos pueden inventar referencias.",
  },
  aprendizaje: {
    online: ["notebooklm", "chatgpt", "claude", "gemini"],
    local: ["llama32", "gemma3"],
    tip: "NotebookLM convierte tus apuntes en preguntas, resúmenes y un podcast.",
  },
  agentes: {
    online: ["n8n", "dify", "claudecode"],
    local: ["qwen3", "llama32"],
    tip: "Empieza visual (n8n o Dify) y pasa a código cuando el flujo esté probado.",
  },
  datos: {
    online: ["julius", "chatgpt", "claude", "m365copilot"],
    local: ["qwenCoder"],
    tip: "Sube el CSV o Excel; pide primero un perfil de los datos y luego los gráficos.",
  },
  diagramas: {
    online: ["mermaid", "napkin", "whimsical", "julius"],
    local: ["qwenCoder"],
    tip: "El modelo escribe el código del diagrama; la herramienta lo dibuja sin errores.",
  },
  documentos: {
    online: ["notebooklm", "claude", "gemini", "m365copilot", "copilot"],
    local: ["qwen3", "mistral"],
    tip: "Gemini y Claude leen documentos muy largos; Copilot trabaja dentro de Word y Excel.",
  },
  tendencias: {
    online: ["claudecode", "cursor", "n8n", "dify"],
    local: ["qwen3"],
    tip: "La tendencia es dar contexto y herramientas (MCP), no solo escribir mejores prompts.",
  },
};

export function suggestionsFor(category: CategoryId) {
  const entry = SUGGESTIONS[category];
  return {
    tip: entry.tip,
    online: entry.online.map((key): Tool => TOOLS[key]),
    local: entry.local.map((key): LocalModel => LOCAL_MODELS[key]),
  };
}
