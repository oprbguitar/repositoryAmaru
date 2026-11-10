import {
  ArrowUpRight,
  FileDown,
  FileText,
  GitBranch,
  Network,
  Printer,
  Search,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BranchTree } from "./BranchTree";
import { ConceptGraph } from "./ConceptGraph";
import "./evolution.css";
import {
  branchesWithCounts,
  buildTimelineMarkdown,
  buildTimelineWordHtml,
  downloadText,
} from "./exportTimeline";
import {
  BRANCHES,
  type BranchId,
  branchById,
  ERAS,
  type EraId,
  filterMilestones,
  formatMilestoneDate,
  MILESTONES,
  milestoneYear,
  sortedMilestones,
  TIMELINE_VERIFIED_AT,
  timelineStats,
} from "./timeline";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function EvolutionPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [branch, setBranch] = useState<BranchId | "all">("all");
  const [query, setQuery] = useState("");
  const [treeBranch, setTreeBranch] = useState<BranchId>("arch");
  const [concept, setConcept] = useState("transformer");
  const [activeEra, setActiveEra] = useState<EraId>(ERAS[0].id);
  const [flashId, setFlashId] = useState<string | null>(null);

  const stats = useMemo(timelineStats, []);
  const visible = useMemo(
    () => sortedMilestones(filterMilestones(MILESTONES, branch, query)),
    [branch, query],
  );
  const counts = useMemo(
    () => branchesWithCounts(filterMilestones(MILESTONES, "all", query)),
    [query],
  );

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  // Reveal timeline events as they enter the viewport (skipped with reduced motion).
  const _visibleKey = visible.map((m) => m.id).join(",");
  useEffect(() => {
    const root = pageRef.current;
    if (
      !root ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    root.classList.add("evo-animate");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { root, rootMargin: "0px 0px -8% 0px" },
    );
    for (const node of root.querySelectorAll(".evo-tl-event:not(.is-in)"))
      observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Track which era is in view to mark it as selected in the rail.
  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setActiveEra(hit.target.getAttribute("data-era") as EraId);
      },
      { root, rootMargin: "-25% 0px -65% 0px" },
    );
    for (const node of root.querySelectorAll("[data-era]"))
      observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!flashId) return;
    const timer = window.setTimeout(() => setFlashId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [flashId]);

  function openMilestone(id: string) {
    setBranch("all");
    setQuery("");
    setFlashId(id);
    window.setTimeout(() => scrollToId(`evo-m-${id}`), 30);
  }

  function showBranchInTimeline(id: BranchId) {
    setBranch(id);
    setQuery("");
    window.setTimeout(() => scrollToId("evo-timeline"), 30);
  }

  function printPdf() {
    document.body.classList.add("evo-print");
    const cleanup = () => {
      document.body.classList.remove("evo-print");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  const filterLabel =
    branch === "all" ? "todas" : branchById(branch).label.toLowerCase();
  const fileStem = `evolucion-ia-${TIMELINE_VERIFIED_AT}`;

  return (
    <div className="evo-page scroll-region" ref={pageRef}>
      <header className="evo-hero">
        <div className="evo-hero-text">
          <span className="evo-kicker">
            <GitBranch aria-hidden="true" /> Cronología curada · verificada al{" "}
            <time dateTime={TIMELINE_VERIFIED_AT}>
              {formatMilestoneDate(TIMELINE_VERIFIED_AT)}
            </time>
          </span>
          <h1>Evolución de la inteligencia artificial</h1>
          <p>
            De la neurona lógica de 1943 a los modelos de clase Mythos de 2026:
            arquitecturas, entrenamiento, cómputo, multimodalidad, agentes,
            ecosistema abierto y regulación. Cada hito enlaza su fuente
            primaria; lo que solo aparece en prensa se marca «por verificar».
          </p>
        </div>
        <dl className="evo-stats">
          {[
            ["Hitos", stats.milestones],
            ["Eras", stats.eras],
            ["Ramas", stats.branches],
            ["Especialidades", stats.specialties],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div
          className="evo-export"
          role="toolbar"
          aria-label="Exportar cronología"
        >
          <span>
            Exportar{" "}
            {visible.length === MILESTONES.length
              ? "todo"
              : `${visible.length} hitos (${filterLabel})`}
          </span>
          <button
            type="button"
            className="evo-btn"
            onClick={() =>
              downloadText(
                `${fileStem}.md`,
                buildTimelineMarkdown(visible),
                "text/markdown",
              )
            }
          >
            <FileDown aria-hidden="true" /> Markdown
          </button>
          <button
            type="button"
            className="evo-btn"
            onClick={() =>
              downloadText(
                `${fileStem}.doc`,
                buildTimelineWordHtml(visible),
                "application/msword",
              )
            }
          >
            <FileText aria-hidden="true" /> Word
          </button>
          <button type="button" className="evo-btn" onClick={printPdf}>
            <Printer aria-hidden="true" /> PDF
          </button>
        </div>
      </header>

      <nav className="evo-era-rail" aria-label="Eras de la cronología">
        {ERAS.map((era, index) => (
          <button
            key={era.id}
            type="button"
            aria-current={activeEra === era.id ? "true" : undefined}
            style={{ "--i": index } as React.CSSProperties}
            onClick={() => scrollToId(`evo-era-${era.id}`)}
          >
            <span className="evo-mono">
              {era.start === era.end
                ? era.start
                : `${era.start}–${String(era.end).slice(2)}`}
            </span>
            <strong>{era.name}</strong>
          </button>
        ))}
        <button
          type="button"
          className="evo-rail-extra"
          onClick={() => scrollToId("evo-tree")}
        >
          <Sprout aria-hidden="true" />
          <strong>Árbol</strong>
        </button>
        <button
          type="button"
          className="evo-rail-extra"
          onClick={() => scrollToId("evo-concepts")}
        >
          <Network aria-hidden="true" />
          <strong>Conceptos</strong>
        </button>
      </nav>

      <section
        className="evo-timeline-section"
        id="evo-timeline"
        aria-label="Cronología por eras"
      >
        <div className="evo-toolbar">
          <div
            className="evo-branch-filter"
            role="toolbar"
            aria-label="Filtrar por rama"
          >
            <button
              type="button"
              aria-pressed={branch === "all"}
              onClick={() => setBranch("all")}
            >
              Todas <em>{counts.reduce((n, b) => n + b.count, 0)}</em>
            </button>
            {counts.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={branch === b.id}
                disabled={b.count === 0}
                style={{ "--branch": b.tone } as React.CSSProperties}
                onClick={() => setBranch(b.id)}
              >
                <i aria-hidden="true" /> {b.label} <em>{b.count}</em>
              </button>
            ))}
          </div>
          <label className="evo-search">
            <Search aria-hidden="true" />
            <input
              aria-label="Buscar hito"
              value={query}
              placeholder="Buscar hito, modelo o año…"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQuery("")}
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="evo-empty">
            <h2>No hay hitos para este filtro</h2>
            <p>Prueba otra rama u otro término de búsqueda.</p>
            <button
              type="button"
              className="evo-btn"
              onClick={() => {
                setBranch("all");
                setQuery("");
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : null}

        {ERAS.map((era) => {
          const items = visible.filter((m) => m.era === era.id);
          if (!items.length) return null;
          return (
            <section
              key={era.id}
              className="evo-era"
              id={`evo-era-${era.id}`}
              data-era={era.id}
            >
              <header className="evo-era-head">
                <span className="evo-era-chip evo-mono">
                  {era.start === era.end
                    ? era.start
                    : `${era.start} – ${era.end}`}
                </span>
                <h2>{era.name}</h2>
                <p>{era.summary}</p>
              </header>
              <ol className="evo-tl">
                {items.map((m) => {
                  const b = branchById(m.branch);
                  return (
                    <li
                      key={m.id}
                      id={`evo-m-${m.id}`}
                      className={`evo-tl-event${flashId === m.id ? " is-flash" : ""}`}
                      style={{ "--branch": b.tone } as React.CSSProperties}
                    >
                      <span className="evo-tl-dot evo-mono" aria-hidden="true">
                        {milestoneYear(m)}
                      </span>
                      <article>
                        <header>
                          <span className="evo-tl-branch">{b.label}</span>
                          <time className="evo-mono" dateTime={m.date}>
                            {formatMilestoneDate(m.date)}
                          </time>
                          {m.status === "por-verificar" ? (
                            <span
                              className="evo-tl-verify"
                              title="Fecha o detalle confirmados solo por fuentes secundarias"
                            >
                              Por verificar
                            </span>
                          ) : null}
                        </header>
                        <h3>{m.title}</h3>
                        <p>{m.description}</p>
                        <p className="evo-tl-impact">
                          <Sparkles aria-hidden="true" />
                          <span>
                            <b>Impacto.</b> {m.impact}
                          </span>
                        </p>
                        <ul className="evo-tl-sources">
                          {m.sources.map((s) => (
                            <li key={s.url}>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                title={s.author}
                              >
                                {s.title} <ArrowUpRight aria-hidden="true" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </section>

      <BranchTree
        selected={treeBranch}
        onSelect={setTreeBranch}
        onShowInTimeline={showBranchInTimeline}
      />

      <ConceptGraph
        selected={concept}
        onSelect={setConcept}
        onOpenMilestone={openMilestone}
      />

      <footer className="evo-footnote">
        Contenido editorial curado a mano con {stats.sources} fuentes enlazadas
        ({BRANCHES.length} ramas, {ERAS.length} eras). Las cifras de cada hito
        provienen de su fuente citada.
      </footer>
    </div>
  );
}
