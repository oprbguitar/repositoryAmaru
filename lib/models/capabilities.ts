// Capability tags for models. Every tag is derived from a field the source
// actually published (OpenRouter catalog + category rankings + provider
// endpoints). Nothing is inferred from the model name and no strength is
// invented: when a signal is absent the tag is simply not emitted.

export type CapabilityGroup = "uso" | "modalidad" | "capacidad" | "acceso";

export type CapabilityTag = {
  id: string;
  label: string;
  group: CapabilityGroup;
  /** Spanish provenance sentence shown to the user. */
  evidence: string;
};

export type CapabilityRanking = {
  rankingType: string;
  position: number;
};

export type CapabilityInput = {
  contextLength?: number | null;
  inputModalities?: string[];
  outputModalities?: string[];
  supportedParameters?: string[];
  inputPricePerToken?: number | null;
  outputPricePerToken?: number | null;
  huggingFaceId?: string | null;
  /** Real-usage category rankings the model appears in. */
  rankings?: CapabilityRanking[];
};

/**
 * Real-usage categories published by OpenRouter through the documented
 * `category` parameter of GET /api/v1/models.
 */
const USAGE_CATEGORIES: Record<
  string,
  { id: string; label: string; category: string }
> = {
  "category-programming": {
    id: "uso-programacion",
    label: "Programación",
    category: "programming",
  },
  "category-technology": {
    id: "uso-tecnologia",
    label: "Tecnología",
    category: "technology",
  },
  "category-science": {
    id: "uso-ciencia",
    label: "Ciencia",
    category: "science",
  },
  "category-translation": {
    id: "uso-traduccion",
    label: "Traducción y redacción multilingüe",
    category: "translation",
  },
};

const INPUT_MODALITIES: Record<string, { id: string; label: string }> = {
  image: { id: "modalidad-vision", label: "Visión (analiza imágenes)" },
  audio: { id: "modalidad-audio", label: "Audio (escucha)" },
  video: { id: "modalidad-video", label: "Video (analiza video)" },
  file: { id: "modalidad-archivos", label: "Archivos (PDF y documentos)" },
};

const OUTPUT_MODALITIES: Record<string, { id: string; label: string }> = {
  image: { id: "salida-imagen", label: "Genera imágenes" },
  audio: { id: "salida-audio", label: "Genera audio" },
  video: { id: "salida-video", label: "Genera video" },
};

/** Long-context threshold, stated explicitly in the tag evidence. */
const LONG_CONTEXT_TOKENS = 200_000;

function normalize(values: string[] | undefined): string[] {
  return (values ?? [])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
}

function hasAny(values: string[], candidates: string[]): boolean {
  return candidates.some((candidate) => values.includes(candidate));
}

/**
 * Thousands separator applied explicitly instead of `toLocaleString`, so the
 * evidence text is identical in the browser and in the worker runtime (whose
 * ICU data may format es-PE differently).
 */
