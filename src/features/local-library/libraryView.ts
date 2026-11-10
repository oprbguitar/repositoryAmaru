import type { LocalDocument } from "../../../types/api";

export type DocKind = "document" | "sheet" | "data" | "image" | "web" | "text";

export const KIND_LABEL: Record<DocKind, string> = {
  document: "Documento",
  sheet: "Hoja de cálculo",
  data: "Datos",
  image: "Imagen",
  web: "Web",
  text: "Texto",
};

const KIND_BY_EXTENSION: Record<string, DocKind> = {
  pdf: "document",
  docx: "document",
  xlsx: "sheet",
  csv: "sheet",
  tsv: "sheet",
  json: "data",
  jsonl: "data",
  ndjson: "data",
  yaml: "data",
  yml: "data",
  xml: "data",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  html: "web",
  htm: "web",
};

export function kindOf(extension: string): DocKind {
  return KIND_BY_EXTENSION[extension.toLowerCase()] ?? "text";
}

export type SortKey = "recent" | "name" | "size" | "type";
export type AnalysisFilter = "" | "analyzed" | "pending";

export type ViewFilters = {
  tag: string;
  analysis: AnalysisFilter;
  watchlist: boolean;
};

export function displayTitle(document: LocalDocument): string {
  return document.detectedTitle?.trim() || document.fileName;
}

export function collectTags(documents: LocalDocument[]): string[] {
  const counts = new Map<string, number>();
  for (const document of documents)
    for (const tag of document.tags)
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([tag]) => tag);
}

export function applyView(
  documents: LocalDocument[],
  filters: ViewFilters,
  analyzedIds: ReadonlySet<string>,
  sort: SortKey,
): LocalDocument[] {
  const kept = documents.filter((document) => {
    if (filters.tag && !document.tags.includes(filters.tag)) return false;
    if (filters.watchlist && !document.inWatchlist) return false;
    if (filters.analysis === "analyzed" && !analyzedIds.has(document.id))
      return false;
    if (filters.analysis === "pending" && analyzedIds.has(document.id))
      return false;
    return true;
  });
  const collator = new Intl.Collator("es", { sensitivity: "base" });
  return [...kept].sort((a, b) => {
    if (sort === "name")
      return collator.compare(displayTitle(a), displayTitle(b));
    if (sort === "size") return b.sizeBytes - a.sizeBytes;
    if (sort === "type")
      return (
        collator.compare(a.extension, b.extension) ||
        collator.compare(displayTitle(a), displayTitle(b))
      );
    return b.modifiedAt.localeCompare(a.modifiedAt);
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
