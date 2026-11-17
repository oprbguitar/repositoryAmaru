// Lineage of a Hugging Face model: who made the weights and what was done to
// them. Derived ONLY from published metadata (author, base_model, relation,
// tags, repository name). It never measures behaviour: "uncensored" means the
// publisher declares it, not that we tested it.

import type { HubModel } from "./hub";
import { lookupOrg, type OrgInfo } from "./organizations";

export type LineageKind =
  | "official"
  | "repack"
  | "adapted"
  | "uncensored"
  | "community";

/** Tags / name fragments publishers use when they remove safety tuning. */
export const UNCENSORED_SIGNALS = [
  "uncensored",
  "abliterated",
  "abliteration",
  "unaligned",
  "unfiltered",
  "decensored",
  "orthogonalized",
  "nsfw",
] as const;

export const LINEAGE_LABELS: Record<LineageKind, string> = {
  official: "Oficial",
  repack: "Reempaquetado",
  adapted: "Modificado / adaptado",
  uncensored: "Sin censura",
  community: "Comunidad",
};

export const LINEAGE_HINTS: Record<LineageKind, string> = {
  official:
    "Publicado por la organización que creó el modelo (Microsoft, Meta, OpenAI, Google, Alibaba…).",
  repack:
    "Mismos pesos del original convertidos o cuantizados por un tercero (p. ej. a GGUF). No cambia el comportamiento.",
  adapted:
    "Un tercero lo reentrenó, fusionó o le añadió adaptadores: su comportamiento ya no es el del original.",
  uncensored:
    "El autor declara que retiró total o parcialmente los filtros de seguridad. Úsalo con criterio y bajo tu responsabilidad.",
  community:
    "Cuenta personal o de comunidad sin modelo base declarado; no hay organización verificada detrás.",
};

export const LINEAGE_ORDER: LineageKind[] = [
  "official",
  "repack",
  "adapted",
  "uncensored",
  "community",
];

export type Lineage = {
  kind: LineageKind;
  label: string;
  hint: string;
  /** Declared signals that put it in "uncensored". */
  signals: string[];
  /** First declared base model, if any. */
  base: string | null;
  /** Curated organisation behind the base model, when known. */
  baseOrg: OrgInfo | null;
  /** Human sentence: "Cuantización de Qwen/Qwen3-4B (Alibaba)". */
  summary: string;
};

type LineageInput = Pick<
  HubModel,
  "id" | "author" | "topics" | "baseModels" | "baseRelation" | "originKind"
> & { org?: OrgInfo | null };

export function uncensoredSignals(input: {
  id: string;
  topics: string[];
}): string[] {
  const haystack = [input.id.toLowerCase(), ...input.topics];
  return UNCENSORED_SIGNALS.filter((signal) =>
    haystack.some((value) => value.toLowerCase().includes(signal)),
  );
}

const RELATION_LABELS: Record<string, string> = {
  quantized: "Cuantización",
  finetune: "Reentrenamiento (fine-tune)",
  adapter: "Adaptador (LoRA)",
  merge: "Fusión",
};

export function classifyLineage(model: LineageInput): Lineage {
  const signals = uncensoredSignals(model);
  const base = model.baseModels[0] ?? null;
  const baseAuthor = base?.split("/")[0] ?? null;
  const baseOrg = lookupOrg(baseAuthor);
  const sameAuthor =
    baseAuthor !== null &&
    baseAuthor.toLowerCase() === model.author.toLowerCase();
  const relation = model.baseRelation ?? (base ? "finetune" : null);
  const baseText = base
    ? `${base}${baseOrg ? ` (${baseOrg.name})` : ""}`
    : null;

  let kind: LineageKind;
  if (signals.length) kind = "uncensored";
  else if (model.originKind === "official") kind = "official";
  else if (base && !sameAuthor && relation === "quantized") kind = "repack";
  else if (base && !sameAuthor) kind = "adapted";
  else kind = "community";

  let summary: string;
  if (kind === "official")
    summary = !base
      ? "Modelo original publicado por su creador."
      : sameAuthor
        ? `Variante oficial de ${baseText}.`
        : `Versión oficial de ${model.org?.name ?? model.author} basada en ${baseText}.`;
  else if (baseText)
    summary = `${RELATION_LABELS[relation ?? "finetune"] ?? "Derivado"} de ${baseText}.`;
  else if (kind === "uncensored")
    summary = "Versión con filtros retirados; no declara modelo base.";
  else summary = "Sin modelo base declarado.";
  if (kind === "uncensored")
    summary += ` Señales declaradas: ${signals.join(", ")}.`;

  return {
    kind,
    label: LINEAGE_LABELS[kind],
    hint: LINEAGE_HINTS[kind],
    signals,
    base,
    baseOrg,
    summary,
  };
}
