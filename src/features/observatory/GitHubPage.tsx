import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitFork, Plus, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  findRepoType,
  INTERNATIONAL_TOPICS,
  REPO_GROUPS,
} from "../../../lib/github/collections";
import {
  buildSearchQuery,
  githubSearchUrl,
  normalizeTopic,
} from "../../../lib/github/query";
import type {
  QuerySpec,
  RepoDetail,
  SearchSort,
} from "../../../lib/github/types";
import { revealOnMobile } from "../../components/layout/mobile";
import { useAdminSession } from "../admin/adminApi";
import {
  GithubApiError,
  githubApi,
  readStored,
  writeStored,
} from "../github/api";
import { ProfilePanel } from "../github/ProfilePanel";
import { RepoInspector } from "../github/RepoInspector";
import { RepoViewer } from "../github/RepoViewer";
import { formatDate, formatNumber } from "./format";
import "../github/github.css";
import { AdminNote } from "../admin/AdminNote";

type Source =
  | { kind: "type"; id: string }
  | { kind: "topic"; topic: string }
  | { kind: "personal" }
  | { kind: "mine"; user: string }
  | { kind: "custom"; label: string; spec: QuerySpec };

const TOPICS_KEY = "amaru-github-topics";
const OWNERS_KEY = "amaru-github-owners";
/** Only the local install starts with the owner's account; online, visitors add their own. */
const LOCAL_DEFAULT_OWNER = "oprbguitar";
const GITHUB_LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
type Visibility = "all" | "public" | "private";
const SORT_LABELS: Record<SearchSort, string> = {
  stars: "Más estrellas",
  updated: "Actualizados",
  forks: "Más forks",
  "best-match": "Mejor coincidencia",
};

function sourceLabel(source: Source): string {
  if (source.kind === "type") return findRepoType(source.id)?.label ?? "Tipo";
  if (source.kind === "topic") return `topic:${source.topic}`;
  if (source.kind === "personal") return "Mis topics";
  if (source.kind === "mine") return `Repositorios · ${source.user}`;
  return source.label;
}

