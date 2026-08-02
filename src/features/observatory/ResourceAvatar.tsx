import { useState } from "react";

/** Deterministic tint from the owner name, so the fallback is stable per repo. */
const TINTS = [
  "var(--accent)",
  "var(--info)",
  "var(--purple)",
  "var(--ok)",
  "var(--warn)",
  "var(--danger)",
];

function tintFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1)
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/**
 * Owner avatar for a catalogue entry.
 *
 * GitHub publishes a canonical avatar per account, so it is loaded directly
 * from the owner name. If the request fails — offline, rate limited, or a
 * source without avatars — it degrades to a monogram instead of a broken image,
 * keeping the app usable without network access.
 */
export function ResourceAvatar({
  name,
  owner,
  source,
}: {
  name: string;
  owner: string | null;
  source: string;
}) {
  const [failed, setFailed] = useState(false);
  const seed = owner ?? name;
  const monogram = (owner ?? name).replace(/[^a-zA-Z0-9]/g, "").slice(0, 2);
  const isGithub = source.toLowerCase().includes("github") && Boolean(owner);

  if (isGithub && !failed) {
    return (
      <img
        className="resource-avatar"
        src={`https://avatars.githubusercontent.com/${encodeURIComponent(owner as string)}`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={34}
        height={34}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="resource-avatar resource-avatar-fallback"
      aria-hidden="true"
      style={{ color: tintFor(seed) }}
    >
      {monogram.toUpperCase() || "?"}
    </span>
  );
}
