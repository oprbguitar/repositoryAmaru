// Specialties ("necesidades") used to explore Hugging Face models, the
// natural-language parser that maps a free-text need to them, and the pure
// filters applied on top of a pool of normalized hub models.
//
// A specialty is never asserted from a model's name alone: each one lists the
// hub queries that build its candidate pool and the evidence (tags, pipeline,
// languages, datasets) that a model must carry to stay in it.

import type { Distribution, HubFormat, HubModel } from "./hub";
import { LOCAL_FORMATS } from "./hub";
import { BYTES_PER_GB } from "./memory";
import type { OrgKind } from "./organizations";

export type SpecialtyId =
  | "programacion"
  | "ingenieria-datos"
  | "redaccion"
  | "juridico"
  | "salud"
  | "ciencias-naturales"
  | "investigacion"
  | "empresa"
  | "multimodal";

/** One request to `/api/models` on the hub. */
export type HubQuery = {
  search?: string;
  filter?: string;
  pipelineTag?: string;
};

export type Specialty = {
  id: SpecialtyId;
  label: string;
  /** What the specialty covers, shown in the inspector. */
  description: string;
  /** Accent-free, lower-case words that trigger the specialty in a query. */
  keywords: string[];
  queries: HubQuery[];
  /** Evidence pattern checked against tags, topics, datasets and the repo id. */
  evidence: RegExp;
  pipelines?: string[];
};

export const MULTIMODAL_PIPELINES = [
  "image-text-to-text",
  "any-to-any",
  "visual-question-answering",
  "video-text-to-text",
  "audio-text-to-text",
  "image-to-text",
];

