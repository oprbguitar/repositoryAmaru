import { History } from "lucide-react";
import type { LaboratoryProjectSummary } from "./api";
import "./laboratory.css";
import { buildTimeline, groupByDay, TIMELINE_LABEL } from "./timeline";

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${day}T12:00:00`));
}

function hour(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LaboratoryTimeline({
  projects,
  activeId,
  onSelect,
}: {
  projects: LaboratoryProjectSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = groupByDay(buildTimeline(projects));
  return (
    <section className="lab-history" aria-label="Historial del laboratorio">
      <header>
        <h2>
          <History /> Historial
        </h2>
        <span>Según las fechas guardadas de cada proyecto</span>
      </header>
      {groups.length === 0 ? (
        <p className="lab-history-empty">Aún no hay actividad.</p>
      ) : (
        <ol>
          {groups.map((group) => (
            <li key={group.day}>
              <h3>{dayLabel(group.day)}</h3>
              <ul>
                {group.events.map((event) => (
                  <li key={event.key}>
                    <button
                      type="button"
                      className={`lab-event kind-${event.kind} ${activeId === event.projectId ? "is-selected" : ""}`}
                      onClick={() => onSelect(event.projectId)}
                    >
                      <time dateTime={event.at}>{hour(event.at)}</time>
                      <i aria-hidden="true" />
                      <span>
                        <strong>{event.projectName}</strong>
                        <small>
                          {TIMELINE_LABEL[event.kind]}
                          {event.detail ? ` · ${event.detail}` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
