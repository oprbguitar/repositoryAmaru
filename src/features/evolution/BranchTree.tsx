import { ArrowDownToLine, Sprout } from "lucide-react";
import type React from "react";
import { BRANCHES, type BranchId, MILESTONES, milestoneYear } from "./timeline";

const W = 640;
const H = 470;
const FORK = { x: 320, y: 330 };

type Geometry = {
  id: BranchId;
  x: number;
  y: number;
  path: string;
  leaves: Array<{ x: number; y: number; lx: number; ly: number }>;
};

/** Fixed fan layout: seven branches spread on an arc above the trunk. */
const GEOMETRY: Geometry[] = BRANCHES.map((branch, index) => {
  const angle = ((165 - index * 25) * Math.PI) / 180;
  const x = FORK.x + 250 * Math.cos(angle);
  const y = FORK.y - 225 * Math.sin(angle);
  const startY = FORK.y + Math.abs(index - 3) * 14;
  const midY = (startY + y) / 2;
  const path = `M${FORK.x},${startY} C${FORK.x},${midY} ${x},${midY + 50} ${x},${y}`;
  const leaves = branch.specialties.map((_, leaf) => {
    const spread =
      ((leaf - (branch.specialties.length - 1) / 2) * 22 * Math.PI) / 180;
    const a = angle + spread;
    return {
      x: x + 46 * Math.cos(a),
      y: y - 46 * Math.sin(a),
      lx: x + 20 * Math.cos(a),
      ly: y - 20 * Math.sin(a),
    };
  });
  return { id: branch.id, x, y, path, leaves };
});

export function BranchTree({
  selected,
  onSelect,
  onShowInTimeline,
}: {
  selected: BranchId;
  onSelect: (id: BranchId) => void;
  onShowInTimeline: (id: BranchId) => void;
}) {
  const branch = BRANCHES.find((b) => b.id === selected) ?? BRANCHES[0];
  const items = MILESTONES.filter((m) => m.branch === branch.id);
  const years = items.map(milestoneYear);
  const span = years.length
    ? `${Math.min(...years)}–${Math.max(...years)}`
    : "—";

  return (
    <section
      className="evo-tree-section"
      id="evo-tree"
      aria-labelledby="evo-tree-title"
    >
      <header className="evo-section-head">
        <h2 id="evo-tree-title">
          <Sprout aria-hidden="true" /> Árbol de ramas y especialidades
        </h2>
        <p>
          El tronco son los fundamentos; cada rama es una línea de trabajo y
          cada hoja una especialidad profesional. Selecciona una rama para ver
          su detalle.
        </p>
      </header>
      <div className="evo-tree-layout">
        <div className="evo-tree-canvas">
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
            <path
              className="evo-tree-trunk"
              d={`M${FORK.x},${H - 6} L${FORK.x},${FORK.y}`}
              pathLength={1}
            />
            {GEOMETRY.map((g, index) => {
              const tone = BRANCHES[index].tone;
              const isActive = g.id === branch.id;
              return (
                <g
                  key={g.id}
                  className={`evo-tree-branch${isActive ? " is-active" : ""}`}
                  style={
                    { "--branch": tone, "--i": index } as React.CSSProperties
                  }
                >
                  <path className="evo-tree-limb" d={g.path} pathLength={1} />
                  {g.leaves.map((leaf, leafIndex) => (
                    <g key={`${g.id}-${leafIndex}`} className="evo-tree-leaf">
                      <line x1={leaf.lx} y1={leaf.ly} x2={leaf.x} y2={leaf.y} />
                      <circle cx={leaf.x} cy={leaf.y} r={5} />
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
          {GEOMETRY.map((g, index) => {
            const b = BRANCHES[index];
            return (
              <button
                key={g.id}
                type="button"
                className="evo-tree-node"
                aria-pressed={g.id === branch.id}
                style={
                  {
                    "--branch": b.tone,
                    left: `${(g.x / W) * 100}%`,
                    top: `${(g.y / H) * 100}%`,
                  } as React.CSSProperties
                }
                onClick={() => onSelect(g.id)}
              >
                <span className="evo-tree-code">{b.code}</span>
                <span className="evo-tree-label">{b.label}</span>
              </button>
            );
          })}
        </div>

        <aside
          className="evo-branch-detail"
          aria-live="polite"
          style={{ "--branch": branch.tone } as React.CSSProperties}
        >
          <span className="evo-branch-eyebrow">
            <i aria-hidden="true" /> Rama {branch.code}
          </span>
          <h3>{branch.label}</h3>
          <dl className="evo-branch-facts">
            <div>
              <dt>Origen</dt>
              <dd>{branch.origin}</dd>
            </div>
            <div>
              <dt>Hitos</dt>
              <dd className="evo-mono">{items.length}</dd>
            </div>
            <div>
              <dt>Periodo</dt>
              <dd className="evo-mono">{span}</dd>
            </div>
          </dl>
          <p>{branch.description}</p>
          <h4>Especialidades y roles</h4>
          <ul className="evo-specialties">
            {branch.specialties.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong>
                <span>{s.role}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="evo-btn"
            onClick={() => onShowInTimeline(branch.id)}
          >
            <ArrowDownToLine aria-hidden="true" /> Ver sus hitos en la
            cronología
          </button>
        </aside>
      </div>
    </section>
  );
}
