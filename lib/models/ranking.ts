// Pure "top 10" ranking over a pool of hub models. Every criterion declares
// which signal it needs; a model without that signal is not verifiable for the
// criterion and is left out instead of receiving a default score. When fewer
// than ten models are verifiable the ranking is shorter — never padded.

import type { HubModel } from "./hub";
import { LOCAL_FORMATS } from "./hub";
import { BYTES_PER_GB } from "./memory";
import { type SpecialtyId, specialtyEvidence } from "./specialties";

export type RankingCriterion =
  | "balanced"
  | "downloads"
  | "likes"
  | "trending"
  | "evidence"
  | "local"
  | "recent";

/** Which evidence family the criterion is built on. */
export type SignalKind = "medido" | "declarado" | "popularidad";

export type CriterionDefinition = {
  id: RankingCriterion;
  label: string;
  kind: SignalKind;
  methodology: string;
};

export const RANKING_CRITERIA: CriterionDefinition[] = [
  {
    id: "balanced",
    label: "Equilibrado",
    kind: "popularidad",
    methodology:
      "Promedio de tres señales normalizadas dentro del grupo: descargas de los últimos 30 días (escala logarítmica, 40 %), «me gusta» (escala logarítmica, 30 %) y tendencia del hub (30 %). Exige al menos descargas publicadas.",
  },
  {
    id: "downloads",
    label: "Descargas (30 días)",
    kind: "popularidad",
    methodology:
      "Descargas de los últimos 30 días según la API de Hugging Face. Mide adopción, no calidad.",
  },
  {
    id: "likes",
    label: "Me gusta",
    kind: "popularidad",
    methodology:
      "Total de «me gusta» del repositorio en Hugging Face. Mide interés de la comunidad, no calidad.",
  },
  {
    id: "trending",
    label: "Tendencia",
    kind: "popularidad",
    methodology:
      "trendingScore del hub: actividad reciente (descargas y «me gusta» de los últimos días). Solo entran modelos con puntaje publicado mayor que cero.",
  },
  {
    id: "evidence",
    label: "Evidencia publicada",
    kind: "medido",
    methodology:
      "Cantidad de resultados de benchmarks publicados en model-index (cada resultado verificado por el hub cuenta doble). Mide cuánta evidencia medida acompaña al modelo, no compara puntajes entre datasets distintos.",
  },
  {
    id: "local",
    label: "Ejecutable en local",
    kind: "declarado",
    methodology:
      "Solo modelos con formato local publicado (GGUF, MLX u ONNX) y parámetros conocidos. Ordena por menor tamaño estimado en Q4_K_M, desempatando por descargas.",
  },
  {
    id: "recent",
    label: "Más recientes",
    kind: "declarado",
    methodology:
      "Fecha de creación del repositorio en Hugging Face, de más reciente a más antiguo.",
  },
];

export const CRITERION_BY_ID = new Map(RANKING_CRITERIA.map((c) => [c.id, c]));

export type RankedModel = {
  position: number;
  model: HubModel;
  score: number;
  /** Human-readable value behind the score. */
  display: string;
  evidence: string | null;
};

export type RankingResult = {
  criterion: CriterionDefinition;
  entries: RankedModel[];
  /** Models in the specialty pool (after specialty evidence check). */
  poolSize: number;
  /** Models that carry the signal the criterion needs. */
  verifiable: number;
  /** True when fewer than `size` models were verifiable. */
  short: boolean;
};

function log10p(value: number): number {
  return Math.log10(1 + Math.max(0, value));
}

function normalizer(values: number[]): (value: number) => number {
  const max = Math.max(0, ...values);
  return (value) => (max > 0 ? value / max : 0);
}

function evidencePoints(model: HubModel): number {
  const seen = new Set<string>();
  let points = 0;
  for (const result of model.evals) {
    const key = `${result.dataset}|${result.metric}`;
    if (seen.has(key)) continue;
    seen.add(key);
    points += result.verified ? 2 : 1;
  }
  return points;
}

