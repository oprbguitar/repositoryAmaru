/**
 * Neutral description of a model's openness, usage terms and alignment from
 * Hugging Face METADATA ONLY (tags, license, gating, base_model). Nothing here
 * is measured: the UI must present every axis as "declared by the publisher".
 */

export type AxisLevel = "high" | "medium" | "low" | "unknown";

export type Axis = {
  level: AxisLevel;
  label: string;
  detail: string;
};

export type ModelMetadata = {
  id: string;
  tags: string[];
  license: string | null;
  gated: boolean;
  baseModel: string | null;
};

export type AlignmentProfile = {
  /** True when the model belongs to "Modificados / menor alineamiento". */
  modified: boolean;
  /** Tags or name fragments that put it in that category. */
  signals: string[];
  technicalOpenness: Axis;
  usageFreedom: Axis;
  alignment: Axis;
};

/** Tags Hugging Face publishers use for safety-tuning removal. */
export const MODIFIED_SIGNALS = [
  "uncensored",
  "abliterated",
  "abliteration",
  "unaligned",
  "unfiltered",
  "decensored",
  "orthogonalized",
] as const;

const PERMISSIVE = new Set([
  "apache-2.0",
  "mit",
  "bsd",
  "bsd-2-clause",
  "bsd-3-clause",
  "cc-by-4.0",
  "cc0-1.0",
  "unlicense",
  "openrail",
  "bigscience-openrail-m",
  "creativeml-openrail-m",
]);

const COPYLEFT = new Set(["gpl-3.0", "agpl-3.0", "lgpl-3.0", "cc-by-sa-4.0"]);

/** Reads `license:` and `base_model:` tags when the card fields are missing. */
export function metadataFromTags(
  id: string,
  tags: string[],
  extra: Partial<ModelMetadata> = {},
): ModelMetadata {
  const license =
    extra.license ??
    tags.find((tag) => tag.startsWith("license:"))?.slice(8) ??
    null;
  const baseTag = tags.find(
    (tag) => tag.startsWith("base_model:") && tag.split(":").length === 2,
  );
  return {
    id,
    tags,
    license,
    gated: extra.gated ?? false,
    baseModel: extra.baseModel ?? baseTag?.slice(11) ?? null,
  };
}

export function modificationSignals(meta: ModelMetadata): string[] {
  const haystack = [
    ...meta.tags.map((tag) => tag.toLowerCase()),
    meta.id.toLowerCase(),
  ];
  return MODIFIED_SIGNALS.filter((signal) =>
    haystack.some((value) => value.includes(signal)),
  );
}

function usageAxis(license: string | null): Axis {
  if (!license)
    return {
      level: "unknown",
      label: "Sin datos",
      detail: "El publicador no declara licencia.",
    };
  const id = license.toLowerCase();
  if (PERMISSIVE.has(id))
    return {
      level: "high",
      label: "Permisiva",
      detail: `Licencia ${license}: uso comercial y redistribución con atribución.`,
    };
  if (id.includes("-nc") || id.includes("noncommercial"))
    return {
      level: "low",
      label: "No comercial",
      detail: `Licencia ${license}: prohíbe el uso comercial.`,
    };
  if (COPYLEFT.has(id))
    return {
      level: "medium",
      label: "Copyleft",
      detail: `Licencia ${license}: obras derivadas con la misma licencia.`,
    };
  return {
    level: "medium",
    label: "Con condiciones",
    detail: `Licencia ${license}: licencia propia o comunitaria; lee sus condiciones de uso.`,
  };
}

function opennessAxis(meta: ModelMetadata): Axis {
  if (meta.gated)
    return {
      level: "low",
      label: "Acceso controlado",
      detail:
        "Los pesos exigen aceptar condiciones en Hugging Face antes de descargarse.",
    };
  const datasets = meta.tags.some((tag) => tag.startsWith("dataset:"));
  if (datasets)
    return {
      level: "high",
      label: "Pesos y datos declarados",
      detail: "Pesos descargables y conjuntos de datos declarados en la ficha.",
    };
  return {
    level: "medium",
    label: "Pesos abiertos",
    detail: "Pesos descargables; los datos de entrenamiento no se declaran.",
  };
}

function alignmentAxis(meta: ModelMetadata, signals: string[]): Axis {
  if (signals.length)
    return {
      level: "low",
      label: "Reducido (declarado)",
      detail: `El autor indica ${signals.join(", ")}: se retiraron total o parcialmente los rechazos del modelo${meta.baseModel ? ` base ${meta.baseModel}` : ""}.`,
    };
  if (meta.baseModel)
    return {
      level: "medium",
      label: "Heredado del base",
      detail: `Derivado de ${meta.baseModel}; sin señal de cambios en el alineamiento.`,
    };
  return {
    level: "high",
    label: "Original del publicador",
    detail: "Sin señales de modificación del alineamiento en los metadatos.",
  };
}

export function describeAlignment(meta: ModelMetadata): AlignmentProfile {
  const signals = modificationSignals(meta);
  return {
    modified: signals.length > 0,
    signals,
    technicalOpenness: opennessAxis(meta),
    usageFreedom: usageAxis(meta.license),
    alignment: alignmentAxis(meta, signals),
  };
}
