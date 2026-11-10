import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileBox, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HUB_FORMAT_LABELS, type HubModel } from "../../../lib/models/hub";
import { MEMORY_FORMULA, memoryTable } from "../../../lib/models/memory";
import { countryName } from "../../../lib/models/organizations";
import { FavoriteButton } from "../favorites/FavoriteStar";
import { getHubModel } from "./api";
import {
  DistributionMark,
  fmtDate,
  fmtGb,
  fmtInt,
  fmtParams,
  fmtTokens,
  LoadingRows,
  NO_DATA,
  SignalBlock,
} from "./shared";

const LICENSE_CLASS_LABELS: Record<HubModel["licenseClass"], string> = {
  permissive: "Permisiva",
  conditional: "Con condiciones",
  "non-commercial": "No comercial",
  unknown: "Sin licencia declarada",
};

/**
 * Technical sheet of a Hugging Face model, shown in the inspector. It starts
 * from the list record (instant) and enriches it with file sizes, config.json
 * and the card's limitations once the detail request resolves.
 */
export function ModelSheet({ model }: { model: HubModel }) {
  const navigate = useNavigate();
  const detail = useQuery({
    queryKey: ["model-hub", "model", model.id],
    queryFn: () => getHubModel(model.id),
    staleTime: 30 * 60 * 1000,
  });
  const data = detail.data?.data;
  const full = data?.model ?? model;
  const config = data?.config ?? null;
  const memory = memoryTable(full.parameters);
  const context = config?.contextLength ?? full.contextLength;
  const contextSource = config?.contextField
    ? config.contextField
    : full.contextLength
      ? "gguf.context_length"
      : null;

  return (
    <div className="mh-sheet">
      <header className="mh-sheet-head">
        <span className="mh-eyebrow">Ficha técnica</span>
        <h2>{full.name}</h2>
        <p className="mh-mono">{full.id}</p>
        <div className="mh-sheet-marks">
          <DistributionMark value={full.distribution} />
          {full.gated ? (
            <span className="mh-dist">Acceso con registro</span>
          ) : null}
        </div>
        <button
          type="button"
          className="mh-primary"
          onClick={() =>
            navigate(`/open-local?model=${encodeURIComponent(full.id)}`)
          }
        >
          <Download aria-hidden /> Descargar / añadir a biblioteca local
        </button>
        <FavoriteButton
          kind="model"
          id={full.id}
          label={full.name}
          url={`https://huggingface.co/${full.id}`}
        />
      </header>

      <dl className="mh-facts">
        <dt>Familia</dt>
        <dd>
          {full.modelType ?? NO_DATA}
          {full.architecture ? (
            <small className="mh-mono">{full.architecture}</small>
          ) : null}
        </dd>
        <dt>Organización</dt>
        <dd>
          {full.org
            ? `${full.org.name} · ${countryName(full.org.country)}`
            : `${full.author} (sin clasificar)`}
        </dd>
        <dt>Procedencia</dt>
        <dd>
          {full.originKind === "official"
            ? "Repositorio oficial"
            : "Publicado por la comunidad"}
          {full.baseModels.length ? (
            <small>
              {full.baseRelation ?? "deriva"} de {full.baseModels[0]}
            </small>
          ) : null}
        </dd>
        <dt>Creado</dt>
        <dd>{fmtDate(full.createdAt)}</dd>
        <dt>Actualizado</dt>
        <dd>{fmtDate(full.lastModified)}</dd>
        <dt>Parámetros</dt>
        <dd>
          {fmtParams(full.parameters)}
          {full.parametersSource ? (
            <small>fuente: metadatos {full.parametersSource}</small>
          ) : null}
        </dd>
        <dt>Contexto</dt>
        <dd>
          {fmtTokens(context)}
          {contextSource ? <small>{contextSource}</small> : null}
        </dd>
        {config?.numExperts ? (
          <>
            <dt>Expertos (MoE)</dt>
            <dd>
              {config.numExperts} expertos
              {config.expertsPerToken
                ? ` · ${config.expertsPerToken} activos por token`
                : ""}
              <small>config.json</small>
            </dd>
          </>
        ) : null}
        <dt>Pipeline</dt>
        <dd>{full.pipelineTag ?? NO_DATA}</dd>
      </dl>

      <SignalBlock kind="declarado">
        <dl className="mh-facts">
          <dt>Licencia</dt>
          <dd>
            {full.licenseName ?? full.license ?? NO_DATA}
            <small>
              {LICENSE_CLASS_LABELS[full.licenseClass]}
              {full.commercialUse === true
                ? " · uso comercial permitido"
                : full.commercialUse === false
                  ? " · sin uso comercial"
                  : " · revisa los términos"}
            </small>
          </dd>
          <dt>Idiomas</dt>
          <dd>{full.languages.length ? full.languages.join(", ") : NO_DATA}</dd>
          <dt>Etiquetas</dt>
          <dd>
            {full.topics.length ? full.topics.slice(0, 10).join(", ") : NO_DATA}
          </dd>
        </dl>
        {data?.limitations ? (
          <div className="mh-note">
            <strong>{data.limitations.heading}</strong>
            <p>{data.limitations.excerpt}</p>
          </div>
        ) : null}
      </SignalBlock>

      <SignalBlock kind="medido">
        {full.evals.length ? (
          <table className="mh-mini-table">
            <thead>
              <tr>
                <th>Benchmark</th>
                <th>Métrica</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {full.evals.slice(0, 8).map((result) => (
                <tr key={`${result.dataset}-${result.metric}-${result.value}`}>
                  <td>
                    {result.dataset}
                    {result.verified ? <small> · verificado</small> : null}
                  </td>
                  <td>{result.metric}</td>
                  <td className="mh-mono">{result.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mh-muted">
            El repositorio no publica resultados en model-index. No se muestran
            puntajes de terceros sin fuente.
          </p>
        )}
      </SignalBlock>

      <SignalBlock kind="popularidad">
        <dl className="mh-facts">
          <dt>Descargas (30 d)</dt>
          <dd className="mh-mono">{fmtInt(full.downloads)}</dd>
          <dt>Me gusta</dt>
          <dd className="mh-mono">{fmtInt(full.likes)}</dd>
          <dt>Tendencia</dt>
          <dd className="mh-mono">{fmtInt(full.trendingScore)}</dd>
        </dl>
      </SignalBlock>

      <section className="mh-sheet-section">
        <h3>
          <FileBox aria-hidden /> Formatos y tamaños
        </h3>
        {detail.isLoading ? (
          <LoadingRows label="Consultando archivos del repositorio" />
        ) : data?.packages.packages.length ? (
          <ul className="mh-packages">
            {data.packages.packages.map((pack) => (
              <li key={pack.format}>
                <span>
                  <strong>{HUB_FORMAT_LABELS[pack.format]}</strong>
                  <small>
                    {pack.files} archivo{pack.files === 1 ? "" : "s"}
                  </small>
                </span>
                <span className="mh-mono">{fmtGb(pack.bytes)}</span>
                {pack.variants.length ? (
                  <ul className="mh-variants">
                    {pack.variants.slice(0, 8).map((variant) => (
                      <li key={variant.label}>
                        <span className="mh-mono">{variant.label}</span>
                        <span className="mh-mono">{fmtGb(variant.bytes)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mh-muted">
            {detail.isError
              ? `No se pudo leer el repositorio: ${(detail.error as Error).message}`
              : full.formats.length
                ? `Formatos detectados: ${full.formats.map((f) => HUB_FORMAT_LABELS[f]).join(", ")}. Sin tamaños publicados.`
                : "El repositorio no publica archivos de pesos reconocibles."}
          </p>
        )}
      </section>

      <section className="mh-sheet-section">
        <h3>
          <Info aria-hidden /> Memoria estimada
        </h3>
        {memory.length ? (
          <>
            <table className="mh-mini-table">
              <thead>
                <tr>
                  <th>Cuantización</th>
                  <th>Pesos</th>
                  <th>RAM / VRAM</th>
                </tr>
              </thead>
              <tbody>
                {memory.map((row) => (
                  <tr key={row.preset.id}>
                    <td>{row.preset.label}</td>
                    <td className="mh-mono">{fmtGb(row.weightBytes)}</td>
                    <td className="mh-mono">{fmtGb(row.memoryBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mh-muted">
              Estimación, no medición: {MEMORY_FORMULA}. Contextos muy largos
              requieren más memoria.
            </p>
          </>
        ) : (
          <p className="mh-muted">
            Sin parámetros publicados: no se puede estimar la memoria.
          </p>
        )}
      </section>

      <section className="mh-sheet-section">
        <h3>Enlaces y fuentes</h3>
        <ul className="mh-links">
          {(
            data?.sources ?? [
              {
                label: "Ficha en Hugging Face",
                url: `https://huggingface.co/${full.id}`,
              },
            ]
          ).map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.label} <ExternalLink aria-hidden />
              </a>
            </li>
          ))}
          {full.licenseUrl ? (
            <li>
              <a href={full.licenseUrl} target="_blank" rel="noreferrer">
                Texto de la licencia <ExternalLink aria-hidden />
              </a>
            </li>
          ) : null}
          {full.arxivIds.slice(0, 3).map((arxiv) => (
            <li key={arxiv}>
              <a
                href={`https://arxiv.org/abs/${arxiv}`}
                target="_blank"
                rel="noreferrer"
              >
                Paper arXiv {arxiv} <ExternalLink aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        {data ? (
          <p className="mh-muted">Consultado: {fmtDate(data.fetchedAt)}</p>
        ) : null}
      </section>
    </div>
  );
}
