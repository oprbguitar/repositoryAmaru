import type { LlmOriginsResponse } from "../../../lib/geo/llm-origins";

export type { LlmOriginsResponse };
export type LlmOrgStats = LlmOriginsResponse["orgs"][number];

export type MapMode = "origin" | "open" | "trends" | "institutions";

export const TRAIT_LABELS = {
  reasoning: "Razonamiento",
  multimodal: "Multimodal",
  longContext: "Contexto largo",
  moe: "MoE (por nombre)",
  tools: "Herramientas",
} as const;

export type TraitKey = keyof typeof TRAIT_LABELS;

/** CSS token per trait; resolved to a concrete color at draw time. */
export const TRAIT_TOKENS: Record<TraitKey, string> = {
  reasoning: "--accent",
  multimodal: "--purple",
  longContext: "--info",
  moe: "--warn",
  tools: "--accent-2",
};

export function openShare(entry: {
  open: number;
  closed: number;
}): number | null {
  const known = entry.open + entry.closed;
  return known === 0 ? null : entry.open / known;
}

export function dominantTrait(entry: {
  traitSample: number;
  traits: Record<TraitKey, number>;
}): TraitKey | null {
  if (entry.traitSample === 0) return null;
  let best: TraitKey | null = null;
  let bestCount = 0;
  for (const key of Object.keys(TRAIT_LABELS) as TraitKey[]) {
    if (entry.traits[key] > bestCount) {
      best = key;
      bestCount = entry.traits[key];
    }
  }
  return best;
}

export const pct = (value: number): string => `${Math.round(value * 100)}%`;
