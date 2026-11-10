/**
 * Size profiles describe the DOWNLOADABLE PACKAGE (the minimum usable set of
 * files), not the memory the model needs to run — see `compat.ts` for that.
 */

/** Binary gigabyte, the unit Windows Explorer and most file managers show. */
export const GIB = 1024 ** 3;

export type SizeProfileId =
  | "ultralight"
  | "light"
  | "mid"
  | "advanced"
  | "extended"
  | "oversize";

export type SizeProfile = {
  id: SizeProfileId;
  label: string;
  /** Inclusive upper bound in GiB; `null` means no bound. */
  maxGib: number | null;
  range: string;
  hint: string;
};

export const SIZE_PROFILES: SizeProfile[] = [
  {
    id: "ultralight",
    label: "Ultraligero",
    maxGib: 1,
    range: "hasta 1 GB",
    hint: "Modelos de bolsillo: clasificación, autocompletado y pruebas rápidas.",
  },
  {
    id: "light",
    label: "Ligero",
    maxGib: 2,
    range: "más de 1 a 2 GB",
    hint: "Asistentes pequeños que suelen caber en laptops sin GPU dedicada.",
  },
  {
    id: "mid",
    label: "Intermedio",
    maxGib: 5,
    range: "más de 2 a 5 GB",
    hint: "Rango habitual de modelos de 7 a 8 mil millones de parámetros cuantizados a 4 bits.",
  },
  {
    id: "advanced",
    label: "Avanzado",
    maxGib: 10,
    range: "más de 5 a 10 GB",
    hint: "Modelos medianos o cuantizaciones de mayor fidelidad.",
  },
  {
    id: "extended",
    label: "Ampliado",
    maxGib: 15,
    range: "más de 10 a 15 GB",
    hint: "Pide bastante disco y, para ejecutarse, una GPU o mucha RAM.",
  },
  {
    id: "oversize",
    label: "Fuera de perfil",
    maxGib: null,
    range: "más de 15 GB",
    hint: "Supera los perfiles previstos; descárgalo solo si sabes que tu equipo lo soporta.",
  },
];

export function sizeProfileFor(bytes: number): SizeProfile {
  const gib = bytes / GIB;
  return (
    SIZE_PROFILES.find(
      (profile) => profile.maxGib !== null && gib <= profile.maxGib,
    ) ?? SIZE_PROFILES[SIZE_PROFILES.length - 1]
  );
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes))
    return "—";
  const abs = Math.abs(bytes);
  if (abs < 1024) return `${bytes} B`;
  if (abs < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (abs < GIB) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / GIB).toFixed(2)} GB`;
}

export function formatSignedBytes(bytes: number): string {
  if (bytes === 0) return "sin cambio";
  return `${bytes > 0 ? "+" : "−"}${formatBytes(Math.abs(bytes))}`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.ceil(seconds)} s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
  return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`;
}
