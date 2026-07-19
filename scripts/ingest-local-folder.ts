import { type ChildProcess, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { load as loadHtml } from "cheerio";
import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { XMLParser } from "fast-xml-parser";
import { fileTypeFromBuffer } from "file-type";
import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import YAML from "yaml";
import {
  resolveSafeFile,
  safeDisplayPath,
  UnsafePathError,
} from "../lib/security/path-security";
import type { ImportBatch, LocalDocument } from "../types/api";

const PARSER_VERSION = "1.0.0";
const TEXT_LIMIT = 500_000;
const SUPPORTED = new Set([
  "json",
  "jsonl",
  "ndjson",
  "csv",
  "tsv",
  "yaml",
  "yml",
  "xml",
  "rss",
  "atom",
  "txt",
  "md",
  "markdown",
  "html",
  "htm",
  "pdf",
  "docx",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "webp",
]);
const BLOCKED = new Set([
  "exe",
  "dll",
  "bat",
  "cmd",
  "ps1",
  "sh",
  "msi",
  "com",
  "scr",
  "jar",
  "js",
  "mjs",
  "cjs",
  "vbs",
]);

type ParsedContent = Pick<
  LocalDocument,
  "detectedTitle" | "summary" | "extractedText" | "tags" | "origin"
> & {
  parserName: string;
  warning?: string;
};

type LocalConfig = {
  root: string;
  endpoint: string;
  token: string;
  maxBytes: number;
  storeRaw: boolean;
};

type ImportManifest = Record<string, { sha256: string; parserVersion: string }>;

function readLocalConfig(): LocalConfig {
  const values = loadEnvFile(path.resolve(".env.local"));
  const maxMegabytes = Number(values.LOCAL_MAX_FILE_SIZE_MB ?? "50");
  return {
    root: path.resolve(values.LOCAL_RESEARCH_DIR ?? "./local-research"),
    endpoint:
      values.LOCAL_IMPORT_ENDPOINT ??
      "http://127.0.0.1:5174/api/internal/import/local",
    token: values.LOCAL_IMPORT_TOKEN ?? "replace-locally",
    maxBytes: Math.max(1, maxMegabytes) * 1024 * 1024,
    storeRaw: values.LOCAL_STORE_RAW_FILES === "true",
  };
}

export function getLocalResearchDirectory(): string {
  return readLocalConfig().root;
}

function loadEnvFile(filePath: string): Record<string, string> {
  try {
    const content = requireEnvText(filePath);
    return Object.fromEntries(
      content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const separator = line.indexOf("=");
          return [
            line.slice(0, separator),
            line.slice(separator + 1).replace(/^['"]|['"]$/g, ""),
          ];
        }),
    );
  } catch {
    return {};
  }
}

function requireEnvText(filePath: string): string {
  const fs = process.getBuiltinModule("fs");
  return fs.readFileSync(filePath, "utf8");
}

async function discoverFiles(root: string): Promise<string[]> {
  const output: string[] = [];
  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(absolute);
      if (entry.isFile()) output.push(path.relative(root, absolute));
    }
  }
  await walk(root);
  return output.sort((left, right) => left.localeCompare(right, "es"));
}

function cleanText(value: string): string {
  const withoutControls = [...value]
    .map((character) => {
      const code = character.charCodeAt(0);
      return (code < 32 && ![9, 10, 13].includes(code)) || code === 127
        ? " "
        : character;
    })
    .join("");
  return withoutControls
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TEXT_LIMIT);
}

function summarize(text: string): string | null {
  const normalized = cleanText(text);
  if (!normalized) return null;
  const sentences =
    normalized
      .match(/[^.!?]+[.!?]+/g)
      ?.slice(0, 3)
      .join(" ") ?? normalized;
  return sentences.slice(0, 700);
}