function hasLocalFormat(model: HubModel): boolean {
  return model.formats.some((format) => LOCAL_FORMATS.includes(format));
}

export function isVerifiable(
  model: HubModel,
  criterion: RankingCriterion,
): boolean {
  switch (criterion) {
    case "balanced":
    case "downloads":
      return model.downloads !== null;
    case "likes":
      return model.likes !== null;
    case "trending":
      return (model.trendingScore ?? 0) > 0;
    case "evidence":
      return evidencePoints(model) > 0;
    case "local":
      return hasLocalFormat(model) && model.estimatedPackageBytes !== null;
    case "recent":
      return (
        model.createdAt !== null && !Number.isNaN(Date.parse(model.createdAt))
      );
  }
}

const integer = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });

/**
 * Ranks the pool for one specialty. Pure: same input, same output; no clock,
 * no I/O. `specialty` null ranks the whole pool.
 */
export function rankModels(
  pool: HubModel[],
  specialty: SpecialtyId | null,
  criterionId: RankingCriterion,
  size = 10,
): RankingResult {
  const criterion =
    CRITERION_BY_ID.get(criterionId) ??
    (RANKING_CRITERIA[0] as CriterionDefinition);
  const unique = [...new Map(pool.map((model) => [model.id, model])).values()];
  const inSpecialty = unique
    .map((model) => ({
      model,
      evidence: specialty ? specialtyEvidence(model, specialty) : null,
    }))
    .filter((item) => specialty === null || item.evidence !== null);
  const eligible = inSpecialty.filter((item) =>
    isVerifiable(item.model, criterion.id),
  );

  const downloads = normalizer(
    eligible.map((i) => log10p(i.model.downloads ?? 0)),
  );
  const likes = normalizer(eligible.map((i) => log10p(i.model.likes ?? 0)));
  const trending = normalizer(eligible.map((i) => i.model.trendingScore ?? 0));

  const scored = eligible.map(({ model, evidence }) => {
    let score = 0;
    let display = "";
    switch (criterion.id) {
      case "balanced":
        score =
          0.4 * downloads(log10p(model.downloads ?? 0)) +
          0.3 * likes(log10p(model.likes ?? 0)) +
          0.3 * trending(model.trendingScore ?? 0);
        display = `${Math.round(score * 100)} / 100`;
        break;
      case "downloads":
        score = model.downloads ?? 0;
        display = `${integer.format(score)} descargas`;
        break;
      case "likes":
        score = model.likes ?? 0;
        display = `${integer.format(score)} me gusta`;
        break;
      case "trending":
        score = model.trendingScore ?? 0;
        display = `tendencia ${integer.format(score)}`;
        break;
      case "evidence":
        score = evidencePoints(model);
        display = `${score} punto${score === 1 ? "" : "s"} de evidencia`;
        break;
      case "local": {
        const gb = (model.estimatedPackageBytes ?? 0) / BYTES_PER_GB;
        // Smaller is better; downloads only break ties.
        score = -gb + log10p(model.downloads ?? 0) / 1000;
        display = `≈ ${gb.toFixed(1)} GB en Q4`;
        break;
      }
      case "recent":
        score = Date.parse(model.createdAt ?? "");
        display = (model.createdAt ?? "").slice(0, 10);
        break;
    }
    return { model, evidence, score, display };
  });

  scored.sort(
    (left, right) =>
      right.score - left.score || left.model.id.localeCompare(right.model.id),
  );

  return {
    criterion,
    entries: scored.slice(0, size).map((item, index) => ({
      position: index + 1,
      model: item.model,
      score: item.score,
      display: item.display,
      evidence: item.evidence,
    })),
    poolSize: inSpecialty.length,
    verifiable: eligible.length,
    short: eligible.length < size,
  };
}
