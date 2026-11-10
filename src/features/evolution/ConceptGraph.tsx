import { ArrowUpRight, Network } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import {
  CONCEPT_LANES,
  CONCEPT_ROWS,
  CONCEPTS,
  childrenOf,
  conceptById,
  lineageOf,
} from "./concepts";
import { MILESTONES } from "./timeline";

const LANES = CONCEPT_LANES.length;
const ROWS = CONCEPT_ROWS.length;
const cx = (lane: number) => (lane + 0.5) * 100;
const cy = (row: number) => (row + 0.5) * 100;

export function ConceptGraph({
  selected,
  onSelect,
  onOpenMilestone,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onOpenMilestone: (id: string) => void;
}) {
  const concept = conceptById(selected) ?? CONCEPTS[0];
  const lineage = useMemo(() => lineageOf(concept.id), [concept.id]);
  const milestone = MILESTONES.find((m) => m.id === concept.milestoneId);
  const children = childrenOf(concept.id);

  const edges = CONCEPTS.flatMap((child) =>
    child.parents.map((parentId) => {
      const parent = conceptById(parentId);
      if (!parent) return null;
      const x1 = cx(parent.lane);
      const y1 = cy(parent.row);
      const x2 = cx(child.lane);
      const y2 = cy(child.row);
      const onPath =
        (parent.id === concept.id || lineage.has(parent.id)) &&
        (child.id === concept.id || lineage.has(child.id));
      return (
        <path
          key={`${parent.id}-${child.id}`}
          className={onPath ? "is-lit" : ""}
          d={`M${x1},${y1} C${x1},${y1 + 60} ${x2},${y2 - 60} ${x2},${y2}`}
          vectorEffect="non-scaling-stroke"
        />
      );
    }),
  );

  return (
    <section
      className="evo-concepts"
      id="evo-concepts"
      aria-labelledby="evo-concepts-title"
    >
      <header className="evo-section-head">
        <h2 id="evo-concepts-title">
          <Network aria-hidden="true" /> Evolución por conceptos
        </h2>
        <p>
          Genealogía de ideas: del perceptrón al Transformer y de ahí a MoE,
          SSM, MLA, difusión de texto y razonamiento por refuerzo. Al
          seleccionar un concepto se ilumina su linaje.
        </p>
      </header>
      <div className="evo-concepts-layout">
        <div className="evo-graph-scroll">
          <div
            className="evo-graph"
            style={{ "--lanes": LANES, "--rows": ROWS } as React.CSSProperties}
          >
            <div className="evo-graph-corner" aria-hidden="true" />
            <div className="evo-graph-lanes" aria-hidden="true">
              {CONCEPT_LANES.map((lane) => (
                <span key={lane.id}>{lane.label}</span>
              ))}
            </div>
            <div className="evo-graph-rows" aria-hidden="true">
              {CONCEPT_ROWS.map((row) => (
                <span key={row}>{row}</span>
              ))}
            </div>
            <div className="evo-graph-field">
              <svg
                viewBox={`0 0 ${LANES * 100} ${ROWS * 100}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                {edges}
              </svg>
              {CONCEPTS.map((node) => {
                const state =
                  node.id === concept.id
                    ? "is-selected"
                    : lineage.has(node.id)
                      ? "is-lineage"
                      : "is-dim";
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`evo-concept-node ${state}`}
                    aria-pressed={node.id === concept.id}
                    style={{ gridColumn: node.lane + 1, gridRow: node.row + 1 }}
                    onClick={() => onSelect(node.id)}
                  >
                    <strong>{node.label}</strong>
                    <small>{node.year}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="evo-concept-inspector" aria-live="polite">
          <span className="evo-branch-eyebrow">
            {CONCEPT_LANES[concept.lane].label} ·{" "}
            <span className="evo-mono">{concept.year}</span>
          </span>
          <h3>{concept.label}</h3>
          <dl className="evo-concept-facts">
            <div>
              <dt>Qué es</dt>
              <dd>{concept.what}</dd>
            </div>
            <div>
              <dt>Qué resolvió</dt>
              <dd>{concept.solved}</dd>
            </div>
            <div>
              <dt>Límite</dt>
              <dd>{concept.limit}</dd>
            </div>
          </dl>
          {concept.parents.length ? (
            <div className="evo-concept-links">
              <h4>Deriva de</h4>
              {concept.parents.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="evo-chip"
                  onClick={() => onSelect(id)}
                >
                  {conceptById(id)?.label}
                </button>
              ))}
            </div>
          ) : null}
          {children.length ? (
            <div className="evo-concept-links">
              <h4>Dio origen a</h4>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className="evo-chip"
                  onClick={() => onSelect(child.id)}
                >
                  {child.label}
                </button>
              ))}
            </div>
          ) : null}
          {milestone ? (
            <div className="evo-concept-source">
              <h4>Hito y fuente</h4>
              <button
                type="button"
                className="evo-btn"
                onClick={() => onOpenMilestone(milestone.id)}
              >
                Ir al hito: {milestone.title}
              </button>
              <a
                href={milestone.sources[0].url}
                target="_blank"
                rel="noreferrer"
                className="evo-source-link"
              >
                {milestone.sources[0].title} <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
