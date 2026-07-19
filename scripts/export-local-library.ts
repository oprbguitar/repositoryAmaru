import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ApiResponse, LocalDocument } from "../types/api";

const endpoint =
  process.env.LOCAL_IMPORT_ENDPOINT ??
  "http://127.0.0.1:5174/api/internal/import/local";
const base = new URL(endpoint);
const documents: LocalDocument[] = [];
let offset = 0;
while (true) {
  const response = await fetch(
    new URL(`/api/local-library?limit=100&offset=${offset}`, base),
  );
  if (!response.ok)
    throw new Error(`No se pudo leer la biblioteca: ${response.status}`);
  const body = (await response.json()) as ApiResponse<LocalDocument[]>;
  documents.push(...body.data);
  if (!body.meta.nextCursor) break;
  offset = Number(body.meta.nextCursor);
}
const output = path.resolve("local-library-export");
await mkdir(output, { recursive: true });
const generatedAt = new Date().toISOString();
await writeFile(
  path.join(output, "manifest.json"),
  `${JSON.stringify({ format: "amaru-local-library-v1", generatedAt, includesRawFiles: false, count: documents.length }, null, 2)}\n`,
);
await writeFile(
  path.join(output, "documents.json"),
  `${JSON.stringify(documents, null, 2)}\n`,
);
console.log(
  `Exportación privada creada en ${output}. No contiene archivos originales.`,
);
