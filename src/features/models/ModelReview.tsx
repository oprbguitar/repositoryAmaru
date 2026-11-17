import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import type { HubModel } from "../../../lib/models/hub";
import { getHubReview } from "./api";
import { fmtDate, fmtInt } from "./shared";

const KIND_LABELS: Record<string, string> = {
  news: "Noticia",
  paper: "Investigación",
  repository: "Repositorio",
  filing: "Reporte",
};

const SUMMARY_STATUS: Record<string, string> = {
  "no-card": "El autor no publica una ficha con descripción.",
  unavailable: "El resumen automático no está disponible ahora.",
  "daily-limit": "Se alcanzó el límite diario de resúmenes automáticos.",
};

/**
 * «De qué se trata»: Spanish summary grounded in the author's card, the card
 * sections themselves, observable adoption (Spaces, derivatives) and
 * mentions in the observatory's news and research.
 */
export function ModelReview({ model }: { model: HubModel }) {
  const [open, setOpen] = useState(false);
  const review = useQuery({
    queryKey: ["model-hub", "review", model.id],
    queryFn: () => getHubReview(model.id),
    staleTime: 6 * 60 * 60 * 1000,
  });
  const data = review.data?.data;
  const overview = data?.sections.find((s) => s.key === "overview");
  const details = data?.sections.filter((s) => s.key !== "overview") ?? [];

  return (
    <section
      className="mh-sheet-section mh-review"
      aria-labelledby="mh-review-title"
    >
      <h3 id="mh-review-title">
        <BookOpen aria-hidden /> De qué se trata
      </h3>

      {review.isLoading ? (
        <p className="mh-muted mh-review-loading">
          Leyendo la ficha del autor y su uso en el hub…
        </p>
      ) : review.isError || !data ? (
        <p className="mh-muted">
          No se pudo leer la ficha: {(review.error as Error)?.message ?? ""}
        </p>
      ) : (
        <>
          {data.summary ? (
            <div className="mh-review-summary">
              <p>{data.summary.text}</p>
              <small>
                <Sparkles aria-hidden /> Resumen automático hecho solo con la
                ficha del autor · revisa la fuente antes de decidir.
              </small>
            </div>
          ) : overview ? (
            <div className="mh-review-summary" lang="en">
              <p>{overview.excerpt}</p>
              <small>
                Texto original de la ficha.{" "}
                {SUMMARY_STATUS[data.summaryStatus] ?? ""}
              </small>
            </div>
          ) : (
            <p className="mh-muted">
              {SUMMARY_STATUS[data.summaryStatus] ??
                "La ficha no tiene descripción."}
            </p>
          )}

          <ul className="mh-review-stats">
            <li>
              <strong>{fmtInt(data.spaces.total)}</strong>
              <small>apps (Spaces) lo usan</small>
            </li>
            {data.derivatives.map((d) => (
              <li key={d.relation}>
                <strong>
                  {d.count}
                  {d.capped ? "+" : ""}
                </strong>
                <small>
                  {d.label.charAt(0).toLowerCase() + d.label.slice(1)}
                </small>
              </li>
            ))}
            <li>
              <strong>{data.mentions.length}</strong>
              <small>menciones en el observatorio</small>
            </li>
          </ul>

          <button
            type="button"
            className="mh-link-btn"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Ver menos" : "Uso, entrenamiento, evaluación y menciones"}
          </button>

          {open ? (
            <div className="mh-review-more">
              {details.length ? (
                <dl className="mh-review-sections">
                  {details.map((s) => (
                    <div key={s.key}>
                      <dt>
                        {s.label} <small>«{s.heading}»</small>
                      </dt>
                      <dd lang="en">{s.excerpt}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mh-muted">
                  La ficha no documenta usos, entrenamiento ni evaluación en
                  secciones reconocibles.
                </p>
              )}

              {data.derivatives.length ? (
                <>
                  <h4 className="mh-h4">Cómo lo está usando la comunidad</h4>
                  <ul className="mh-review-list">
                    {data.derivatives.map((d) => (
                      <li key={d.relation}>
                        <a href={d.url} target="_blank" rel="noreferrer">
                          {d.label}: {d.count}
                          {d.capped ? "+" : ""} <ExternalLink aria-hidden />
                        </a>
                        {d.top.length ? (
                          <small>
                            Más descargados:{" "}
                            {d.top
                              .map(
                                (t) =>
                                  `${t.id}${t.downloads !== null ? ` (${fmtInt(t.downloads)})` : ""}`,
                              )
                              .join(" · ")}
                          </small>
                        ) : null}
                      </li>
                    ))}
                    {data.spaces.sample.length ? (
                      <li>
                        <span>Apps que lo usan</span>
                        <small>
                          {data.spaces.sample.map((space, i) => (
                            <span key={space}>
                              {i ? " · " : ""}
                              <a
                                href={`https://huggingface.co/spaces/${space}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {space}
                              </a>
                            </span>
                          ))}
                        </small>
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}

              <h4 className="mh-h4">
                Reportes y menciones
                {data.mentionTerm ? ` · «${data.mentionTerm}»` : ""}
              </h4>
              {data.mentions.length ? (
                <ul className="mh-review-list">
                  {data.mentions.map((m) => (
                    <li key={m.url}>
                      <a href={m.url} target="_blank" rel="noreferrer">
                        {m.title} <ExternalLink aria-hidden />
                      </a>
                      <small>
                        {KIND_LABELS[m.kind] ?? m.kind} · {m.source}
                        {m.date ? ` · ${fmtDate(m.date)}` : ""}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mh-muted">
                  Aún no hay noticias, papers ni reportes indexados que lo
                  mencionen.
                </p>
              )}
              <p className="mh-muted">
                Consultado: {fmtDate(data.fetchedAt)} · Fuente: ficha y API de
                Hugging Face, registros del observatorio.
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
