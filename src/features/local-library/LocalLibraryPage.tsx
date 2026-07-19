import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bookmark,
  Check,
  CircleAlert,
  Clock3,
  Eye,
  File,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderLock,
  Image,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { LocalDocument } from "../../../types/api";
import {
  analyzeDocument,
  getDocument,
  getDocumentAnalysis,
  getDocuments,
  getLibraryStats,
  updateDocument,
} from "./api";

const statusLabels: Record<LocalDocument["ingestionStatus"], string> = {
  processed: "Procesado",
  warning: "Con advertencia",
  rejected: "Rechazado",
  unsupported: "No procesado",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string | null): string {
  if (!value) return "Sin escaneo";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FileTypeIcon({ extension }: { extension: string }) {
  if (["png", "jpg", "jpeg", "webp"].includes(extension)) return <Image />;
  if (["csv", "tsv", "xlsx"].includes(extension)) return <FileSpreadsheet />;
  if (["json", "jsonl", "ndjson", "yaml", "yml", "xml"].includes(extension))
    return <FileJson />;
  if (
    ["txt", "md", "markdown", "html", "htm", "pdf", "docx"].includes(extension)
  )
    return <FileText />;
  return <File />;
}

export function LocalLibraryPage() {
  const [params, setParams] = useSearchParams();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const filters = {
    q: params.get("q") ?? "",
    type: params.get("type") ?? "",
    status: params.get("status") ?? "",
  };
  const stats = useQuery({ queryKey: ["status"], queryFn: getLibraryStats });
  const documents = useQuery({
    queryKey: ["documents", filters],
    queryFn: () => getDocuments(filters),
    enabled: stats.data?.data.databaseStatus === "ready",
  });
  const detail = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId ?? ""),
    enabled: Boolean(documentId),
  });
  const mutation = useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: { isRelevant?: boolean; inWatchlist?: boolean };
    }) => updateDocument(id, update),
    onSuccess: (response) => {
      queryClient.setQueryData(["document", response.data.id], response);
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
  const typeOptions = useMemo(() => stats.data?.data.types ?? [], [stats.data]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  async function copyCommand() {
    await navigator.clipboard.writeText("pnpm ingest:local");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const selected = detail.data?.data;
  const library = stats.data?.data;
  const databaseNeedsMigration = library?.databaseStatus === "needs_migration";

  return (
    <div className="module-layout library-layout">
      <section className="module-main scroll-region">
        <header className="page-heading library-heading">
          <div>
            <h1>
              <Archive /> Mi biblioteca local
            </h1>
            <p>
              Documentos privados indexados y listos para buscar, relacionar y
              aplicar
            </p>
          </div>
          <div className="heading-actions">
            <button
              className="secondary-button compact"
              type="button"
              onClick={copyCommand}
            >
              {copied ? <Check /> : <RefreshCw />}
              {copied ? "Comando copiado" : "Reindexar"}
            </button>
          </div>
        </header>

        <div className="library-summary-grid">
          <article>
            <span className="summary-icon cyan">
              <Archive />
            </span>
            <div>
              <small>Descubiertos</small>
              <strong>{library?.discovered ?? "—"}</strong>
              <em>archivos</em>
            </div>
          </article>
          <article>
            <span className="summary-icon green">
              <ShieldCheck />
            </span>
            <div>
              <small>Procesados</small>
              <strong>{library?.processed ?? "—"}</strong>
              <em>disponibles</em>
            </div>
          </article>
          <article>
            <span className="summary-icon amber">
              <CircleAlert />
            </span>
            <div>
              <small>Advertencias</small>
              <strong>
                {(library?.warnings ?? 0) + (library?.unsupported ?? 0)}
              </strong>
              <em>por revisar</em>
            </div>
          </article>
          <article>
            <span className="summary-icon purple">
              <Clock3 />
            </span>
            <div>
              <small>Último escaneo</small>
              <strong className="date-value">
                {library?.lastScanAt
                  ? formatDate(library.lastScanAt).split(",")[0]
                  : "Pendiente"}
              </strong>
              <em>
                {library?.lastScanAt
                  ? formatDate(library.lastScanAt).split(",").slice(1).join(",")
                  : "ejecuta el importador"}
              </em>
            </div>
          </article>
        </div>

        <div className="library-toolbar">
          <label className="library-search">
            <Search />
            <input
              aria-label="Buscar archivos"
              value={filters.q}
              onChange={(event) => setFilter("q", event.target.value)}
              placeholder="Buscar por título, archivo, resumen o etiqueta…"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => setFilter("q", "")}
                aria-label="Limpiar búsqueda"
              >
                <X />
              </button>
            )}
          </label>
          <select
            aria-label="Filtrar por tipo"
            value={filters.type}
            onChange={(event) => setFilter("type", event.target.value)}
          >
            <option value="">Todos los tipos</option>
            {typeOptions.map((item) => (
              <option key={item.label} value={item.label.toLowerCase()}>
                {item.label} ({item.count})
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado"
            value={filters.status}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="processed">Procesados</option>
            <option value="warning">Con advertencia</option>
            <option value="unsupported">No procesados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        <section className="library-table-panel">
          <div className="table-heading">
            <div>
              <h2>Archivos indexados</h2>
              <span>{documents.data?.meta.total ?? 0} resultados</span>
            </div>
            <span className="safe-alias">
              <FolderLock /> {library?.directoryAlias ?? "Biblioteca local"}
            </span>
          </div>
          <div className="library-table-scroll">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th>Modificado</th>
                  <th>Estado</th>
                  <th>Etiquetas</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.data?.data.map((document) => (
                  <tr
                    key={document.id}
                    className={document.id === documentId ? "selected" : ""}
                    onDoubleClick={() =>
                      navigate(
                        `/local-library/${document.id}?${params.toString()}`,
                      )
                    }
                  >
                    <td>
                      <span className={`file-icon ${document.extension}`}>
                        <FileTypeIcon extension={document.extension} />
                      </span>
                      <div>
                        <strong>
                          {document.detectedTitle || document.fileName}
                        </strong>
                        <small>
                          {document.fileName} · {formatSize(document.sizeBytes)}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="type-chip">
                        {document.extension.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td>{formatDate(document.modifiedAt)}</td>
                    <td>
                      <span
                        className={`document-status ${document.ingestionStatus}`}
                      >
                        <i />
                        {statusLabels[document.ingestionStatus]}
                      </span>
                    </td>
                    <td>
                      <div className="tag-list">
                        {document.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                        {document.tags.length === 0 && (
                          <span className="muted-tag">Sin etiquetas</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/local-library/${document.id}?${params.toString()}`,
                            )
                          }
                        >
                          <Eye /> Previsualizar
                        </button>
                        <button
                          type="button"
                          className={document.inWatchlist ? "is-set" : ""}
                          onClick={() =>
                            mutation.mutate({
                              id: document.id,
                              update: { inWatchlist: !document.inWatchlist },
                            })
                          }
                          aria-label={
                            document.inWatchlist
                              ? "Quitar de seguimiento"
                              : "Añadir a seguimiento"
                          }
                        >
                          <Bookmark />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {documents.isLoading && (
              <LibraryMessage
                icon={<RefreshCw className="spin" />}
                title="Leyendo la biblioteca…"
                text="Consultando la base D1 local."
              />
            )}
            {documents.isError && (
              <LibraryMessage
                icon={<CircleAlert />}
                title="No se pudo leer la biblioteca"
                text="Comprueba que el Worker local siga activo."
              />
            )}
            {databaseNeedsMigration && (
              <LibraryMessage
                icon={<DatabaseIcon />}
                title="La base local necesita su migración inicial"
                text="Ejecuta pnpm db:migrate:local y vuelve a cargar esta vista."
              />
            )}
            {!documents.isLoading &&
              !documents.isError &&
              !databaseNeedsMigration &&
              documents.data?.data.length === 0 && (
                <LibraryMessage
                  icon={<Archive />}
                  title={
                    filters.q || filters.type || filters.status
                      ? "No hay coincidencias"
                      : "Aún no hay documentos indexados"
                  }
                  text={
                    filters.q || filters.type || filters.status
                      ? "Cambia o limpia los filtros para ampliar la búsqueda."
                      : "Coloca archivos en local-research y ejecuta pnpm ingest:local."
                  }
                />
              )}
          </div>
          <div className="table-footer">
            <span>Los originales permanecen sin cambios</span>
            <span>
              {documents.data?.data.length ?? 0} de{" "}
              {documents.data?.meta.total ?? 0}
            </span>
          </div>
        </section>
      </section>

      <aside
        className={`context-panel document-context scroll-region ${documentId ? "mobile-open" : ""}`}
      >
        <button
          className="close-context"
          type="button"
          onClick={() => navigate(`/local-library?${params.toString()}`)}
          aria-label="Cerrar detalle"
        >
          <X />
        </button>
        {selected ? (
          <DocumentContext
            document={selected}
            pending={mutation.isPending}
            onToggleRelevant={() =>
              mutation.mutate({
                id: selected.id,
                update: { isRelevant: !selected.isRelevant },
              })
            }
            onToggleWatchlist={() =>
              mutation.mutate({
                id: selected.id,
                update: { inWatchlist: !selected.inWatchlist },
              })
            }
          />
        ) : (
          <DefaultLibraryContext stats={library} />
        )}
      </aside>
      {documentId && (
        <button
          className="drawer-backdrop"
          type="button"
          onClick={() => navigate(`/local-library?${params.toString()}`)}
          aria-label="Cerrar detalle"
        />
      )}
    </div>
  );
}

function DatabaseIcon() {
  return <Archive />;
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
    },
  });
  const configured = stored.data?.meta.sourceStatus !== "not_configured";
  const analysis = analyze.data?.data ?? stored.data?.data ?? null;
  const hasText = Boolean(
    document.extractedText?.trim() || document.summary?.trim(),
  );
  return (
    <section className="analysis-section">
      <h3>
        <Sparkles /> Análisis con IA (NVIDIA)
      </h3>
      {!configured ? (
        <p className="context-empty">
          Fuente no configurada: define NVIDIA_API_KEY en .dev.vars y reinicia
          el Worker.
        </p>
      ) : !hasText ? (
        <p className="context-empty">
          Este documento no tiene texto extraído para analizar.
        </p>
      ) : (
        <>
          <div className="analysis-actions">
            <button
              type="button"
              className="secondary-button compact"
              disabled={analyze.isPending}
              onClick={() => analyze.mutate(Boolean(analysis))}
            >
              <RefreshCw className={analyze.isPending ? "spin" : ""} />
              {analyze.isPending
                ? "Analizando…"
                : analysis
                  ? "Reanalizar"
                  : "Analizar documento"}
            </button>
          </div>
          {analyze.isError ? (
            <div className="inline-warning">
              <CircleAlert />
              {analyze.error instanceof Error
                ? analyze.error.message
                : "No se pudo generar el análisis."}
            </div>
          ) : null}
          {analysis ? (
            <div className="analysis-result">
              <p>{analysis.summary}</p>
              {analysis.keyPoints.length ? (
                <>
                  <h4>Puntos clave</h4>
                  <ul>
                    {analysis.keyPoints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {analysis.entities.length ? (
                <>
                  <h4>Entidades detectadas</h4>
                  <div className="tag-list context-tags">
                    {analysis.entities.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </>
              ) : null}
              {analysis.risks.length ? (
                <>
                  <h4>Riesgos u observaciones</h4>
                  <ul>
                    {analysis.risks.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {analysis.recommendations.length ? (
                <>
                  <h4>Recomendaciones</h4>
                  <ul>
                    {analysis.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <small className="analysis-meta">
                Modelo {analysis.model} · {formatDate(analysis.generatedAt)} ·
                el texto se envía a la API de NVIDIA solo al solicitar el
                análisis
              </small>
            </div>
          ) : (
            <p className="context-empty">
              Genera un resumen, puntos clave, entidades, riesgos y
              recomendaciones a partir del texto extraído.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function LibraryMessage({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="library-message">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function DefaultLibraryContext({
  stats,
}: {
  stats?: {
    types: Array<{ label: string; count: number }>;
    lastScanAt: string | null;
    processed: number;
  };
}) {
  const total = stats?.types.reduce((sum, item) => sum + item.count, 0) ?? 0;
  return (
    <>
      <div className="context-title">
        <Info />
        <strong>Información contextual</strong>
      </div>
      <section>
        <h3>Biblioteca privada</h3>
        <p>
          AMARU indexa metadatos y texto extraído para búsqueda local. Nunca
          expone la ruta absoluta del directorio.
        </p>
      </section>
      <section>
        <h3>Distribución por tipo</h3>
        {stats?.types.length ? (
          <div className="type-distribution">
            {stats.types.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i>
                  <b
                    style={{
                      width: `${Math.max(8, (item.count / Math.max(total, 1)) * 100)}%`,
                    }}
                  />
                </i>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="context-empty">Aparecerá después del primer escaneo.</p>
        )}
      </section>
      <section>
        <h3>Último estado</h3>
        <dl className="context-stats">
          <div>
            <dt>Procesados</dt>
            <dd>{stats?.processed ?? 0}</dd>
          </div>
          <div>
            <dt>Escaneo</dt>
            <dd>
              {stats?.lastScanAt ? formatDate(stats.lastScanAt) : "Pendiente"}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Importación segura</h3>
        <ul className="check-list">
          <li>
            <Check /> Solo lectura
          </li>
          <li>
            <Check /> SHA-256 preservado
          </li>
          <li>
            <Check /> Sin rutas absolutas
          </li>
          <li>
            <Check /> OCR desactivado
          </li>
        </ul>
      </section>
    </>
  );
}

function DocumentContext({
  document,
  pending,
  onToggleRelevant,
  onToggleWatchlist,
}: {
  document: LocalDocument;
  pending: boolean;
  onToggleRelevant: () => void;
  onToggleWatchlist: () => void;
}) {
  return (
    <>
      <div className="context-title">
        <FileTypeIcon extension={document.extension} />
        <strong>Documento seleccionado</strong>
      </div>
      <section className="document-title">
        <span className="type-chip">{document.extension.toUpperCase()}</span>
        <h2>{document.detectedTitle || document.fileName}</h2>
        <p>{document.fileName}</p>
        <span className={`document-status ${document.ingestionStatus}`}>
          <i />
          {statusLabels[document.ingestionStatus]}
        </span>
      </section>
      <section>
        <h3>Resumen extraído</h3>
        <p>
          {document.summary || "Este archivo no contiene un resumen extraíble."}
        </p>
        {document.lastError && (
          <div className="inline-warning">
            <CircleAlert />
            {document.lastError}
          </div>
        )}
      </section>
      <section>
        <h3>Metadatos</h3>
        <dl className="metadata-list">
          <div>
            <dt>Tamaño</dt>
            <dd>{formatSize(document.sizeBytes)}</dd>
          </div>
          <div>
            <dt>Modificado</dt>
            <dd>{formatDate(document.modifiedAt)}</dd>
          </div>
          <div>
            <dt>Importado</dt>
            <dd>{formatDate(document.ingestedAt)}</dd>
          </div>
          <div>
            <dt>Parser</dt>
            <dd>
              {document.parserName} {document.parserVersion}
            </dd>
          </div>
          <div>
            <dt>SHA-256</dt>
            <dd className="hash">{document.sha256.slice(0, 16)}…</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>Etiquetas</h3>
        <div className="tag-list context-tags">
          {document.tags.map((tag) => (
            <span key={tag}>
              <Tag />
              {tag}
            </span>
          ))}
          {document.tags.length === 0 && (
            <p className="context-empty">Sin etiquetas detectadas.</p>
          )}
        </div>
      </section>
      <AnalysisSection document={document} />
      <section>
        <h3>Previsualización segura</h3>
        <div className="text-preview">
          {document.extractedText?.slice(0, 4000) ||
            "No hay texto disponible para este formato."}
        </div>
      </section>
      <div className="context-actions">
        <button
          type="button"
          disabled={pending}
          className={document.isRelevant ? "active" : ""}
          onClick={onToggleRelevant}
        >
          <Star />
          {document.isRelevant ? "Marcado relevante" : "Marcar relevante"}
        </button>
        <button
          type="button"
          disabled={pending}
          className={document.inWatchlist ? "active" : ""}
          onClick={onToggleWatchlist}
        >
          <Bookmark />
          {document.inWatchlist ? "En seguimiento" : "Añadir a seguimiento"}
        </button>
      </div>
    </>
  );
}
