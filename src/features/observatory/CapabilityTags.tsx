import type { CapabilityTag } from "../../../types/api";

const GROUP_LABELS: Record<CapabilityTag["group"], string> = {
  uso: "Uso real",
  modalidad: "Modalidades",
  capacidad: "Capacidades",
  acceso: "Acceso",
};

const GROUP_ORDER: CapabilityTag["group"][] = [
  "uso",
  "modalidad",
  "capacidad",
  "acceso",
];

/**
 * Capability chips. The `title` carries the provenance sentence so every claim
 * about what a model is good for stays traceable to the source field.
 */
export function CapabilityChips({
  tags,
  onSelect,
  activeTagId,
  compact = false,
  max,
}: {
  tags: CapabilityTag[];
  onSelect?: (tag: CapabilityTag) => void;
  activeTagId?: string | null;
  compact?: boolean;
  /** Caps the inline list in dense contexts; the rest are summarised as "+N". */
  max?: number;
}) {
  if (!tags.length) return null;
  const shown = typeof max === "number" ? tags.slice(0, max) : tags;
  const hidden = tags.length - shown.length;
  return (
    <ul className={`capability-chips${compact ? " compact" : ""}`}>
      {shown.map((tag) => (
        <li key={tag.id}>
          {onSelect ? (
            <button
              type="button"
              className={`capability-chip group-${tag.group}${activeTagId === tag.id ? " active" : ""}`}
              title={tag.evidence}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(tag);
              }}
            >
              {tag.label}
            </button>
          ) : (
            <span
              className={`capability-chip group-${tag.group}`}
              title={tag.evidence}
            >
              {tag.label}
            </span>
          )}
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <span
            className="capability-chip capability-chip-more"
            title={tags
              .slice(shown.length)
              .map((tag) => tag.label)
              .join(" · ")}
          >
            +{hidden}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

/** Grouped list with the evidence spelled out, for the context panel. */
export function CapabilityEvidenceList({ tags }: { tags: CapabilityTag[] }) {
  if (!tags.length) {
    return (
      <p className="capability-empty">
        Las fuentes no publicaron modalidades, parámetros ni rankings de uso
        para este modelo, por lo que el observatorio no infiere para qué sirve.
      </p>
    );
  }
  return (
    <>
      {GROUP_ORDER.map((group) => {
        const groupTags = tags.filter((tag) => tag.group === group);
        if (!groupTags.length) return null;
        return (
          <div className="capability-group" key={group}>
            <h4>{GROUP_LABELS[group]}</h4>
            <ul className="capability-evidence">
              {groupTags.map((tag) => (
                <li key={tag.id}>
                  <strong>{tag.label}</strong>
                  <small className="capability-evidence-note">
                    {tag.evidence}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