export const SPECIALTIES: Specialty[] = [
  {
    id: "programacion",
    label: "Programación",
    description:
      "Generación, revisión y completado de código. Se exige la etiqueta «code», un lenguaje de programación declarado o un dataset de código.",
    keywords: [
      "programacion",
      "programar",
      "codigo",
      "code",
      "coder",
      "coding",
      "software",
      "desarrollo",
      "python",
      "javascript",
      "typescript",
      "depurar",
      "debug",
      "refactor",
      "api",
    ],
    queries: [
      { search: "coder", pipelineTag: "text-generation" },
      { filter: "code", pipelineTag: "text-generation" },
    ],
    evidence:
      /(^|[-_/])(code|coder|coding|codegen|starcoder|devstral|codestral)([-_/]|$)|the-stack|codealpaca|evol-?code|humaneval|mbpp|livecodebench/,
  },
  {
    id: "ingenieria-datos",
    label: "Ingeniería y datos",
    description:
      "Matemática, SQL, análisis tabular y razonamiento cuantitativo para ingeniería. Se exige evidencia de math, SQL o datos tabulares.",
    keywords: [
      "ingenieria",
      "datos",
      "data",
      "sql",
      "matematica",
      "matematicas",
      "math",
      "calculo",
      "estadistica",
      "tabla",
      "tablas",
      "excel",
      "analitica",
      "engineering",
    ],
    queries: [
      { search: "math", pipelineTag: "text-generation" },
      { search: "sql", pipelineTag: "text-generation" },
    ],
    evidence:
      /(^|[-_/])(math|mathematics|sql|text-?to-?sql|text2sql|tabular|table-question-answering|gsm8k|numina|statistics)([-_/]|$)/,
    pipelines: ["table-question-answering"],
  },
  {
    id: "redaccion",
    label: "Redacción",
    description:
      "Escritura creativa, narrativa, edición y estilo. Se exige una etiqueta de escritura o narrativa publicada en el repositorio.",
    keywords: [
      "redaccion",
      "redactar",
      "escribir",
      "escritura",
      "writing",
      "writer",
      "texto",
      "textos",
      "articulo",
      "articulos",
      "creativa",
      "creativo",
      "novela",
      "historia",
      "cuento",
      "copy",
      "marketing",
      "correo",
      "correos",
    ],
    queries: [
      { search: "writer", pipelineTag: "text-generation" },
      { filter: "creative-writing" },
    ],
    evidence:
      /(^|[-_/])(writer|writing|creative-writing|creative|storytelling|story|stories|fiction|novel|roleplay|prose)([-_/]|$)/,
  },
  {
    id: "juridico",
    label: "Jurídico",
    description:
      "Derecho, contratos y normativa. Se exige la etiqueta «legal», «law» o un dataset jurídico declarado.",
    keywords: [
      "juridico",
      "juridica",
      "legal",
      "ley",
      "leyes",
      "derecho",
      "abogado",
      "contrato",
      "contratos",
      "norma",
      "normativa",
      "sentencia",
      "law",
      "demanda",
    ],
    queries: [
      { filter: "legal" },
      { search: "legal", pipelineTag: "text-generation" },
      { search: "law", pipelineTag: "text-generation" },
    ],
    evidence:
      /(^|[-_/])(legal|law|laws|lawyer|juridic\w*|contract|contracts|legalbench|case-?law|pile-of-law)([-_/]|$)/,
  },
  {
    id: "salud",
    label: "Salud",
    description:
      "Medicina, clínica y biomedicina. Se exige la etiqueta «medical», «clinical» o un dataset biomédico declarado. No sustituye criterio clínico.",
    keywords: [
      "salud",
      "medico",
      "medica",
      "medicina",
      "clinico",
      "clinica",
      "paciente",
      "pacientes",
      "diagnostico",
      "enfermeria",
      "health",
      "medical",
      "biomedico",
      "farmacia",
    ],
    queries: [
      { filter: "medical" },
      { search: "medical", pipelineTag: "text-generation" },
      { search: "med", pipelineTag: "image-text-to-text" },
    ],
    evidence:
      /(^|[-_/])(medical|medicine|clinical|health|healthcare|biomedical|biomed|radiology|pubmedqa|medqa|medmcqa|meditron|medgemma)([-_/]|$)/,
  },
  {
    id: "ciencias-naturales",
    label: "Ciencias naturales",
    description:
      "Química, biología, física y ciencias de la Tierra. Se exige evidencia de química, biología, proteínas, física o clima.",
    keywords: [
      "ciencia",
      "ciencias",
      "quimica",
      "biologia",
      "fisica",
      "proteina",
      "proteinas",
      "molecula",
      "moleculas",
      "genomica",
      "clima",
      "geologia",
      "chemistry",
      "biology",
      "physics",
    ],
    queries: [
      { filter: "chemistry" },
      { filter: "biology" },
      { search: "science", pipelineTag: "text-generation" },
    ],
    evidence:
      /(^|[-_/])(chemistry|chemical|biology|bio|protein|proteins|molecule|molecular|genomics|dna|physics|climate|weather|materials|science)([-_/]|$)/,
  },
  {
    id: "investigacion",
    label: "Investigación académica",
    description:
      "Lectura de papers, resumen científico y citación. Se exige evidencia de papers, arXiv/PubMed o resumen científico.",
    keywords: [
      "investigacion",
      "investigar",
      "academico",
      "academica",
      "tesis",
      "paper",
      "papers",
      "articulo cientifico",
      "revision",
      "literatura",
      "citas",
      "resumen",
      "research",
      "scientific",
      "universidad",
    ],
    queries: [
      { search: "scientific", pipelineTag: "text-generation" },
      { search: "paper", pipelineTag: "text-generation" },
      { search: "summarization", pipelineTag: "summarization" },
    ],
    evidence:
      /(^|[-_/])(scientific|science|paper|papers|arxiv|pubmed|academic|scholar|research|scitldr|summarization|citation)([-_/]|$)/,
    pipelines: ["summarization"],
  },
  {
    id: "empresa",
    label: "Empresa e industria",
    description:
      "Finanzas, negocio, operaciones y documentos corporativos. Se exige evidencia de finanzas, negocio o industria.",
    keywords: [
      "empresa",
      "negocio",
      "negocios",
      "finanzas",
      "financiero",
      "contabilidad",
      "industria",
      "industrial",
      "manufactura",
      "operaciones",
      "logistica",
      "ventas",
      "cliente",
      "clientes",
      "business",
      "finance",
    ],
    queries: [
      { filter: "finance" },
      { search: "finance", pipelineTag: "text-generation" },
      { search: "business", pipelineTag: "text-generation" },
    ],
    evidence:
      /(^|[-_/])(finance|financial|fin|business|enterprise|industry|industrial|manufacturing|accounting|economics|fingpt|insurance|banking)([-_/]|$)/,
  },
  {
    id: "multimodal",
    label: "Multimodal",
    description:
      "Entiende imagen, audio o video además de texto. Se exige un pipeline multimodal publicado en el hub.",
    keywords: [
      "multimodal",
      "imagen",
      "imagenes",
      "foto",
      "fotos",
      "vision",
      "video",
      "videos",
      "audio",
      "voz",
      "ocr",
      "escaneo",
      "pdf",
      "documentos escaneados",
      "image",
    ],
    queries: [
      { pipelineTag: "image-text-to-text" },
      { pipelineTag: "any-to-any" },
    ],
    evidence: /(^|[-_/])(multimodal|vision|vlm|omni|ocr)([-_/]|$)/,
    pipelines: MULTIMODAL_PIPELINES,
  },
];

