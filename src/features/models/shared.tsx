import type { ReactNode } from "react";
import {
  DISTRIBUTION_LABELS,
  type Distribution,
  type HubModel,
} from "../../../lib/models/hub";
import { BYTES_PER_GB } from "../../../lib/models/memory";
import type { SignalKind } from "../../../lib/models/ranking";

export const NO_DATA = "Sin dato publicado";

const integer = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });

export function fmtInt(value: number | null | undefined): string {
  return typeof value === "number" ? integer.format(value) : NO_DATA;
}

export function fmtGb(bytes: number | null | undefined): string {
  if (typeof bytes !== "number") return NO_DATA;
  const gb = bytes / BYTES_PER_GB;
  return gb < 1 ? `${Math.round(gb * 1024)} MB` : `${gb.toFixed(1)} GB`;
}

export function fmtParams(parameters: number | null | undefined): string {
  if (typeof parameters !== "number") return NO_DATA;
  const billions = parameters / 1e9;
  return billions >= 1
    ? `${billions.toFixed(billions >= 10 ? 0 : 1)} B`
    : `${Math.round(parameters / 1e6)} M`;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return NO_DATA;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? NO_DATA
    : date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function fmtTokens(value: number | null | undefined): string {
  if (typeof value !== "number") return NO_DATA;
  return value >= 1000
    ? `${integer.format(Math.round(value / 1000))} K tokens`
    : `${value} tokens`;
}

export const SIGNAL_LABELS: Record<SignalKind, string> = {
  medido: "Evidencia medida",
  declarado: "Declarado",
  popularidad: "Popularidad",
};

export const SIGNAL_HINTS: Record<SignalKind, string> = {
  medido: "Resultados de benchmarks publicados en model-index.",
  declarado: "Lo que el autor afirma en la ficha, la licencia o config.json.",
  popularidad: "Adopción en el hub: no mide calidad.",
};

export function SignalTag({ kind }: { kind: SignalKind }) {
  return (
    <span className={`mh-signal mh-signal-${kind}`} title={SIGNAL_HINTS[kind]}>
      {SIGNAL_LABELS[kind]}
    </span>
  );
}

export function SignalBlock({
  kind,
  children,
}: {
  kind: SignalKind;
  children: ReactNode;
}) {
  return (
    <section className={`mh-signal-block mh-signal-block-${kind}`}>
      <h3>
        {SIGNAL_LABELS[kind]}
        <small>{SIGNAL_HINTS[kind]}</small>
      </h3>
      {children}
    </section>
  );
}

export function DistributionMark({ value }: { value: Distribution }) {
  return (
    <span className={`mh-dist mh-dist-${value}`}>
      {DISTRIBUTION_LABELS[value]}
    </span>
  );
}

export function ModelIdentity({ model }: { model: HubModel }) {
  return (
    <span className="mh-identity">
      <strong>{model.name}</strong>
      <small>
        {model.org ? model.org.name : model.author}
        {model.originKind === "official" ? " · oficial" : " · comunidad"}
      </small>
    </span>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mh-empty" role="status">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function LoadingRows({ label }: { label: string }) {
  return (
    <div className="mh-loading" role="status" aria-live="polite">
      <span className="mh-loading-bar" />
      <span className="mh-loading-bar" />
      <span className="mh-loading-bar" />
      <span className="mh-visually-hidden">{label}</span>
    </div>
  );
}
