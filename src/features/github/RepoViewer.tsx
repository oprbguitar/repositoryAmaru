import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  File as FileIcon,
  Folder,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { type MouseEvent, useMemo, useState } from "react";
import { assetProxyUrl } from "../../../lib/github/assets";
import type { RepoDetail, TreeEntry } from "../../../lib/github/types";
import { GithubApiError, githubApi } from "./api";
import {
  galleryImages,
  type SanitizedDocument,
  sanitizeReadmeHtml,
} from "./sanitize";

type Tab = "readme" | "files" | "preview" | "gallery";
type RepoRef = { owner: string; name: string; branch: string };

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

function ErrorNote({ error }: { error: unknown }) {
  const message =
    error instanceof GithubApiError
      ? error.code === "rate_limited"
        ? `${error.message}${error.rateLimit?.resetAt ? ` Se reinicia ${new Date(error.rateLimit.resetAt).toLocaleTimeString("es-PE")}.` : ""}`
        : error.message
      : "No se pudo cargar.";
  return (
    <p className="gh-note gh-note-warn" role="alert">
      {message}
    </p>
  );
}

function useReadme(repo: RepoRef) {
  const query = useQuery({
    queryKey: ["gh-readme", repo.owner, repo.name, repo.branch],
    queryFn: () => githubApi.readme(repo.owner, repo.name, repo.branch),
    staleTime: 600_000,
    retry: false,
  });
  const doc = useMemo<SanitizedDocument | null>(
    () =>
      query.data?.data.html
        ? sanitizeReadmeHtml(query.data.data.html, {
            owner: repo.owner,
            repo: repo.name,
            ref: repo.branch,
            baseDir: "",
          })
        : null,
    [query.data, repo],
  );
  return { query, doc };
}

