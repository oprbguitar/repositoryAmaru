import type { LaboratoryProjectSummary } from "./api";

export type TimelineKind = "created" | "updated" | "calculated" | "archived";

export type TimelineEvent = {
  key: string;
  projectId: string;
  projectName: string;
  kind: TimelineKind;
  at: string;
  detail: string;
};

export const TIMELINE_LABEL: Record<TimelineKind, string> = {
  created: "Creado",
  updated: "Editado",
  calculated: "Alternativas calculadas",
  archived: "Archivado",
};

/**
 * Historial derivado solo de las fechas guardadas por proyecto (creación y
 * última actualización): no hay registro de cambios intermedios, así que no se
 * inventan. El más reciente primero.
 */
export function buildTimeline(
  projects: LaboratoryProjectSummary[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const project of projects) {
    const base = { projectId: project.id, projectName: project.name };
    events.push({
      ...base,
      key: `${project.id}:created`,
      kind: "created",
      at: project.createdAt,
      detail: project.inputs?.domain ?? "",
    });
    const touched =
      Date.parse(project.updatedAt) - Date.parse(project.createdAt) > 1000;
    if (project.status !== "active") {
      events.push({
        ...base,
        key: `${project.id}:archived`,
        kind: "archived",
        at: project.updatedAt,
        detail: "",
      });
    } else if (touched && project.alternativeCount > 0) {
      events.push({
        ...base,
        key: `${project.id}:calculated`,
        kind: "calculated",
        at: project.updatedAt,
        detail: `${project.alternativeCount} alternativas`,
      });
    } else if (touched) {
      events.push({
        ...base,
        key: `${project.id}:updated`,
        kind: "updated",
        at: project.updatedAt,
        detail: "",
      });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at));
}

export function groupByDay(
  events: TimelineEvent[],
): Array<{ day: string; events: TimelineEvent[] }> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const day = event.at.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return [...groups.entries()].map(([day, list]) => ({ day, events: list }));
}
