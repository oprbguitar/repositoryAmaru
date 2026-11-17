// "De qué se trata": a short review of a model built from what its authors
// publish (model card sections) plus observable adoption (Spaces that use it,
// most downloaded derivatives) and mentions in the observatory's own news and
// research records. The optional Spanish summary is generated ONLY from the
// card text and is labelled as automatic.

export type CardSectionKey =
  | "overview"
  | "intended"
  | "training"
  | "evaluation"
  | "outOfScope";

export type CardSection = {
  key: CardSectionKey;
  label: string;
  heading: string;
  excerpt: string;
};

export type ReviewDerivative = {
  relation: "quantized" | "finetune" | "adapter" | "merge";
  label: string;
  count: number;
  /** True when the listing was capped (real total is higher). */
  capped: boolean;
  top: Array<{ id: string; downloads: number | null }>;
  url: string;
};

export type ReviewMention = {
  title: string;
  url: string;
  source: string;
  kind: string;
  date: string | null;
};

export type HubReviewPayload = {
  id: string;
  sections: CardSection[];
  spaces: { total: number; sample: string[] };
  derivatives: ReviewDerivative[];
  mentions: ReviewMention[];
  mentionTerm: string | null;
  summary: { text: string; model: string; generatedAt: string } | null;
  summaryStatus: "ok" | "no-card" | "unavailable" | "daily-limit";
  fetchedAt: string;
};

const SECTION_RULES: Array<{
  key: Exclude<CardSectionKey, "overview">;
  label: string;
  pattern: RegExp;
}> = [
  {
    key: "intended",
    label: "Para qué se usa",
    pattern:
      /intended use|uses?\b|use cases?|direct use|how to use|applications|usos?|casos de uso/i,
  },
  {
    key: "training",
    label: "Cómo se entrenó",
    pattern:
      /training (data|details|procedure)|training$|pre-?training|dataset|data mixture|entrenamiento/i,
  },
  {
    key: "evaluation",
    label: "Qué reporta su evaluación",
    pattern: /evaluation|benchmark|results|performance|evaluaci[oó]n/i,
  },
  {
    key: "outOfScope",
    label: "Límites declarados",
    pattern:
      /out[- ]of[- ]scope|limitation|bias|risks?|misuse|limitaciones|riesgos/i,
  },
];

export function plainText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(value: string, max: number): string {
  return value.length > max
    ? `${value.slice(0, max).replace(/\s+\S*$/, "")}…`
    : value;
}

/** First real paragraph of the card (skips front matter, badges, tables). */
function overviewOf(lines: string[]): string | null {
  const chunks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      if (current.length) chunks.push(current.join(" "));
      current = [];
      continue;
    }
    if (
      /^#{1,6}\s/.test(line) ||
      /^\s*\|/.test(line) ||
      /^\s*[-*]\s*$/.test(line)
    )
      continue;
    current.push(line);
  }
  if (current.length) chunks.push(current.join(" "));
  for (const chunk of chunks) {
    const text = plainText(chunk);
    // A paragraph, not a badge row, link list or one-word line.
    if (text.length >= 80 && /[a-záéíóú]{3,}\s+[a-záéíóú]{2,}/i.test(text))
      return text;
  }
  return null;
}

/**
 * Pulls overview, intended use, training, evaluation and limitations from a
 * model card. Each excerpt is short; the UI links to the full card.
 */
export function extractCardSections(
  markdown: string,
  maxLength = 420,
): CardSection[] {
  const lines = markdown
    .replace(/^---[\s\S]*?\n---/, "")
    .slice(0, 200_000)
    .split(/\r?\n/);
  const sections: CardSection[] = [];
  const overview = overviewOf(lines.slice(0, 120));
  if (overview)
    sections.push({
      key: "overview",
      label: "De qué se trata",
      heading: "Introducción de la ficha",
      excerpt: clip(overview, maxLength),
    });
  const taken = new Set<CardSectionKey>();
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,4})\s+(.*)$/);
    if (!match) continue;
    const heading = plainText(match[2]);
    const rule = SECTION_RULES.find(
      (r) => !taken.has(r.key) && r.pattern.test(heading),
    );
    if (!rule) continue;
    const level = match[1].length;
    const body: string[] = [];
    for (let next = index + 1; next < lines.length; next += 1) {
      const nextHeading = lines[next].match(/^(#{1,4})\s+/);
      if (nextHeading && nextHeading[1].length <= level) break;
      body.push(lines[next]);
    }
    const excerpt = plainText(body.join("\n"));
    if (excerpt.length < 40) continue;
    taken.add(rule.key);
    sections.push({
      key: rule.key,
      label: rule.label,
      heading,
      excerpt: clip(excerpt, maxLength),
    });
  }
  return sections;
}

/** «OLMo-2-1124-7B-Instruct» → «OLMo-2»; «phi-4» → «phi-4». */
export function mentionTerm(name: string): string | null {
  const match = name.match(/^([A-Za-z][A-Za-z]+)(?:[-_ ]?(\d+(?:\.\d+)?))?/);
  if (!match) return null;
  const [, family, version] = match;
  if (family.length < 3) return null;
  return version ? `${family}-${version}` : family;
}

export const RELATION_LABELS: Record<ReviewDerivative["relation"], string> = {
  quantized: "Cuantizaciones",
  finetune: "Reentrenamientos",
  adapter: "Adaptadores (LoRA)",
  merge: "Fusiones",
};

/** Prompt for the automatic Spanish summary: grounded in the card only. */
export function buildSummaryPrompt(input: {
  id: string;
  pipelineTag: string | null;
  parameters: string | null;
  license: string | null;
  sections: CardSection[];
}): string {
  const facts = [
    `Modelo: ${input.id}`,
    input.pipelineTag ? `Tarea declarada: ${input.pipelineTag}` : null,
    input.parameters ? `Parámetros: ${input.parameters}` : null,
    input.license ? `Licencia: ${input.license}` : null,
  ].filter(Boolean);
  const card = input.sections
    .map((s) => `### ${s.label}\n${s.excerpt}`)
    .join("\n\n")
    .slice(0, 3500);
  return `${facts.join("\n")}\n\nTexto de la ficha publicada por el autor:\n${card}`;
}

export const SUMMARY_SYSTEM_PROMPT =
  "Eres un analista técnico. Resume en español de Perú, en 3 o 4 oraciones claras, de qué trata el modelo, para qué fue entrenado y para qué se usa normalmente. Usa SOLO la información recibida: si algo no aparece, no lo inventes ni lo supongas. No uses viñetas, títulos ni comillas. No menciones que eres un asistente.";
