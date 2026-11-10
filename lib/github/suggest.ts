import { normalizeTopics } from "./query";
import type { QuerySpec } from "./types";

export type Suggestion = {
  label: string;
  why: string;
  spec: QuerySpec;
};

export type SuggestionSet = {
  source: "ai" | "local";
  summary: string;
  suggestions: Suggestion[];
};

type Rule = { match: RegExp; label: string; topics: string[] };

const RULES: Rule[] = [
  {
    match: /dise[ñn]o|\bui\b|\bux\b|figma|tipograf|interfaz|css|tailwind/i,
    label: "Diseño de interfaces",
    topics: ["design-system", "ui-kit", "figma", "tailwindcss"],
  },
  {
    match: /icono|svg/i,
    label: "Iconos",
    topics: ["icons", "svg-icons", "icon-library"],
  },
  {
    match: /agente|agent|llm|chatbot|prompt|gpt|claude/i,
    label: "Agentes y LLM",
    topics: ["ai-agents", "llm", "prompt-engineering", "rag"],
  },
  {
    match: /\brag\b|embedding|vectori|b[uú]squeda sem/i,
    label: "RAG y embeddings",
    topics: ["rag", "embeddings", "vector-database"],
  },
  {
    match: /\bmcp\b|model context/i,
    label: "MCP",
    topics: ["mcp", "mcp-server", "model-context-protocol"],
  },
  {
    match:
      /machine learning|deep learning|pytorch|tensorflow|redes neuronales|\bml\b|inteligencia artificial/i,
    label: "Machine learning",
    topics: ["machine-learning", "deep-learning", "pytorch"],
  },
  {
    match: /datos|\bdata\b|anal[ií]tica|\betl\b|\bsql\b|dashboard|visualiz/i,
    label: "Datos y analítica",
    topics: [
      "data-science",
      "data-visualization",
      "data-engineering",
      "dataset",
    ],
  },
  {
    match: /bioinform|gen[oó]mic|biolog/i,
    label: "Bioinformática",
    topics: ["bioinformatics", "genomics", "computational-biology"],
  },
  {
    match: /clima|meteorol|agricult|geograf|\bgis\b|mapa|sat[eé]lite/i,
    label: "Clima y geoespacial",
    topics: ["climate-data", "gis", "remote-sensing", "geospatial"],
  },
  {
    match: /ciencia|investigaci|simulaci|f[ií]sica|astronom|cient[ií]fic/i,
    label: "Ciencia e investigación",
    topics: [
      "scientific-computing",
      "simulation",
      "jupyter-notebook",
      "astronomy",
    ],
  },
  {
    match: /seguridad|hacking|pentest|ciber|cripto/i,
    label: "Seguridad",
    topics: ["security", "penetration-testing", "cryptography"],
  },
  {
    match: /devops|docker|kubernetes|infraestructura|terraform/i,
    label: "DevOps e infraestructura",
    topics: ["devops", "docker", "kubernetes", "infrastructure-as-code"],
  },
  {
    match: /cloudflare|worker|serverless|\bedge\b/i,
    label: "Serverless y edge",
    topics: ["cloudflare-workers", "serverless", "edge-computing"],
  },
  {
    match: /react|frontend|next\.?js|\bvue\b|svelte/i,
    label: "Desarrollo web",
    topics: ["react", "nextjs", "frontend", "typescript"],
  },
  {
    match: /python|django|fastapi/i,
    label: "Python",
    topics: ["python", "fastapi", "django"],
  },
  {
    match: /rust|golang|\bgo\b|\bcli\b|terminal/i,
    label: "Sistemas y CLI",
    topics: ["rust", "golang", "cli", "tui"],
  },
  {
    match: /m[oó]vil|android|\bios\b|flutter/i,
    label: "Apps móviles",
    topics: ["flutter", "android", "ios", "react-native"],
  },
  {
    match: /educaci|aprend|curso|docen|estudi|tesis/i,
    label: "Educación",
    topics: ["education", "tutorial", "course", "awesome"],
  },
  {
    match:
      /industri|ingenier|manufactur|mantenimiento|\biot\b|automatiz|scada/i,
    label: "Ingeniería e industria",
    topics: [
      "industrial-automation",
      "iot",
      "predictive-maintenance",
      "automation",
    ],
  },
  {
    match: /juego|\bgame|unity|godot/i,
    label: "Videojuegos",
    topics: ["game-development", "godot", "unity"],
  },
];

/** Keyword-based fallback used when no model provider is configured. Pure. */
export function suggestLocally(profile: string): SuggestionSet {
  const text = profile.trim();
  const hits = RULES.filter((rule) => rule.match.test(text)).slice(0, 5);
  return {
    source: "local",
    summary: hits.length
      ? `Coincidencias por palabras clave en tu texto: ${hits.map((h) => h.label).join(", ")}.`
      : "No encontré palabras clave conocidas en tu texto. Describe tus intereses, proyectos o stack con más detalle.",
    suggestions: hits.map((rule) => ({
      label: rule.label,
      why: "Coincidencia de palabras clave (sin IA).",
      spec: { anyTopics: normalizeTopics(rule.topics), minStars: 50 },
    })),
  };
}

export function buildSuggestPrompt(profile: string): string {
  return [
    "Eres un asistente que traduce el perfil de una persona a búsquedas de repositorios de GitHub.",
    "Responde SOLO con JSON válido, sin texto adicional, con esta forma exacta:",
    '{"summary": string, "suggestions": [{"label": string, "why": string, "topics": string[], "keywords": string[], "language": string | null}]}',
    "Reglas: entre 3 y 6 sugerencias; topics en minúsculas con guiones, tal como existen en GitHub (por ejemplo machine-learning, design-system), máximo 5 por sugerencia; keywords opcionales en inglés; label y why en español de Perú, breves.",
    "Perfil de la persona:",
    profile.trim().slice(0, 4000),
  ].join("\n");
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Validates a model answer. The model never supplies a raw query: only topics,
 * keywords and a language, which `buildSearchQuery` composes safely.
 */
export function parseAiSuggestions(
  output: string | null,
): SuggestionSet | null {
  if (!output) return null;
  const data = extractJson(output) as {
    summary?: unknown;
    suggestions?: unknown;
  } | null;
  if (!data || !Array.isArray(data.suggestions)) return null;
  const suggestions: Suggestion[] = [];
  for (const item of data.suggestions.slice(0, 8)) {
    const raw = (item ?? {}) as Record<string, unknown>;
    const topics = normalizeTopics(
      Array.isArray(raw.topics)
        ? raw.topics.filter((t): t is string => typeof t === "string")
        : [],
    ).slice(0, 5);
    const keywords = Array.isArray(raw.keywords)
      ? raw.keywords
          .filter((k): k is string => typeof k === "string")
          .slice(0, 4)
      : [];
    if (!topics.length && !keywords.length) continue;
    suggestions.push({
      label:
        typeof raw.label === "string" && raw.label.trim()
          ? raw.label.trim().slice(0, 60)
          : (topics[0] ?? keywords[0]),
      why: typeof raw.why === "string" ? raw.why.trim().slice(0, 200) : "",
      spec: {
        anyTopics: topics,
        keywords: topics.length ? undefined : keywords,
        language:
          typeof raw.language === "string" && raw.language.trim()
            ? raw.language.trim()
            : undefined,
        minStars: 20,
      },
    });
  }
  if (!suggestions.length) return null;
  return {
    source: "ai",
    summary: typeof data.summary === "string" ? data.summary.slice(0, 400) : "",
    suggestions,
  };
}