function titleFromText(text: string, fallback: string): string {
  const markdown = text.match(/^#{1,2}\s+(.+)$/m)?.[1];
  const firstLine = text
    .split(/\r?\n/)
    .find((line) => line.trim().length > 4)
    ?.trim();
  return cleanText(markdown ?? firstLine ?? path.parse(fallback).name).slice(
    0,
    240,
  );
}

function tagsFromPath(relativePath: string): string[] {
  const ignored = new Set([
    "local",
    "research",
    "investigacion",
    "biblioteca",
    "documento",
    "archivo",
  ]);
  return [
    ...new Set(
      relativePath
        .toLowerCase()
        .split(/[\\/_.\-\s]+/)
        .filter((item) => item.length > 2 && !ignored.has(item)),
    ),
  ].slice(0, 12);
}

async function parseFile(
  relativePath: string,
  extension: string,
  buffer: Buffer,
): Promise<ParsedContent> {
  const fallback = path.basename(relativePath);
  const tags = tagsFromPath(relativePath);
  if (["txt", "md", "markdown"].includes(extension)) {
    const text = cleanText(buffer.toString("utf8"));
    return {
      parserName: "plain-text",
      detectedTitle: titleFromText(buffer.toString("utf8"), fallback),
      summary: summarize(text),
      extractedText: text,
      tags,
      origin: null,
    };
  }
  if (["html", "htm"].includes(extension)) {
    const document = loadHtml(buffer.toString("utf8"));
    document("script, style, iframe, object, embed").remove();
    const text = cleanText(document("body").text());
    return {
      parserName: "cheerio",
      detectedTitle:
        cleanText(document("title").text()) || titleFromText(text, fallback),
      summary: summarize(text),
      extractedText: text,
      tags,
      origin: null,
    };
  }
  if (extension === "json") {
    const parsed = JSON.parse(buffer.toString("utf8"));
    const text = cleanText(JSON.stringify(parsed, null, 2));
    return {
      parserName: "json-native",
      detectedTitle:
        typeof parsed?.title === "string"
          ? parsed.title.slice(0, 240)
          : path.parse(fallback).name,
      summary: summarize(text),
      extractedText: text,
      tags,
      origin:
        typeof parsed?.source === "string" ? parsed.source.slice(0, 500) : null,
    };
  }
  if (["jsonl", "ndjson"].includes(extension)) {
    const rows = buffer
      .toString("utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 10_000)
      .map((line) => JSON.stringify(JSON.parse(line)))
      .join("\n");
    const text = cleanText(rows);
    return {
      parserName: "json-lines",
      detectedTitle: path.parse(fallback).name,
      summary: summarize(text),
      extractedText: text,
      tags,
      origin: null,
    };
  }
  if (["csv", "tsv"].includes(extension)) {
    const records = parseCsv(buffer, {
      columns: true,
      skip_empty_lines: true,
      delimiter: extension === "tsv" ? "\t" : ",",
      relax_column_count: true,
      to: 2000,
    });
    const text = cleanText(JSON.stringify(records, null, 2));
    return {
      parserName: "csv-parse",
      detectedTitle: path.parse(fallback).name,
      summary:
        `${records.length} registros tabulares. ${summarize(text) ?? ""}`.trim(),
      extractedText: text,
      tags: [...tags, "datos"],
      origin: null,
    };
  }
  if (["yaml", "yml"].includes(extension)) {
    const parsed = YAML.parse(buffer.toString("utf8"));
    const text = cleanText(JSON.stringify(parsed, null, 2));
    return {
      parserName: "yaml",
      detectedTitle:
        typeof parsed?.title === "string"
          ? parsed.title.slice(0, 240)
          : path.parse(fallback).name,
      summary: summarize(text),
      extractedText: text,
      tags,
      origin: null,
    };
  }
  if (["xml", "rss", "atom"].includes(extension)) {
    const parsed = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
      maxNestedTags: 100,
    }).parse(buffer.toString("utf8"));
    const text = cleanText(JSON.stringify(parsed, null, 2));
    return {
      parserName: "fast-xml-parser",
      detectedTitle: path.parse(fallback).name,
      summary: summarize(text),
      extractedText: text,
      tags,
      origin: null,
    };
  }
  if (extension === "docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = cleanText(parsed.value);
    return {
      parserName: "mammoth",
      detectedTitle: titleFromText(parsed.value, fallback),
      summary: summarize(text),
      extractedText: text,
      tags,
      origin: null,
      warning: parsed.messages.length
        ? parsed.messages
            .map((item) => item.message)
            .join("; ")
            .slice(0, 900)
        : undefined,
    };
  }
  if (extension === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const lines: string[] = [];
    workbook.eachSheet((sheet) => {
      lines.push(`Hoja: ${sheet.name}`);
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const values = Array.isArray(row.values) ? row.values.slice(1) : [];
        lines.push(
          values
            .map((value) =>
              typeof value === "object"
                ? JSON.stringify(value)
                : String(value ?? ""),
            )
            .join(" | "),
        );
      });
    });
    const text = cleanText(lines.join("\n"));
    return {
      parserName: "exceljs",
      detectedTitle: path.parse(fallback).name,
      summary:
        `${workbook.worksheets.length} hojas. ${summarize(text) ?? ""}`.trim(),
      extractedText: text,
      tags: [...tags, "hoja-de-calculo"],
      origin: null,
    };
  }
  if (extension === "pdf") {
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
    }).promise;
    const pages: string[] = [];
    for (
      let pageNumber = 1;
      pageNumber <= Math.min(pdf.numPages, 250);
      pageNumber += 1
    ) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
      );
    }
    const text = cleanText(pages.join("\n"));
    return {
      parserName: "pdfjs-dist",
      detectedTitle: titleFromText(text, fallback),
      summary: `${pdf.numPages} páginas. ${summarize(text) ?? ""}`.trim(),
      extractedText: text,
      tags: [...tags, "pdf"],
      origin: null,
    };
  }
  if (["png", "jpg", "jpeg", "webp"].includes(extension)) {
    const detected = await fileTypeFromBuffer(buffer);
    return {
      parserName: "image-metadata",
      detectedTitle: path.parse(fallback).name,
      summary: `Imagen local ${detected?.mime ?? `image/${extension}`}. OCR no ejecutado.`,
      extractedText: null,
      tags: [...tags, "imagen"],
      origin: null,
    };
  }
  throw new Error("Formato todavía no procesado");
}

