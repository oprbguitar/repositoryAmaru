import {
  BRANCHES,
  type Branch,
  ERAS,
  formatMilestoneDate,
  MILESTONES,
  type Milestone,
  sortedMilestones,
  TIMELINE_VERIFIED_AT,
} from "./timeline";

const branchLabel = (id: Milestone["branch"]) =>
  BRANCHES.find((b) => b.id === id)?.label ?? id;

/** Markdown export of the timeline (optionally filtered). Pure. */
export function buildTimelineMarkdown(list: Milestone[] = MILESTONES): string {
  const lines: string[] = [
    "# Evolución de la IA — AMARU AI Observatory",
    "",
    `Cronología curada con fuentes. Verificada al ${TIMELINE_VERIFIED_AT}. ${list.length} hitos.`,
    "",
  ];
  const sorted = sortedMilestones(list);
  for (const era of ERAS) {
    const items = sorted.filter((m) => m.era === era.id);
    if (!items.length) continue;
    lines.push(`## ${era.start}–${era.end} · ${era.name}`, "", era.summary, "");
    for (const m of items) {
      const flag = m.status === "por-verificar" ? " _(por verificar)_" : "";
      lines.push(
        `### ${formatMilestoneDate(m.date)} — ${m.title}${flag}`,
        "",
        `**Rama:** ${branchLabel(m.branch)}`,
        "",
        m.description,
        "",
        `**Impacto:** ${m.impact}`,
        "",
        ...m.sources.map((s) => `- [${s.title}](${s.url}) — ${s.author}`),
        "",
      );
    }
  }
  lines.push("## Ramas", "");
  for (const b of BRANCHES) {
    lines.push(
      `### ${b.label}`,
      "",
      `Origen: ${b.origin}. ${b.description}`,
      "",
      ...b.specialties.map((s) => `- **${s.name}:** ${s.role}`),
      "",
    );
  }
  return lines.join("\n");
}

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Word-compatible HTML document (opened by Word as .doc). Pure. */
export function buildTimelineWordHtml(list: Milestone[] = MILESTONES): string {
  const sorted = sortedMilestones(list);
  const body = ERAS.map((era) => {
    const items = sorted.filter((m) => m.era === era.id);
    if (!items.length) return "";
    return `<h2>${era.start}–${era.end} · ${esc(era.name)}</h2><p>${esc(era.summary)}</p>${items
      .map(
        (m) =>
          `<h3>${esc(formatMilestoneDate(m.date))} — ${esc(m.title)}${m.status ? " (por verificar)" : ""}</h3><p><b>Rama:</b> ${esc(branchLabel(m.branch))}</p><p>${esc(m.description)}</p><p><b>Impacto:</b> ${esc(m.impact)}</p><ul>${m.sources
            .map(
              (s) =>
                `<li><a href="${esc(s.url)}">${esc(s.title)}</a> — ${esc(s.author)}</li>`,
            )
            .join("")}</ul>`,
      )
      .join("")}`;
  }).join("");
  return `<html><head><meta charset="utf-8"><title>Evolución de la IA</title></head><body style="font-family:'Public Sans',Arial,sans-serif"><h1>Evolución de la IA — AMARU AI Observatory</h1><p>Verificada al ${TIMELINE_VERIFIED_AT}.</p>${body}</body></html>`;
}

export function branchesWithCounts(
  list: Milestone[] = MILESTONES,
): Array<Branch & { count: number }> {
  return BRANCHES.map((b) => ({
    ...b,
    count: list.filter((m) => m.branch === b.id).length,
  }));
}

export function downloadText(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
