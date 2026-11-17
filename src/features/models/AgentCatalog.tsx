import { Check, Copy, ExternalLink, PlaySquare } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AGENTS,
  AGENTS_CURATED_AT,
  type AgentCustody,
  type AgentInfo,
  CUSTODY_HINTS,
  CUSTODY_LABELS,
} from "../../../lib/models/agents";
import "./agents.css";

type Filter = "all" | "offline" | "cloud";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "offline", label: "Funcionan offline" },
  { id: "cloud", label: "Solo nube" },
];

function matches(agent: AgentInfo, filter: Filter) {
  if (filter === "offline") return agent.custody !== "cloud";
  if (filter === "cloud") return agent.custody === "cloud";
  return true;
}

/**
 * Ready-made agents (Claude Code, Codex CLI, OpenCode, Aider…): what they do,
 * how they orchestrate, which models they use and whether they can run
 * offline. Shared by «Modelos» and «Prompts y agentes».
 */
export function AgentCatalog({
  compact = false,
  ids,
}: {
  compact?: boolean;
  /** Restrict to these agents (e.g. those that drive local models). */
  ids?: string[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState<string | null>(null);
  const base = ids ? AGENTS.filter((a) => ids.includes(a.id)) : AGENTS;
  const list = base.filter((agent) => matches(agent, filter));

  async function copy(agent: AgentInfo) {
    try {
      await navigator.clipboard.writeText(agent.install);
      setCopied(agent.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="ag-catalog" data-compact={compact || undefined}>
      {compact ? null : (
        <div className="ag-toolbar">
          <p className="ag-legend">
            {(["cloud", "hybrid", "local"] as AgentCustody[]).map((c) => (
              <span key={c} className="ag-custody" data-custody={c}>
                <i aria-hidden /> {CUSTODY_LABELS[c]}
              </span>
            ))}
          </p>
          <fieldset className="ag-filter">
            <legend className="ag-visually-hidden">Filtrar agentes</legend>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </fieldset>
        </div>
      )}
      <ul className="ag-list">
        {list.map((agent) => (
          <li key={agent.id} className="ag-item" data-custody={agent.custody}>
            <details open={!compact && agent.id === list[0]?.id}>
              <summary>
                <span className="ag-name">
                  <strong>{agent.name}</strong>
                  <small>
                    {agent.maker} · {agent.license}
                    {agent.openSource ? " · código abierto" : ""}
                  </small>
                </span>
                <span
                  className="ag-custody"
                  data-custody={agent.custody}
                  title={CUSTODY_HINTS[agent.custody]}
                >
                  <i aria-hidden /> {CUSTODY_LABELS[agent.custody]}
                </span>
                <span className="ag-summary">{agent.summary}</span>
              </summary>
              <dl className="ag-facts">
                <dt>Qué hace</dt>
                <dd>{agent.abilities.join(" · ")}</dd>
                <dt>Cómo orquesta</dt>
                <dd>{agent.orchestration}</dd>
                <dt>Modelos</dt>
                <dd>{agent.models}</dd>
                <dt>¿Funciona local?</dt>
                <dd>{agent.offline}</dd>
                <dt>Interfaz</dt>
                <dd>{agent.interfaces.join(", ")}</dd>
              </dl>
              <div className="ag-actions">
                <code>{agent.install}</code>
                <button
                  type="button"
                  className="ag-btn"
                  onClick={() => copy(agent)}
                  aria-label={`Copiar instalación de ${agent.name}`}
                >
                  {copied === agent.id ? (
                    <Check aria-hidden />
                  ) : (
                    <Copy aria-hidden />
                  )}
                  {copied === agent.id ? "Copiado" : "Copiar"}
                </button>
                <a
                  className="ag-btn"
                  href={agent.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sitio oficial <ExternalLink aria-hidden />
                </a>
                <Link
                  className="ag-btn"
                  to={`/videos?q=${encodeURIComponent(agent.name)}`}
                >
                  <PlaySquare aria-hidden /> Videos
                </Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
      <p className="ag-note">
        Curado a mano el {AGENTS_CURATED_AT} desde la documentación pública de
        cada proyecto. «Nube» significa que el modelo corre en servidores del
        proveedor aunque el programa esté instalado en tu PC.
      </p>
    </div>
  );
}