export const SPECIALTY_BY_ID = new Map(SPECIALTIES.map((s) => [s.id, s]));

export function isSpecialtyId(value: string): value is SpecialtyId {
  return SPECIALTY_BY_ID.has(value as SpecialtyId);
}

/** Lower-case and strip diacritics so "jurídico" and "juridico" match. */
export function foldText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function evidenceHaystack(model: HubModel): string[] {
  return [
    model.id.toLowerCase(),
    ...model.topics,
    ...model.datasets.map((dataset) => dataset.toLowerCase()),
  ];
}

/** Returns the field that proves the specialty, or null when there is none. */
export function specialtyEvidence(
  model: HubModel,
  id: SpecialtyId,
): string | null {
  const specialty = SPECIALTY_BY_ID.get(id);
  if (!specialty) return null;
  if (model.pipelineTag && specialty.pipelines?.includes(model.pipelineTag))
    return `pipeline_tag: ${model.pipelineTag}`;
  if (id === "programacion" && model.programmingLanguages.length)
    return `lenguajes: ${model.programmingLanguages.slice(0, 3).join(", ")}`;
  for (const value of evidenceHaystack(model)) {
    if (specialty.evidence.test(value)) return value;
  }
  return null;
}

export function matchesSpecialty(model: HubModel, id: SpecialtyId): boolean {
  return specialtyEvidence(model, id) !== null;
}

// ---------------------------------------------------------------------------
// Natural-language need parser
// ---------------------------------------------------------------------------

export type SizeLimit = 2 | 5 | 10 | 15;
export const SIZE_LIMITS: SizeLimit[] = [2, 5, 10, 15];

export type ParsedNeed = {
  specialties: SpecialtyId[];
  maxGb: SizeLimit | null;
  localOnly: boolean;
  distribution: Distribution | null;
  /** Words that did not map to anything, used as a hub free-text search. */
  remainder: string;
};

const STOPWORDS = new Set(
  "un una unos unas el la los las de del al a en y o que para por con sin mi mis me quiero necesito busco modelo modelos ia ai bueno buena mejor algo hacer sirva sirve menos mas gb local localmente abierto abiertos libre comercial uso usar trabajar pc laptop computadora maquina mac".split(
    " ",
  ),
);

/** Picks the smallest preset that still admits the requested size. */
function sizeBucket(gb: number): SizeLimit {
  return SIZE_LIMITS.find((limit) => gb <= limit) ?? 15;
}

