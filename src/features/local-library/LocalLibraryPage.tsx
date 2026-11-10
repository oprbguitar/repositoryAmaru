import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bookmark,
  Check,
  CircleAlert,
  FolderLock,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { LocalDocument } from "../../../types/api";
import {
  analyzeDocument,
  getAnalyzedIds,
  getDocument,
  getDocumentAnalysis,
  getDocuments,
  getLibraryStats,
  updateDocument,
} from "./api";
import "./local-library.css";
import {
  type AnalysisFilter,
  applyView,
  collectTags,
  displayTitle,
  formatSize,
  KIND_LABEL,
  kindOf,
  type SortKey,
} from "./libraryView";

const statusLabels: Record<LocalDocument["ingestionStatus"], string> = {
  processed: "Procesado",
  warning: "Con advertencia",
  rejected: "Rechazado",
  unsupported: "No procesado",
};

function formatDate(value: string | null): string {
  if (!value) return "Sin escaneo";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function readView(): "grid" | "list" {
  try {
    return localStorage.getItem("amaru-library-view") === "list"
      ? "list"
      : "grid";
  } catch {
    return "grid";
  }
}

type UpdatePayload = { isRelevant?: boolean; inWatchlist?: boolean };

export function LocalLibraryPage() {
  const [params, setParams] = useSearchParams();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"grid" | "list">(readView);
  const filters = {
    q: params.get("q") ?? "",
    type: params.get("type") ?? "",
    status: params.get("status") ?? "",
  };
  const tag = params.get("tag") ?? "";
  const analysis = (params.get("analysis") ?? "") as AnalysisFilter;
  const sort = (params.get("sort") ?? "recent") as SortKey;
  const watchlist = params.get("watch") === "1";

  const stats = useQuery({ queryKey: ["status"], queryFn: getLibraryStats });
  const documents = useQuery({
    queryKey: ["documents", filters],
    queryFn: () => getDocuments(filters),
    enabled: stats.data?.data.databaseStatus === "ready",
  });
  const analyzed = useQuery({
    queryKey: ["analyzed-ids"],
    queryFn: getAnalyzedIds,
    retry: false,
  });
  const detail = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId ?? ""),
    enabled: Boolean(documentId),
  });
  const mutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: UpdatePayload }) =>
      updateDocument(id, update),
    onSuccess: (response) => {
      queryClient.setQueryData(["document", response.data.id], response);
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const loaded = documents.data?.data;
  const analyzedIds = useMemo(
    () => new Set(analyzed.data ?? []),
    [analyzed.data],
  );
  const tags = useMemo(() => collectTags(loaded ?? []), [loaded]);
  const visible = useMemo(
    () =>
      applyView(loaded ?? [], { tag, analysis, watchlist }, analyzedIds, sort),
    [loaded, tag, analysis, watchlist, analyzedIds, sort],
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  function chooseView(next: "grid" | "list") {
    setView(next);
    try {
      localStorage.setItem("amaru-library-view", next);
    } catch {
      // Sin almacenamiento: la vista solo dura la sesión.
    }
  }
  function open(id: string) {
    navigate(`/local-library/${id}?${params.toString()}`);
  }
  function close() {
    navigate(`/local-library?${params.toString()}`);
  }
  async function copyCommand() {
    await navigator.clipboard.writeText("pnpm ingest:local");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const library = stats.data?.data;
  const selected = detail.data?.data;
  const needsMigration = library?.databaseStatus === "needs_migration";
  const filtered = Boolean(
    filters.q || filters.type || filters.status || tag || analysis || watchlist,
  );
  const total = documents.data?.meta.total ?? 0;

  return (
    <div className={`ll-root ${documentId ? "has-reader" : ""}`}>
      <section className="ll-main">
        <header className="ll-head">
          <div>
            <h1>
              <Archive /> Mi biblioteca local
            </h1>
            <p>
              <strong>{library?.discovered ?? "—"}</strong> archivos ·{" "}
              <strong>{library?.processed ?? "—"}</strong> procesados ·{" "}
              <strong>
                {(library?.warnings ?? 0) + (library?.unsupported ?? 0)}
              </strong>{" "}
              por revisar · último escaneo{" "}
              {library?.lastScanAt
                ? formatDate(library.lastScanAt)
                : "pendiente"}
            </p>
          </div>
          <button type="button" className="ll-btn" onClick={copyCommand}>
            {copied ? <Check /> : <RefreshCw />}
            {copied ? "Comando copiado" : "Reindexar"}
          </button>
        </header>

        <div className="ll-toolbar">
          <label className="ll-search">
            <Search />
            <input
              aria-label="Buscar archivos"
              value={filters.q}
              onChange={(event) => setParam("q", event.target.value)}
              placeholder="Título, archivo, resumen o etiqueta…"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() => setParam("q", "")}
                aria-label="Limpiar búsqueda"
              >
                <X />
              </button>
            ) : null}
          </label>
          <select
            aria-label="Filtrar por tipo"
            value={filters.type}
            onChange={(event) => setParam("type", event.target.value)}
          >
            <option value="">Todos los tipos</option>
            {(library?.types ?? []).map((item) => (
              <option key={item.label} value={item.label.toLowerCase()}>
                {item.label} ({item.count})
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado de ingesta"
            value={filters.status}
            onChange={(event) => setParam("status", event.target.value)}
          >
            <option value="">Toda ingesta</option>
            <option value="processed">Procesados</option>
            <option value="warning">Con advertencia</option>
            <option value="unsupported">No procesados</option>
            <option value="rejected">Rechazados</option>
          </select>
          <select
            aria-label="Filtrar por etiqueta"
            value={tag}
            onChange={(event) => setParam("tag", event.target.value)}
          >
            <option value="">Toda etiqueta</option>
            {tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por análisis"
            value={analysis}
            onChange={(event) => setParam("analysis", event.target.value)}
          >
            <option value="">Con o sin análisis</option>
            <option value="analyzed">Analizados con IA</option>
            <option value="pending">Sin analizar</option>
          </select>
          <select
            aria-label="Ordenar"
            value={sort}
            onChange={(event) =>
              setParam(
                "sort",
                event.target.value === "recent" ? "" : event.target.value,
              )
            }
          >
            <option value="recent">Más recientes</option>
            <option value="name">Nombre</option>
            <option value="size">Tamaño</option>
            <option value="type">Tipo</option>
          </select>
          <button
            type="button"
            className={`ll-toggle ${watchlist ? "is-selected" : ""}`}
            aria-pressed={watchlist}
            onClick={() => setParam("watch", watchlist ? "" : "1")}
          >
            <Bookmark /> Seguimiento
          </button>
          <fieldset className="ll-view" aria-label="Vista">
            <button
              type="button"
              className={view === "grid" ? "is-selected" : ""}
              aria-pressed={view === "grid"}
              onClick={() => chooseView("grid")}
              title="Estantería"
            >
              <LayoutGrid />
            </button>
            <button
              type="button"
              className={view === "list" ? "is-selected" : ""}
              aria-pressed={view === "list"}
              onClick={() => chooseView("list")}
              title="Lista densa"
            >
              <List />
            </button>
          </fieldset>
        </div>

        <div className="ll-count">
          <span>
            {visible.length} de {total} resultados
          </span>
          <span>
            <FolderLock /> {library?.directoryAlias ?? "Biblioteca local"} ·
            originales sin cambios
          </span>
        </div>

        <div className="ll-scroll">
          {documents.isLoading ? (
            <div className="ll-shelf" aria-busy="true">
              {Array.from({ length: 8 }, (_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: marcadores de carga fijos
                <div key={index} className="ll-skeleton" />
              ))}
            </div>
          ) : null}
          {documents.isError ? (
            <Message
              icon={<CircleAlert />}
              title="No se pudo leer la biblioteca"
              text="Comprueba que el Worker local siga activo."
            />
          ) : null}
          {needsMigration ? (
            <Message
              icon={<Archive />}
              title="La base local necesita su migración inicial"
              text="Ejecuta pnpm db:migrate:local y recarga."
            />
          ) : null}
          {!documents.isLoading &&
          !documents.isError &&
          !needsMigration &&
          visible.length === 0 ? (
            <Message
              icon={<Archive />}
              title={
                filtered
                  ? "No hay coincidencias"
                  : "Aún no hay documentos indexados"
              }
              text={
                filtered
                  ? "Cambia o limpia los filtros."
                  : "Coloca archivos en local-research y ejecuta pnpm ingest:local."
              }
            />
          ) : null}

          {visible.length && view === "grid" ? (
            <ul className="ll-shelf">
              {visible.map((document, index) => (
                <li
                  key={document.id}
                  style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
                >
                  <button
                    type="button"
                    className={`ll-book ${document.id === documentId ? "is-selected" : ""}`}
                    onClick={() => open(document.id)}
                  >
                    <span
                      className={`ll-cover kind-${kindOf(document.extension)}`}
                    >
                      <b>{document.extension || "—"}</b>
                      <span>{displayTitle(document)}</span>
                      {document.inWatchlist ? (
                        <Bookmark className="ll-pin" />
                      ) : null}
                    </span>
                    <strong>{displayTitle(document)}</strong>
                    <small>
                      {KIND_LABEL[kindOf(document.extension)]} ·{" "}
                      {formatSize(document.sizeBytes)}
                    </small>
                    <span className="ll-flags">
                      <i className={`ll-status ${document.ingestionStatus}`}>
                        {statusLabels[document.ingestionStatus]}
                      </i>
                      {analyzedIds.has(document.id) ? (
                        <i className="ll-ai">
                          <Sparkles /> IA
                        </i>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {visible.length && view === "list" ? (
            <table className="ll-table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th>Modificado</th>
                  <th>Ingesta</th>
                  <th>Etiquetas</th>
                  <th>
                    <span className="sr-only">Seguimiento</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((document) => (
                  <tr
                    key={document.id}
                    className={document.id === documentId ? "is-selected" : ""}
                  >
                    <td>
                      <button
                        type="button"
                        className="ll-row-open"
                        onClick={() => open(document.id)}
                      >
                        <span
                          className={`ll-chip kind-${kindOf(document.extension)}`}
                        >
                          {document.extension || "—"}
                        </span>
                        <span>
                          <strong>{displayTitle(document)}</strong>
                          <small>
                            {document.fileName} ·{" "}
                            {formatSize(document.sizeBytes)}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>{KIND_LABEL[kindOf(document.extension)]}</td>
                    <td>{formatDate(document.modifiedAt)}</td>
                    <td>
                      <i className={`ll-status ${document.ingestionStatus}`}>
                        {statusLabels[document.ingestionStatus]}
                      </i>
                      {analyzedIds.has(document.id) ? (
                        <i className="ll-ai">
                          <Sparkles /> IA
                        </i>
                      ) : null}
                    </td>
                    <td className="ll-tags">
                      {document.tags.slice(0, 3).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`ll-icon ${document.inWatchlist ? "is-selected" : ""}`}
                        aria-label={
                          document.inWatchlist
                            ? "Quitar de seguimiento"
                            : "Añadir a seguimiento"
                        }
                        onClick={() =>
                          mutation.mutate({
                            id: document.id,
                            update: { inWatchlist: !document.inWatchlist },
                          })
                        }
                      >
                        <Bookmark />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </section>

      <aside className="ll-reader" aria-label="Visor del documento">
        {documentId ? (
          <>
            <button
              type="button"
              className="ll-close"
              onClick={close}
              aria-label="Cerrar visor"
            >
              <X />
            </button>
            {selected ? (
              <Reader
                document={selected}
                pending={mutation.isPending}
                onUpdate={(update) =>
                  mutation.mutate({ id: selected.id, update })
                }
              />
            ) : (
              <p className="ll-muted">
                {detail.isError
                  ? "No se pudo abrir el documento."
                  : "Abriendo documento…"}
              </p>
            )}
          </>
        ) : (
          <Overview types={library?.types ?? []} />
        )}
      </aside>
      {documentId ? (
        <button
          type="button"
          className="ll-backdrop"
          onClick={close}
          aria-label="Cerrar visor"
        />
      ) : null}
    </div>
  );
}

function Message({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="ll-message">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Overview({
  types,
}: {
  types: Array<{ label: string; count: number }>;
}) {
  const total = types.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="ll-overview">
      <h2>Por tipo</h2>
      {types.length ? (
        <ul>
          {types.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <i>
                <b
                  style={{
                    width: `${Math.max(6, (item.count / Math.max(total, 1)) * 100)}%`,
                  }}
                />
              </i>
              <em>{item.count}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ll-muted">Aparece tras el primer escaneo.</p>
      )}
      <p className="ll-muted">
        Selecciona un documento para leerlo con su ficha, análisis y etiquetas.
      </p>
    </div>
  );
}

type Tab = "text" | "analysis" | "sheet";

function Reader({
  document,
  pending,
  onUpdate,
}: {
  document: LocalDocument;
  pending: boolean;
  onUpdate: (update: UpdatePayload) => void;
}) {
  const [tab, setTab] = useState<Tab>("text");
  const kind = kindOf(document.extension);
  const tabs: Array<[Tab, string]> = [
    ["text", "Lectura"],
    ["analysis", "Análisis IA"],
    ["sheet", "Ficha"],
  ];
  return (
    <div className="ll-reader-body">
      <div className="ll-reader-head">
        <span className={`ll-chip kind-${kind}`}>{document.extension}</span>
        <div>
          <h2>{displayTitle(document)}</h2>
          <p>
            {document.fileName} · {formatSize(document.sizeBytes)}
          </p>
        </div>
      </div>
      <div className="ll-actions">
        <button
          type="button"
          className={document.isRelevant ? "is-selected" : ""}
          aria-pressed={document.isRelevant}
          disabled={pending}
          onClick={() => onUpdate({ isRelevant: !document.isRelevant })}
        >
          <Star /> {document.isRelevant ? "Relevante" : "Marcar relevante"}
        </button>
        <button
          type="button"
          className={document.inWatchlist ? "is-selected" : ""}
          aria-pressed={document.inWatchlist}
          disabled={pending}
          onClick={() => onUpdate({ inWatchlist: !document.inWatchlist })}
        >
          <Bookmark /> {document.inWatchlist ? "En seguimiento" : "Seguir"}
        </button>
      </div>
      <div className="ll-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "is-selected" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="ll-tabpanel">
        {tab === "text" ? (
          <>
            {document.summary ? (
              <p className="ll-summary">{document.summary}</p>
            ) : null}
            {document.lastError ? (
              <p className="ll-warning">
                <CircleAlert /> {document.lastError}
              </p>
            ) : null}
            <pre className="ll-text">
              {document.extractedText?.slice(0, 6000) ||
                "No hay texto disponible para este formato."}
            </pre>
          </>
        ) : null}
        {tab === "analysis" ? <AnalysisSection document={document} /> : null}
        {tab === "sheet" ? (
          <>
            <dl className="ll-facts">
              <dt>Estado</dt>
              <dd>{statusLabels[document.ingestionStatus]}</dd>
              <dt>Modificado</dt>
              <dd>{formatDate(document.modifiedAt)}</dd>
              <dt>Importado</dt>
              <dd>{formatDate(document.ingestedAt)}</dd>
              <dt>Parser</dt>
              <dd>
                {document.parserName} {document.parserVersion}
              </dd>
              <dt>SHA-256</dt>
              <dd className="mono">{document.sha256.slice(0, 16)}…</dd>
              <dt>Origen</dt>
              <dd>{document.origin ?? document.sourceAlias}</dd>
            </dl>
            <h3 className="ll-sub">Etiquetas</h3>
            <div className="ll-tags">
              {document.tags.length ? (
                document.tags.map((item) => <span key={item}>{item}</span>)
              ) : (
                <p className="ll-muted">Sin etiquetas detectadas.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function AnalysisSection({ document }: { document: LocalDocument }) {
  const queryClient = useQueryClient();
  const stored = useQuery({
    queryKey: ["document-analysis", document.id],
    queryFn: () => getDocumentAnalysis(document.id),
  });
  const analyze = useMutation({
    mutationFn: (force: boolean) => analyzeDocument(document.id, force),
    onSuccess: (response) => {
      queryClient.setQueryData(["document-analysis", document.id], response);
      void queryClient.invalidateQueries({ queryKey: ["analyzed-ids"] });
    },
  });
  const configured = stored.data?.meta.sourceStatus !== "not_configured";
  const result = analyze.data?.data ?? stored.data?.data ?? null;
  const hasText = Boolean(
    document.extractedText?.trim() || document.summary?.trim(),
  );
  if (!configured)
    return (
      <p className="ll-muted">
        Fuente no configurada: define NVIDIA_API_KEY (Admin, Claves de API).
      </p>
    );
  if (!hasText)
    return <p className="ll-muted">Sin texto extraído para analizar.</p>;
  const lists: Array<[string, string[]]> = result
    ? [
        ["Puntos clave", result.keyPoints],
        ["Riesgos u observaciones", result.risks],
        ["Recomendaciones", result.recommendations],
      ]
    : [];
  return (
    <>
      <button
        type="button"
        className="ll-btn"
        disabled={analyze.isPending}
        onClick={() => analyze.mutate(Boolean(result))}
      >
        <RefreshCw className={analyze.isPending ? "ll-spin" : ""} />
        {analyze.isPending
          ? "Analizando…"
          : result
            ? "Reanalizar"
            : "Analizar documento"}
      </button>
      {analyze.isError ? (
        <p className="ll-warning">
          <CircleAlert />{" "}
          {analyze.error instanceof Error
            ? analyze.error.message
            : "No se pudo generar el análisis."}
        </p>
      ) : null}
      {result ? (
        <div className="ll-analysis">
          <p className="ll-summary">{result.summary}</p>
          {lists.map(([title, items]) =>
            items.length ? (
              <div key={title}>
                <h3 className="ll-sub">{title}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {result.entities.length ? (
            <>
              <h3 className="ll-sub">Entidades</h3>
              <div className="ll-tags">
                {result.entities.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </>
          ) : null}
          <small className="ll-muted">
            {result.model} · {formatDate(result.generatedAt)}. El texto se envía
            a NVIDIA solo al pedir el análisis.
          </small>
        </div>
      ) : (
        <p className="ll-muted">
          Genera resumen, puntos clave, entidades y riesgos.
        </p>
      )}
    </>
  );
}