async function createDocument(
  config: LocalConfig,
  relativePath: string,
  manifest: ImportManifest,
): Promise<(LocalDocument & { rawContentBase64?: string }) | null> {
  const safePath = safeDisplayPath(relativePath);
  const absolute = await resolveSafeFile(config.root, safePath);
  const metadata = await lstat(absolute);
  const extension = path.extname(safePath).slice(1).toLowerCase();
  const buffer = await readFile(absolute);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  if (
    manifest[safePath]?.sha256 === sha256 &&
    manifest[safePath]?.parserVersion === PARSER_VERSION
  ) {
    return null;
  }
  const mime =
    (await fileTypeFromBuffer(buffer))?.mime ?? mimeFromExtension(extension);
  const base = {
    id: createHash("sha256").update(safePath).digest("hex").slice(0, 32),
    relativePath: safePath,
    fileName: path.basename(safePath),
    extension,
    mimeType: mime,
    sizeBytes: metadata.size,
    modifiedAt: metadata.mtime.toISOString(),
    sha256,
    parserVersion: PARSER_VERSION,
    ingestedAt: new Date().toISOString(),
    sourceAlias: "Biblioteca local",
    isRelevant: false,
    inWatchlist: false,
  } as const;

  if (metadata.size > config.maxBytes) {
    return {
      ...base,
      parserName: "size-guard",
      ingestionStatus: "rejected",
      lastError: "El archivo supera el tamaño máximo configurado.",
      detectedTitle: path.parse(safePath).name,
      summary: null,
      extractedText: null,
      tags: tagsFromPath(safePath),
      origin: null,
    };
  }
  if (BLOCKED.has(extension)) {
    return {
      ...base,
      parserName: "security-guard",
      ingestionStatus: "rejected",
      lastError: "Tipo de archivo bloqueado por seguridad.",
      detectedTitle: path.parse(safePath).name,
      summary: null,
      extractedText: null,
      tags: [],
      origin: null,
    };
  }
  if (!SUPPORTED.has(extension)) {
    return {
      ...base,
      parserName: "unsupported",
      ingestionStatus: "unsupported",
      lastError: "Formato todavía no procesado",
      detectedTitle: path.parse(safePath).name,
      summary: null,
      extractedText: null,
      tags: tagsFromPath(safePath),
      origin: null,
    };
  }
  try {
    const parsed = await parseFile(safePath, extension, buffer);
    return {
      ...base,
      parserName: parsed.parserName,
      ingestionStatus: parsed.warning ? "warning" : "processed",
      lastError: parsed.warning ?? null,
      detectedTitle: parsed.detectedTitle,
      summary: parsed.summary,
      extractedText: parsed.extractedText,
      tags: parsed.tags,
      origin: parsed.origin,
      ...(config.storeRaw
        ? { rawContentBase64: buffer.toString("base64") }
        : {}),
    };
  } catch (error) {
    return {
      ...base,
      parserName: `failed:${extension}`,
      ingestionStatus: "warning",
      lastError:
        error instanceof Error
          ? error.message.slice(0, 1000)
          : "No se pudo procesar el archivo.",
      detectedTitle: path.parse(safePath).name,
      summary: null,
      extractedText: null,
      tags: tagsFromPath(safePath),
      origin: null,
    };
  }
}

