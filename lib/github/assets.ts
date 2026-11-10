/** Hosts the asset proxy may fetch; shared by the worker and the sanitizer. */
export const ASSET_HOSTS = new Set([
  "raw.githubusercontent.com",
  "camo.githubusercontent.com",
  "user-images.githubusercontent.com",
  "avatars.githubusercontent.com",
  "private-user-images.githubusercontent.com",
  "github.com",
  "objects.githubusercontent.com",
  "media.githubusercontent.com",
]);

export function isAllowedAssetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ASSET_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function assetProxyUrl(absolute: string): string {
  return `/api/github/asset?u=${encodeURIComponent(absolute)}`;
}