function groupDigits(value: number): string {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** A price only counts as free when the source actually published a number. */
function isZeroPrice(value: number | null | undefined): boolean {
  return typeof value === "number" && value === 0;
}

export function deriveCapabilityTags(input: CapabilityInput): CapabilityTag[] {
  const tags: CapabilityTag[] = [];
  const inputModalities = normalize(input.inputModalities);
  const outputModalities = normalize(input.outputModalities);
  const supported = normalize(input.supportedParameters);

  // 1. Real usage: the model is actually ranked inside an OpenRouter category.
  const rankings = [...(input.rankings ?? [])].sort(
    (left, right) => left.position - right.position,
  );
  for (const ranking of rankings) {
    const category = USAGE_CATEGORIES[ranking.rankingType];
    if (!category || tags.some((tag) => tag.id === category.id)) continue;
    tags.push({
      id: category.id,
      label: category.label,
      group: "uso",
      evidence: `Puesto #${ranking.position} en el ranking de uso real de OpenRouter para la categoría «${category.category}».`,
    });
  }

  // 2. Modalities published in `architecture` by the catalog.
  for (const modality of inputModalities) {
    const entry = INPUT_MODALITIES[modality];
    if (!entry || tags.some((tag) => tag.id === entry.id)) continue;
    tags.push({
      id: entry.id,
      label: entry.label,
      group: "modalidad",
      evidence: `El catálogo declara «${modality}» en architecture.input_modalities.`,
    });
  }
  for (const modality of outputModalities) {
    const entry = OUTPUT_MODALITIES[modality];
    if (!entry || tags.some((tag) => tag.id === entry.id)) continue;
    tags.push({
      id: entry.id,
      label: entry.label,
      group: "modalidad",
      evidence: `El catálogo declara «${modality}» en architecture.output_modalities.`,
    });
  }

  // 3. Capabilities published in `supported_parameters`.
  if (hasAny(supported, ["tools", "tool_choice"])) {
    tags.push({
      id: "capacidad-herramientas",
      label: "Tool calling / agentes",
      group: "capacidad",
      evidence:
        "El proveedor declara «tools» en supported_parameters: el modelo acepta llamadas a herramientas.",
    });
  }
  if (hasAny(supported, ["response_format", "structured_outputs"])) {
    tags.push({
      id: "capacidad-estructurada",
      label: "Salida estructurada (JSON)",
      group: "capacidad",
      evidence:
        "El proveedor declara «response_format» o «structured_outputs» en supported_parameters.",
    });
  }
  if (hasAny(supported, ["reasoning", "include_reasoning"])) {
    tags.push({
      id: "capacidad-razonamiento",
      label: "Razonamiento explícito",
      group: "capacidad",
      evidence:
        "El proveedor declara «reasoning» en supported_parameters: el modelo expone cadena de razonamiento.",
    });
  }

  // 4. Context window reported by the catalog.
  if (
    typeof input.contextLength === "number" &&
    input.contextLength >= LONG_CONTEXT_TOKENS
  ) {
    tags.push({
      id: "capacidad-contexto-largo",
      label: "Contexto largo",
      group: "capacidad",
      evidence: `El catálogo reporta ${groupDigits(input.contextLength)} tokens de contexto (umbral aplicado: ${groupDigits(LONG_CONTEXT_TOKENS)}).`,
    });
  }

  // 5. Access conditions.
  if (
    isZeroPrice(input.inputPricePerToken) &&
    isZeroPrice(input.outputPricePerToken)
  ) {
    tags.push({
      id: "acceso-sin-costo",
      label: "Sin costo por token",
      group: "acceso",
      evidence:
        "El catálogo publica precio 0 para prompt y completion en este modelo.",
    });
  }
  if (input.huggingFaceId) {
    tags.push({
      id: "acceso-pesos-abiertos",
      label: "Pesos publicados",
      group: "acceso",
      evidence: `El catálogo enlaza los pesos en Hugging Face (${input.huggingFaceId}).`,
    });
  }

  return tags;
}

/**
 * One-line answer to "what is this model for?", built only from the real-usage
 * rankings and declared modalities. Returns null when the sources published
 * nothing usable — the UI then states that instead of guessing.
 */
export function describePrimaryUse(tags: CapabilityTag[]): string | null {
  const usage = tags
    .filter((tag) => tag.group === "uso")
    .map((tag) => tag.label);
  const modality = tags
    .filter((tag) => tag.group === "modalidad")
    .map((tag) => tag.label);
  const capability = tags
    .filter((tag) => tag.group === "capacidad")
    .map((tag) => tag.label);
  if (!usage.length && !modality.length && !capability.length) return null;
  const parts: string[] = [];
  if (usage.length)
    parts.push(
      `Uso real medido en ${usage.length === 1 ? "la categoría" : "las categorías"} ${usage.join(", ").toLowerCase()}`,
    );
  if (modality.length)
    parts.push(`admite ${modality.join(", ").toLowerCase()}`);
  if (capability.length)
    parts.push(`ofrece ${capability.join(", ").toLowerCase()}`);
  return `${parts.join("; ")}.`;
}

/** Case- and accent-insensitive match used by the tag search box. */
export function tagMatchesQuery(tag: CapabilityTag, query: string): boolean {
  const normalized = query
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (!normalized) return true;
  const haystack = `${tag.label} ${tag.id}`
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return haystack.includes(normalized);
}

export const CAPABILITY_GROUP_LABELS: Record<CapabilityGroup, string> = {
  uso: "Uso real",
  modalidad: "Modalidades",
  capacidad: "Capacidades",
  acceso: "Acceso",
};