function mimeFromExtension(extension: string): string {
  const values: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    json: "application/json",
    jsonl: "application/x-ndjson",
    ndjson: "application/x-ndjson",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    yaml: "application/yaml",
    yml: "application/yaml",
    xml: "application/xml",
    rss: "application/rss+xml",
    atom: "application/atom+xml",
    html: "text/html",
    htm: "text/html",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  return values[extension] ?? "application/octet-stream";
}

async function endpointReady(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(new URL("/api/status", endpoint), {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureLocalServer(
  endpoint: string,
): Promise<ChildProcess | null> {
  if (await endpointReady(endpoint)) return null;
  const viteCli = path.resolve("node_modules", "vite", "bin", "vite.js");
  const child = spawn(process.execPath, [viteCli, "--host", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "ignore",
    windowsHide: true,
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await endpointReady(endpoint)) return child;
    if (child.exitCode !== null)
      throw new Error("No se pudo iniciar el Worker local para importar.");
  }
  child.kill();
  throw new Error("El Worker local no respondió a tiempo.");
}

async function submitBatch(
  endpoint: string,
  token: string,
  payload: ImportBatch,
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok)
    throw new Error(
      `La API de importación respondió ${response.status}: ${(await response.text()).slice(0, 500)}`,
    );
}

export async function runIngestion(): Promise<{
  discovered: number;
  processed: number;
  rejected: number;
  warnings: number;
}> {
  const config = readLocalConfig();
  await mkdir(config.root, { recursive: true });
  await access(config.root);
  const canonicalRoot = await realpath(config.root);
  const manifestPath = path.resolve(".wrangler", "import-manifest.json");
  let manifest: ImportManifest = {};
  try {
    manifest = JSON.parse(
      await readFile(manifestPath, "utf8"),
    ) as ImportManifest;
  } catch {
    manifest = {};
  }
  const startedAt = new Date().toISOString();
  const paths = await discoverFiles(canonicalRoot);
  const documents: Array<LocalDocument & { rawContentBase64?: string }> = [];
  for (const relativePath of paths) {
    try {
      const document = await createDocument(config, relativePath, manifest);
      if (document) documents.push(document);
    } catch (error) {
      if (!(error instanceof UnsafePathError)) throw error;
      console.warn(`Rechazado: ${relativePath} (${error.message})`);
    }
  }
  const runId = randomUUID();
  const rejected = documents.filter(
    (document) => document.ingestionStatus === "rejected",
  ).length;
  const warnings = documents.filter(
    (document) =>
      document.ingestionStatus === "warning" ||
      document.ingestionStatus === "unsupported",
  ).length;
  const server = await ensureLocalServer(config.endpoint);
  try {
    for (
      let index = 0;
      index < documents.length || (index === 0 && documents.length === 0);
      index += 50
    ) {
      const subset = documents.slice(index, index + 50);
      await submitBatch(config.endpoint, config.token, {
        runId: `${runId}-${index / 50}`,
        sourceAlias: "Biblioteca local",
        startedAt,
        completedAt: new Date().toISOString(),
        discoveredCount: paths.length,
        skippedCount: 0,
        rejectedCount: subset.filter(
          (item) => item.ingestionStatus === "rejected",
        ).length,
        warningCount: subset.filter(
          (item) =>
            item.ingestionStatus === "warning" ||
            item.ingestionStatus === "unsupported",
        ).length,
        documents: subset,
      });
    }
  } finally {
    if (server) server.kill();
  }
  const nextManifest = { ...manifest };
  for (const document of documents) {
    nextManifest[document.relativePath] = {
      sha256: document.sha256,
      parserVersion: document.parserVersion,
    };
  }
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(nextManifest, null, 2)}\n`,
    "utf8",
  );
  const result = {
    discovered: paths.length,
    processed: documents.length,
    rejected,
    warnings,
  };
  console.log(
    `Importación finalizada: ${result.processed}/${result.discovered} archivos actualizados, ${result.discovered - result.processed} sin cambios, ${rejected} rechazados, ${warnings} con advertencias.`,
  );
  return result;
}

const directInvocation =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (directInvocation)
  runIngestion().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
