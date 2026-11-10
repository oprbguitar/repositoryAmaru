/**
 * Allowlist sanitizer for README HTML. Browser-only (uses DOMParser, which
 * builds an inert document). Output is rebuilt from scratch with createElement,
 * so nothing from the input tree survives unless it is explicitly allowed.
 */
import { assetProxyUrl, isAllowedAssetUrl } from "../../../lib/github/assets";

export type SanitizeContext = {
  owner: string;
  repo: string;
  ref: string;
  /** Directory of the document inside the repo ("" for the root README). */
  baseDir: string;
};

export type SanitizedImage = { src: string; alt: string; origin: string };

export type SanitizedDocument = { html: string; images: SanitizedImage[] };

const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "link",
  "meta",
  "base",
  "template",
  "noscript",
  "math",
  "svg",
  "video",
  "audio",
  "canvas",
  "button",
  "select",
  "textarea",
  "frame",
  "frameset",
  "applet",
  "head",
  "title",
]);

const ALLOWED_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "dd",
  "del",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "input",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "tt",
  "u",
  "ul",
  "var",
  "figure",
  "figcaption",
]);

const GLOBAL_ATTRS = new Set(["id", "title", "dir", "lang", "align"]);
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href"]),
  img: new Set(["alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  ol: new Set(["start"]),
  details: new Set(["open"]),
  input: new Set(["checked"]),
};

const BADGE_HOSTS =
  /(shields\.io|badge\.fury\.io|badgen\.net|codecov\.io|travis-ci|circleci\.com|coveralls\.io|bestpractices|snyk\.io|sonarcloud|badge\.svg|badges\/)/i;

function repoPath(context: SanitizeContext, relative: string): string {
  const base = `https://github.com/${context.owner}/${context.repo}/blob/${context.ref}/${context.baseDir ? `${context.baseDir.replace(/\/$/, "")}/` : ""}`;
  return new URL(relative, base).toString();
}

function toRawUrl(context: SanitizeContext, relative: string): string | null {
  try {
    const base = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${context.ref}/${context.baseDir ? `${context.baseDir.replace(/\/$/, "")}/` : ""}`;
    return new URL(relative, base).toString();
  } catch {
    return null;
  }
}

function safeLink(
  raw: string,
  context: SanitizeContext,
): { href: string; repoFile: string | null; external: boolean } | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("#")) {
    const fragment = value.slice(1);
    return /^[\w.:%-]*$/.test(fragment)
      ? { href: `#${fragment}`, repoFile: null, external: false }
      : null;
  }
  let url: URL;
  try {
    url = /^[a-z][a-z0-9+.-]*:/i.test(value)
      ? new URL(value)
      : new URL(repoPath(context, value));
  } catch {
    return null;
  }
  if (!["http:", "https:", "mailto:"].includes(url.protocol)) return null;
  let repoFile: string | null = null;
  const prefix = `/${context.owner}/${context.repo}/blob/${context.ref}/`;
  if (url.hostname === "github.com" && url.pathname.startsWith(prefix))
    repoFile = decodeURIComponent(url.pathname.slice(prefix.length));
  return { href: url.toString(), repoFile, external: true };
}

function walk(
  node: Node,
  out: Node,
  doc: Document,
  context: SanitizeContext,
  images: SanitizedImage[],
): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) {
      out.appendChild(doc.createTextNode(child.textContent ?? ""));
      continue;
    }
    if (child.nodeType !== 1) continue;
    const element = child as Element;
    const tag = element.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(tag)) continue;
    if (element.classList.contains("anchor")) continue;
    if (!ALLOWED_TAGS.has(tag)) {
      walk(element, out, doc, context, images);
      continue;
    }
    if (tag === "input" && element.getAttribute("type") !== "checkbox")
      continue;

    if (tag === "img") {
      const src = element.getAttribute("src") ?? "";
      const absolute = /^[a-z][a-z0-9+.-]*:/i.test(src.trim())
        ? src.trim()
        : toRawUrl(context, src.trim());
      const alt = element.getAttribute("alt") ?? "";
      if (!absolute || !isAllowedAssetUrl(absolute)) {
        if (alt) out.appendChild(doc.createTextNode(alt));
        continue;
      }
      const img = doc.createElement("img");
      const proxied = assetProxyUrl(absolute);
      img.setAttribute("src", proxied);
      img.setAttribute("loading", "lazy");
      img.setAttribute("referrerpolicy", "no-referrer");
      for (const name of ["alt", "width", "height"]) {
        const value = element.getAttribute(name);
        if (value !== null && (name === "alt" || /^\d{1,4}$/.test(value)))
          img.setAttribute(name, value);
      }
      const origin = element.getAttribute("data-canonical-src") ?? absolute;
      img.setAttribute("data-origin", origin);
      out.appendChild(img);
      images.push({ src: proxied, alt, origin });
      continue;
    }

    const clean = doc.createElement(tag);
    const allowed = TAG_ATTRS[tag];
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) continue;
      if (!GLOBAL_ATTRS.has(name) && !allowed?.has(name)) continue;
      if (name === "href") continue;
      if (name === "id" && !/^[\w:.-]{1,100}$/.test(attr.value)) continue;
      if (
        name === "align" &&
        !/^(left|right|center|justify)$/i.test(attr.value)
      )
        continue;
      if (name === "dir" && !/^(ltr|rtl|auto)$/i.test(attr.value)) continue;
      if (
        (name === "colspan" || name === "rowspan" || name === "start") &&
        !/^\d{1,4}$/.test(attr.value)
      )
        continue;
      clean.setAttribute(name, attr.value);
    }
    if (tag === "input") {
      clean.setAttribute("type", "checkbox");
      clean.setAttribute("disabled", "");
    }
    if (tag === "a") {
      const link = safeLink(element.getAttribute("href") ?? "", context);
      if (link) {
        clean.setAttribute("href", link.href);
        if (link.repoFile) clean.setAttribute("data-gh-path", link.repoFile);
        if (link.external) {
          clean.setAttribute("target", "_blank");
          clean.setAttribute("rel", "noopener noreferrer nofollow");
        }
      }
    }
    walk(element, clean, doc, context, images);
    out.appendChild(clean);
  }
}

export function sanitizeReadmeHtml(
  html: string,
  context: SanitizeContext,
): SanitizedDocument {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const doc = document.implementation.createHTMLDocument("");
  const root = doc.createElement("div");
  const images: SanitizedImage[] = [];
  walk(parsed.body, root, doc, context, images);
  return { html: root.innerHTML, images };
}

/** Screenshots worth a gallery: drops badges, shields and tiny icons. */
export function galleryImages(images: SanitizedImage[]): SanitizedImage[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (BADGE_HOSTS.test(image.origin) || seen.has(image.src)) return false;
    if (
      /\.svg(\?|$)/i.test(image.origin) &&
      /logo|icon|badge/i.test(image.origin)
    )
      return false;
    seen.add(image.src);
    return true;
  });
}
