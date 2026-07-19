import { lstat, realpath } from "node:fs/promises";
import path from "node:path";

export class UnsafePathError extends Error {}

export function normalizeRelativePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").normalize("NFC");
  if (
    normalized.length === 0 ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized
      .split("/")
      .some((segment) => segment === ".." || segment === ".") ||
    normalized.includes("\0")
  ) {
    throw new UnsafePathError("La ruta no está permitida.");
  }
  return normalized;
}

export async function resolveSafeFile(
  root: string,
  candidate: string,
): Promise<string> {
  const canonicalRoot = await realpath(root);
  const relative = normalizeRelativePath(candidate);
  const requested = path.resolve(canonicalRoot, relative);
  const canonicalCandidate = await realpath(requested);
  const relation = path.relative(canonicalRoot, canonicalCandidate);
  if (relation.startsWith("..") || path.isAbsolute(relation)) {
    throw new UnsafePathError(
      "El archivo está fuera de la biblioteca configurada.",
    );
  }
  const metadata = await lstat(requested);
  if (metadata.isSymbolicLink()) {
    throw new UnsafePathError("No se permiten enlaces simbólicos.");
  }
  if (!metadata.isFile()) {
    throw new UnsafePathError("La ruta no corresponde a un archivo regular.");
  }
  return canonicalCandidate;
}

export function safeDisplayPath(value: string): string {
  return normalizeRelativePath(value)
    .split("/")
    .map((segment) =>
      [...segment]
        .filter((character) => {
          const code = character.charCodeAt(0);
          return code > 31 && code !== 127;
        })
        .join(""),
    )
    .join("/");
}