function Rendered({
  html,
  onFile,
}: {
  html: string;
  onFile: (path: string) => void;
}) {
  function handle(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    const path = anchor?.getAttribute("data-gh-path");
    if (path) {
      event.preventDefault();
      onFile(path);
    }
  }
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: delegated handler for links that already are keyboard-focusable anchors
    // biome-ignore lint/a11y/noStaticElementInteractions: delegated click on sanitized anchors
    <div
      className="gh-md"
      onClick={handle}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: output of the allowlist sanitizer in lib/github/sanitize.ts
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FilesTab({
  repo,
  initialPath,
}: {
  repo: RepoRef;
  initialPath: string | null;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<string | null>(initialPath);
  const [filter, setFilter] = useState("");
  const tree = useQuery({
    queryKey: ["gh-tree", repo.owner, repo.name, repo.branch],
    queryFn: () => githubApi.tree(repo.owner, repo.name, repo.branch),
    staleTime: 600_000,
    retry: false,
  });
  const isImage = path ? IMAGE_EXT.test(path) : false;
  const file = useQuery({
    queryKey: ["gh-file", repo.owner, repo.name, repo.branch, path],
    queryFn: () =>
      githubApi.file(repo.owner, repo.name, repo.branch, path as string),
    enabled: !!path && !isImage,
    staleTime: 600_000,
    retry: false,
  });
  const entries = tree.data?.data.entries ?? [];
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const list = needle
      ? entries.filter((e) => e.path.toLowerCase().includes(needle))
      : entries.filter((entry) => {
          const parts = entry.path.split("/");
          for (let i = 1; i < parts.length; i += 1)
            if (!open.has(parts.slice(0, i).join("/"))) return false;
          return true;
        });
    return list.slice(0, 600);
  }, [entries, filter, open]);

  function toggle(entry: TreeEntry) {
    if (entry.type === "blob") return setPath(entry.path);
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(entry.path)) next.add(entry.path);
      return next;
    });
  }

  const fileDoc = useMemo(() => {
    const html = file.data?.data.html;
    if (!html || !path) return null;
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    return sanitizeReadmeHtml(html, {
      owner: repo.owner,
      repo: repo.name,
      ref: repo.branch,
      baseDir: dir,
    });
  }, [file.data, path, repo]);

  return (
    <div className="gh-files">
      <div className="gh-tree">
        <input
          className="gh-input"
          type="search"
          placeholder="Filtrar archivos"
          aria-label="Filtrar archivos"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        {tree.isLoading ? <p className="gh-note">Cargando árbol…</p> : null}
        {tree.error ? <ErrorNote error={tree.error} /> : null}
        {tree.data?.data.truncated ? (
          <p className="gh-note">
            Árbol limitado a {entries.length} de {tree.data.data.total}{" "}
            entradas.
          </p>
        ) : null}
        <ul className="gh-tree-list">
          {visible.map((entry) => {
            const depth = entry.path.split("/").length - 1;
            const name = entry.path.split("/").pop();
            const isOpen = open.has(entry.path);
            return (
              <li key={entry.path}>
                <button
                  type="button"
                  className="gh-tree-row"
                  aria-current={path === entry.path}
                  style={{
                    paddingInlineStart: `calc(var(--space-2) + ${depth} * var(--space-3))`,
                  }}
                  onClick={() => toggle(entry)}
                  title={entry.path}
                >
                  {entry.type === "tree" ? (
                    isOpen ? (
                      <FolderOpen />
                    ) : (
                      <Folder />
                    )
                  ) : (
                    <FileIcon />
                  )}
                  <span>{filter ? entry.path : name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="gh-file-view">
        {!path ? (
          <p className="gh-note">Elige un archivo del árbol.</p>
        ) : (
          <>
            <div className="gh-file-head">
              <code>{path}</code>
              <a
                href={`https://github.com/${repo.owner}/${repo.name}/blob/${repo.branch}/${path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub <ExternalLink />
              </a>
            </div>
            {isImage ? (
              <img
                className="gh-file-image"
                alt={path}
                src={assetProxyUrl(
                  `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${path}`,
                )}
              />
            ) : file.isLoading ? (
              <p className="gh-note">Cargando archivo…</p>
            ) : file.error ? (
              <ErrorNote error={file.error} />
            ) : file.data?.data.kind === "binary" ? (
              <p className="gh-note">Archivo binario: no se muestra.</p>
            ) : file.data?.data.kind === "too-large" ? (
              <p className="gh-note">
                Archivo demasiado grande para mostrarlo aquí.
              </p>
            ) : fileDoc ? (
              <Rendered html={fileDoc.html} onFile={setPath} />
            ) : (
              <>
                {file.data?.data.truncated ? (
                  <p className="gh-note">Mostrando los primeros 200 KB.</p>
                ) : null}
                <pre className="gh-code">
                  {(file.data?.data.text ?? "")
                    .split("\n")
                    .map((line, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: static line list
                      <span key={index} className="gh-line" data-n={index + 1}>
                        {line}
                        {"\n"}
                      </span>
                    ))}
                </pre>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PreviewTab({ detail }: { detail: RepoDetail }) {
  const options = [
    detail.preview.pagesUrl
      ? { label: "GitHub Pages (derivada)", url: detail.preview.pagesUrl }
      : null,
    detail.preview.homepage
      ? { label: "Sitio del proyecto", url: detail.preview.homepage }
      : null,
  ].filter((item): item is { label: string; url: string } => item !== null);
  const [chosen, setChosen] = useState(0);
  const current = options[chosen];
  const check = useQuery({
    queryKey: ["gh-preview-check", current?.url],
    queryFn: () => githubApi.previewCheck(current.url),
    enabled: !!current,
    retry: false,
    staleTime: 600_000,
  });
  if (!current)
    return (
      <p className="gh-note">
        Este repositorio no declara homepage ni GitHub Pages: no hay vista
        previa en vivo. Revisa la galería del README.
      </p>
    );
  const result = check.data?.data;
  return (
    <div className="gh-preview">
      <div className="gh-preview-bar">
        {options.map((option, index) => (
          <button
            key={option.url}
            type="button"
            className="gh-chip"
            aria-pressed={index === chosen}
            onClick={() => setChosen(index)}
          >
            {option.label}
          </button>
        ))}
        <code>{current.url}</code>
        <a href={current.url} target="_blank" rel="noopener noreferrer">
          Abrir <ExternalLink />
        </a>
      </div>
      {check.isLoading ? (
        <p className="gh-note">Comprobando si se puede incrustar…</p>
      ) : null}
      {check.error ? <ErrorNote error={check.error} /> : null}
      {result && !result.embeddable ? (
        <p className="gh-note gh-note-warn">
          No se puede incrustar: {result.reason} Ábrelo en una pestaña nueva.
        </p>
      ) : null}
      {result?.embeddable ? (
        <>
          <iframe
            title={`Vista previa de ${current.url}`}
            src={current.url}
            className="gh-frame"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
          <p className="gh-note">
            Sandbox: <code>allow-scripts allow-same-origin</code>. El sitio
            corre en su propio origen (no el de AMARU), así que puede usar su
            JavaScript y su almacenamiento sin acceder a esta aplicación; quedan
            bloqueados formularios, ventanas emergentes y navegación superior.
            Si ves un recuadro vacío, la política de seguridad de la plataforma
            aún no permite este dominio.
          </p>
        </>
      ) : null}
    </div>
  );
}

export function RepoViewer({
  detail,
  onClose,
}: {
  detail: RepoDetail;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("readme");
  const [openPath, setOpenPath] = useState<string | null>(null);
  const repo: RepoRef = {
    owner: detail.repo.owner,
    name: detail.repo.name,
    branch: detail.repo.defaultBranch,
  };
  const { query, doc } = useReadme(repo);
  const gallery = useMemo(() => galleryImages(doc?.images ?? []), [doc]);
  const tabs: Array<[Tab, string]> = [
    ["readme", "README"],
    ["files", "Archivos"],
    ["preview", "Vista previa"],
    ["gallery", `Galería (${gallery.length})`],
  ];
  return (
    <section
      className="gh-viewer"
      aria-label={`Visor de ${detail.repo.fullName}`}
    >
      <header className="gh-viewer-head">
        <button type="button" className="gh-btn" onClick={onClose}>
          <ArrowLeft /> Lista
        </button>
        <h2>{detail.repo.fullName}</h2>
        <span className="gh-verified">
          <ShieldCheck /> Datos de la API de GitHub,{" "}
          {new Date(detail.fetchedAt).toLocaleString("es-PE")}
        </span>
      </header>
      <div className="gh-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className="gh-tab"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="gh-viewer-body">
        {tab === "readme" ? (
          query.isLoading ? (
            <p className="gh-note">Cargando README…</p>
          ) : query.error ? (
            <ErrorNote error={query.error} />
          ) : doc ? (
            <Rendered
              html={doc.html}
              onFile={(path) => {
                setOpenPath(path);
                setTab("files");
              }}
            />
          ) : (
            <p className="gh-note">Este repositorio no tiene README.</p>
          )
        ) : null}
        {tab === "files" ? (
          <FilesTab repo={repo} initialPath={openPath} />
        ) : null}
        {tab === "preview" ? <PreviewTab detail={detail} /> : null}
        {tab === "gallery" ? (
          gallery.length ? (
            <ul className="gh-gallery">
              {gallery.map((image) => (
                <li key={image.src}>
                  <img src={image.src} alt={image.alt} loading="lazy" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="gh-note">
              El README no incluye capturas o imágenes (se excluyen insignias).
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}