export function parseNeed(input: string): ParsedNeed {
  const folded = foldText(input);
  const specialties: SpecialtyId[] = [];
  for (const specialty of SPECIALTIES) {
    const hit = specialty.keywords.some((keyword) =>
      keyword.includes(" ")
        ? folded.includes(keyword)
        : new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`).test(folded),
    );
    if (hit) specialties.push(specialty.id);
  }

  let maxGb: SizeLimit | null = null;
  const size = folded.match(/(\d+(?:[.,]\d+)?)\s*(gb|gigas?)/);
  if (size) maxGb = sizeBucket(Number(size[1].replace(",", ".")));

  const localOnly =
    /\b(local|localmente|offline|sin internet|mi (pc|laptop|computadora|maquina)|gguf|mlx|onnx|ollama|lm studio)\b/.test(
      folded,
    );

  let distribution: Distribution | null = null;
  if (/\b(solo api|via api|por api)\b/.test(folded)) distribution = "api";
  else if (
    /\b(abierto|abiertos|open source|libre|uso comercial)\b/.test(folded)
  )
    distribution = "open";

  const keywordSet = new Set(SPECIALTIES.flatMap((s) => s.keywords));
  const remainder = folded
    .replace(/(\d+(?:[.,]\d+)?)\s*(gb|gigas?)/g, " ")
    .split(/[^a-z0-9.+#-]+/)
    .filter(
      (word) =>
        word.length > 2 && !STOPWORDS.has(word) && !keywordSet.has(word),
    )
    .slice(0, 4)
    .join(" ");

  return { specialties, maxGb, localOnly, distribution, remainder };
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type HubFilters = {
  maxGb: SizeLimit | null;
  distributions: Distribution[];
  localFormats: HubFormat[];
  origin: OrgKind | null;
};

export const EMPTY_FILTERS: HubFilters = {
  maxGb: null,
  distributions: [],
  localFormats: [],
  origin: null,
};

export type FilterResult = {
  models: HubModel[];
  /** Models dropped only because their size could not be estimated. */
  unknownSize: number;
};

export function applyFilters(
  models: HubModel[],
  filters: HubFilters,
): FilterResult {
  let unknownSize = 0;
  const kept = models.filter((model) => {
    if (
      filters.distributions.length &&
      !filters.distributions.includes(model.distribution)
    )
      return false;
    if (filters.origin && model.originKind !== filters.origin) return false;
    if (filters.localFormats.length) {
      const formats = filters.localFormats.filter((format) =>
        LOCAL_FORMATS.includes(format),
      );
      if (!formats.some((format) => model.formats.includes(format)))
        return false;
    }
    if (filters.maxGb !== null) {
      if (model.estimatedPackageBytes === null) {
        unknownSize += 1;
        return false;
      }
      if (model.estimatedPackageBytes > filters.maxGb * BYTES_PER_GB)
        return false;
    }
    return true;
  });
  return { models: kept, unknownSize };
}

export type SpecialtyMatch = {
  model: HubModel;
  matched: SpecialtyId[];
  evidence: Partial<Record<SpecialtyId, string>>;
};

/**
 * Combines specialties: models matching every selected specialty come first,
 * then partial matches, each group ordered by downloads. Models that match
 * none of them are dropped.
 */
export function combineSpecialties(
  models: HubModel[],
  selected: SpecialtyId[],
): SpecialtyMatch[] {
  const seen = new Set<string>();
  const results: SpecialtyMatch[] = [];
  for (const model of models) {
    if (seen.has(model.id)) continue;
    seen.add(model.id);
    const evidence: Partial<Record<SpecialtyId, string>> = {};
    const matched: SpecialtyId[] = [];
    for (const id of selected) {
      const proof = specialtyEvidence(model, id);
      if (proof) {
        matched.push(id);
        evidence[id] = proof;
      }
    }
    if (selected.length && !matched.length) continue;
    results.push({ model, matched, evidence });
  }
  return results.sort(
    (left, right) =>
      right.matched.length - left.matched.length ||
      (right.model.downloads ?? -1) - (left.model.downloads ?? -1),
  );
}