export function GitHubPage() {
  const [source, setSource] = useState<Source>({
    kind: "type",
    id: "design-systems",
  });
  const [sort, setSort] = useState<SearchSort>("stars");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewing, setViewing] = useState<RepoDetail | null>(null);
  const [myTopics, setMyTopics] = useState<string[]>(() =>
    readStored(TOPICS_KEY, []),
  );
  const [matchAll, setMatchAll] = useState(false);
  const [draft, setDraft] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const session = useAdminSession();
  const [storedOwners, setStoredOwners] = useState<string[] | null>(() =>
    readStored<string[] | null>(OWNERS_KEY, null),
  );
  const owners =
    storedOwners ??
    (session.data?.mode === "local" ? [LOCAL_DEFAULT_OWNER] : []);
  const [ownerDraft, setOwnerDraft] = useState("");
  const ownerValid = GITHUB_LOGIN.test(ownerDraft.trim());
  function saveOwners(next: string[]) {
    setStoredOwners(next);
    writeStored(OWNERS_KEY, next);
  }
  function addOwner() {
    const login = ownerDraft.trim();
    if (!GITHUB_LOGIN.test(login)) return;
    if (!owners.some((o) => o.toLowerCase() === login.toLowerCase()))
      saveOwners([...owners, login].slice(0, 12));
    setOwnerDraft("");
    pick({ kind: "mine", user: login });
  }
  function removeOwner(login: string) {
    saveOwners(owners.filter((o) => o !== login));
    if (source.kind === "mine" && source.user === login)
      pick({ kind: "type", id: "design-systems" });
  }

  const spec = useMemo<QuerySpec | null>(() => {
    if (source.kind === "type") return findRepoType(source.id)?.spec ?? null;
    if (source.kind === "topic") return { topics: [source.topic] };
    if (source.kind === "custom") return source.spec;
    if (source.kind === "mine") return null;
    if (!myTopics.length) return null;
    return matchAll
      ? { topics: myTopics, minStars: 10 }
      : { anyTopics: myTopics, minStars: 10 };
  }, [source, myTopics, matchAll]);
  const query = spec ? buildSearchQuery(spec) : "";

  const status = useQuery({
    queryKey: ["gh-status"],
    queryFn: githubApi.status,
    staleTime: 30_000,
    retry: false,
  });
  const searchQ = useQuery({
    queryKey: ["gh-search", query, sort, page],
    queryFn: () => githubApi.search(query, sort, page),
    enabled: !!query,
    staleTime: 300_000,
    retry: false,
    placeholderData: (previous) => previous,
  });
  const mineQ = useQuery({
    queryKey: ["gh-mine", source.kind === "mine" ? source.user : ""],
    queryFn: () => githubApi.mine(source.kind === "mine" ? source.user : ""),
    enabled: source.kind === "mine",
    staleTime: 300_000,
    retry: false,
  });
  const results = source.kind === "mine" ? mineQ : searchQ;
  const allItems = results.data?.data.items ?? [];
  const items =
    source.kind !== "mine" || visibility === "all"
      ? allItems
      : allItems.filter((item) =>
          visibility === "private" ? item.isPrivate : !item.isPrivate,
        );
  const chosen = items.find((item) => item.fullName === selected) ?? null;
  const rate =
    results.error instanceof GithubApiError ? results.error.rateLimit : null;
  const limited =
    results.error instanceof GithubApiError &&
    results.error.code === "rate_limited";
  const tokenOn = status.data?.data.tokenConfigured;
  const searchRate = status.data?.data.search;

  function pick(next: Source) {
    setSource(next);
    setPage(1);
    setSelected(null);
    setViewing(null);
  }
  function saveTopics(next: string[]) {
    setMyTopics(next);
    writeStored(TOPICS_KEY, next);
  }
  function addTopic(value: string) {
    const topic = normalizeTopic(value);
    if (topic && !myTopics.includes(topic))
      saveTopics([...myTopics, topic].slice(0, 20));
  }

  const detailQuery = useQuery({
    queryKey: ["gh-repo", chosen?.owner, chosen?.name],
    queryFn: () => githubApi.repo(chosen?.owner ?? "", chosen?.name ?? ""),
    enabled: false,
  });

  return (
    <div className="gh-page">
      <header className="gh-header">
        <h1>
          <GitFork /> Explorador de repositorios
        </h1>
        <p className="gh-limit" data-state={tokenOn ? "ok" : "warn"}>
          {status.isLoading
            ? "Comprobando GitHub…"
            : status.data?.data.reachable === false
              ? "GitHub no responde ahora."
              : tokenOn
                ? "Con GITHUB_TOKEN"
                : "Sin GITHUB_TOKEN: 10 búsquedas por minuto y 60 consultas por hora"}
          {searchRate?.remaining != null && searchRate.limit != null
            ? ` · búsquedas restantes ${searchRate.remaining}/${searchRate.limit}`
            : ""}
        </p>
      </header>

      <div className="gh-grid" data-viewing={viewing ? "true" : "false"}>
        <nav className="gh-rail" aria-label="Tipos de repositorio">
          <details open={source.kind === "mine"}>
            <summary>Mis repositorios</summary>
            <ul>
              {owners.map((owner) => (
                <li key={owner} className="gh-owner">
                  <button
                    type="button"
                    className="gh-rail-item"
                    aria-current={
                      source.kind === "mine" && source.user === owner
                    }
                    onClick={() => pick({ kind: "mine", user: owner })}
                  >
                    {owner}
                  </button>
                  <button
                    type="button"
                    className="gh-owner-remove"
                    aria-label={`Quitar ${owner}`}
                    onClick={() => removeOwner(owner)}
                  >
                    <X aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="gh-owner-form"
              onSubmit={(event) => {
                event.preventDefault();
                addOwner();
              }}
            >
              <input
                value={ownerDraft}
                onChange={(event) => setOwnerDraft(event.target.value)}
                placeholder="usuario de GitHub"
                aria-label="Agregar usuario de GitHub"
                maxLength={39}
              />
              <button
                type="submit"
                className="gh-chip"
                disabled={!ownerValid}
                aria-label="Agregar repositorios de este usuario"
              >
                <Plus aria-hidden="true" />
              </button>
            </form>
            {owners.length === 0 ? (
              <p className="gh-hint">
                Escribe tu usuario de GitHub para ver tus repositorios públicos.
                Se guarda solo en este navegador.
              </p>
            ) : null}
            {source.kind === "mine" &&
            allItems.some((item) => item.isPrivate) ? (
              <p className="gh-topics">
                {(
                  [
                    ["all", "Todos"],
                    ["public", "Públicos"],
                    ["private", "Privados"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="gh-chip"
                    aria-pressed={visibility === id}
                    onClick={() => setVisibility(id)}
                  >
                    {label}
                  </button>
                ))}
              </p>
            ) : null}
            {source.kind === "mine" &&
            !tokenOn &&
            session.data?.mode === "local" ? (
              <p className="gh-hint">
                Sin GITHUB_TOKEN solo se ven los públicos. Para ver los
                privados, crea un token en GitHub (Settings → Developer settings
                → Fine-grained tokens, permiso «Metadata» y «Contents» de solo
                lectura) y guárdalo en Integraciones o en .dev.vars.
              </p>
            ) : null}
          </details>
          {REPO_GROUPS.map((group) => (
            <details
              key={group.id}
              open={
                source.kind === "type" &&
                group.types.some((t) => t.id === source.id)
              }
            >
              <summary>{group.label}</summary>
              <ul>
                {group.types.map((type) => (
                  <li key={type.id}>
                    <button
                      type="button"
                      className="gh-rail-item"
                      aria-current={
                        source.kind === "type" && source.id === type.id
                      }
                      title={type.hint}
                      onClick={() => pick({ kind: "type", id: type.id })}
                    >
                      {type.label}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <details>
            <summary>Topics internacionales</summary>
            <p className="gh-topics">
              {INTERNATIONAL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className="gh-chip"
                  aria-pressed={
                    source.kind === "topic" && source.topic === topic
                  }
                  onClick={() => pick({ kind: "topic", topic })}
                >
                  {topic}
                </button>
              ))}
            </p>
          </details>
          <details open={source.kind === "personal"}>
            <summary>Mis topics ({myTopics.length})</summary>
            <form
              className="gh-row"
              onSubmit={(event) => {
                event.preventDefault();
                addTopic(draft);
                setDraft("");
              }}
            >
              <input
                className="gh-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="p. ej. design-system"
                aria-label="Nuevo topic"
              />
              <button
                type="submit"
                className="gh-btn"
                aria-label="Agregar topic"
                disabled={!normalizeTopic(draft)}
              >
                <Plus />
              </button>
            </form>
            <p className="gh-topics">
              {myTopics.map((topic) => (
                <span key={topic} className="gh-chip gh-chip-removable">
                  {topic}
                  <button
                    type="button"
                    aria-label={`Quitar ${topic}`}
                    onClick={() =>
                      saveTopics(myTopics.filter((t) => t !== topic))
                    }
                  >
                    <X />
                  </button>
                </span>
              ))}
            </p>
            <label className="gh-check">
              <input
                type="checkbox"
                checked={matchAll}
                onChange={(event) => setMatchAll(event.target.checked)}
              />
              Exigir todos los topics
            </label>
            <button
              type="button"
              className="gh-btn"
              disabled={!myTopics.length}
              onClick={() => pick({ kind: "personal" })}
            >
              Buscar con mis topics
            </button>
            {!myTopics.length ? (
              <p className="gh-note">
                Aún no agregaste topics. Se guardan solo en este navegador.
              </p>
            ) : null}
          </details>
          <ProfilePanel
            onAddTopic={addTopic}
            onSearch={(suggestion) =>
              pick({
                kind: "custom",
                label: suggestion.label,
                spec: suggestion.spec,
              })
            }
          />
        </nav>

        {viewing ? (
          <div className="gh-center">
            <RepoViewer detail={viewing} onClose={() => setViewing(null)} />
          </div>
        ) : (
          <section className="gh-center" aria-label="Resultados">
            <div className="gh-toolbar">
              <strong>{sourceLabel(source)}</strong>
              <select
                className="gh-input"
                value={sort}
                aria-label="Ordenar"
                onChange={(event) => {
                  setSort(event.target.value as SearchSort);
                  setPage(1);
                }}
              >
                {(Object.keys(SORT_LABELS) as SearchSort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
              <span className="gh-count">
                {results.data
                  ? `${formatNumber(results.data.data.totalCount)} repos`
                  : ""}
              </span>
            </div>
            {query ? (
              <p className="gh-query">
                <code>{query}</code>
                <a
                  href={githubSearchUrl(query, sort)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en GitHub <ExternalLink />
                </a>
              </p>
            ) : null}
            {limited ? (
              <p className="gh-note gh-note-warn" role="alert">
                Límite de GitHub alcanzado.{" "}
                {rate?.resetAt
                  ? `Se reinicia a las ${new Date(rate.resetAt).toLocaleTimeString("es-PE")}. `
                  : ""}
                {tokenOn ? (
                  ""
                ) : (
                  <AdminNote fallback="Vuelve a intentarlo en unos minutos.">
                    Configura GITHUB_TOKEN en Administración para subir el
                    límite.
                  </AdminNote>
                )}
              </p>
            ) : results.error ? (
              <p className="gh-note gh-note-warn" role="alert">
                {results.error instanceof Error
                  ? results.error.message
                  : "Error al buscar."}
              </p>
            ) : null}
            {results.data?.data.stale ? (
              <p className="gh-note gh-note-warn">
                Copia en caché del{" "}
                {new Date(results.data.data.fetchedAt).toLocaleString("es-PE")}:
                GitHub está limitando las consultas.
              </p>
            ) : null}
            {!query && source.kind !== "mine" ? (
              <p className="gh-empty">
                Agrega topics en «Mis topics» o elige un tipo de repositorio.
              </p>
            ) : results.isLoading ? (
              <p className="gh-empty">Buscando en GitHub…</p>
            ) : !items.length && !results.error ? (
              <p className="gh-empty">
                GitHub no devolvió repositorios para esta consulta.
              </p>
            ) : (
              <ul className="gh-list-main" aria-busy={results.isFetching}>
                {items.map((item, index) => (
                  <li
                    key={item.id}
                    style={
                      { "--i": Math.min(index, 12) } as React.CSSProperties
                    }
                  >
                    <button
                      type="button"
                      className="gh-row-btn"
                      aria-current={chosen?.fullName === item.fullName}
                      onClick={() => {
                        setSelected(item.fullName);
                        revealOnMobile(".gh-side");
                      }}
                    >
                      <span className="gh-row-name">{item.fullName}</span>
                      <span className="gh-row-desc">
                        {item.description ?? "Sin descripción"}
                      </span>
                      <span className="gh-row-meta">
                        <Star /> {formatNumber(item.stars)}
                        <span>{item.language ?? "—"}</span>
                        <span>{item.license?.spdxId ?? "sin licencia"}</span>
                        <span>{formatDate(item.pushedAt)}</span>
                        {item.archived ? <b>archivado</b> : null}
                        {source.kind === "mine" ? (
                          <b className={item.isPrivate ? "gh-private" : ""}>
                            {item.isPrivate ? "privado" : "público"}
                          </b>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {items.length && source.kind !== "mine" ? (
              <div className="gh-pager">
                <button
                  type="button"
                  className="gh-btn"
                  disabled={page <= 1 || results.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </button>
                <span>Página {page}</span>
                <button
                  type="button"
                  className="gh-btn"
                  disabled={
                    results.isFetching ||
                    page * 25 >=
                      Math.min(1000, results.data?.data.totalCount ?? 0)
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </section>
        )}

        <div className="gh-side">
          <RepoInspector
            repo={chosen}
            onOpen={async () => {
              const detail = await detailQuery.refetch();
              if (detail.data) setViewing(detail.data.data);
            }}
          />
        </div>
      </div>
    </div>
  );
}
