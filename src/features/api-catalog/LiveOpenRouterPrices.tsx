import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw } from "lucide-react";
import { OPENROUTER_MODELS_URL, PRICING_ASOF } from "./catalog";
import "./api-catalog.css";

/** OpenRouter vendor prefixes per catalogue platform (verified against /api/v1/models). */
const VENDOR_PREFIXES: Record<string, string[]> = {
  anthropic: ["anthropic"],
  openai: ["openai"],
  "azure-openai": ["openai"],
  mistral: ["mistralai"],
  cohere: ["cohere"],
  deepseek: ["deepseek"],
  xai: ["x-ai"],
  perplexity: ["perplexity"],
  "aws-bedrock": ["amazon"],
  "google-vertex": ["google"],
};

type OpenRouterModel = {
  id: string;
  name: string;
  pricing?: { prompt?: string; completion?: string };
};

async function fetchModels(): Promise<{
  models: OpenRouterModel[];
  fetchedAt: string;
}> {
  const response = await fetch(OPENROUTER_MODELS_URL);
  if (!response.ok) throw new Error(`OpenRouter respondió ${response.status}`);
  const body = (await response.json()) as { data: OpenRouterModel[] };
  return { models: body.data, fetchedAt: new Date().toISOString() };
}

function perMillion(value: string | undefined): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "—";
  if (numeric === 0) return "Gratis";
  return `$${(numeric * 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 3 })}`;
}

/**
 * Live per-token prices from OpenRouter's public catalogue, converted to USD per
 * million tokens. Static rates in this catalogue stay labelled with their own
 * verification date; this block is the freshly fetched cross-check.
 */
export function LiveOpenRouterPrices({ platformId }: { platformId: string }) {
  const prefixes = VENDOR_PREFIXES[platformId];
  const query = useQuery({
    queryKey: ["openrouter-live-models"],
    queryFn: fetchModels,
    staleTime: 10 * 60_000,
    enabled: Boolean(prefixes),
  });
  if (!prefixes) return null;

  const rows = (query.data?.models ?? [])
    .filter((model) => prefixes.includes(model.id.split("/")[0]))
    .filter((model) => !model.id.includes(":"))
    .slice(0, 10);

  return (
    <section className="acl-live">
      <h3>Precios en vivo (OpenRouter)</h3>
      {query.isLoading ? (
        <p className="acl-note" role="status">
          Consultando precios…
        </p>
      ) : query.isError ? (
        <p className="acl-note">
          No se pudo consultar OpenRouter. Se mantienen los precios de lista de{" "}
          {PRICING_ASOF}.
        </p>
      ) : rows.length ? (
        <table className="acl-table">
          <thead>
            <tr>
              <th scope="col">Modelo</th>
              <th scope="col">Entrada /1M</th>
              <th scope="col">Salida /1M</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((model) => (
              <tr key={model.id}>
                <td title={model.id}>{model.name}</td>
                <td>{perMillion(model.pricing?.prompt)}</td>
                <td>{perMillion(model.pricing?.completion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="acl-note">Sin modelos de este proveedor en OpenRouter.</p>
      )}
      <p className="acl-note">
        Fuente:{" "}
        <a href={OPENROUTER_MODELS_URL} target="_blank" rel="noreferrer">
          openrouter.ai/api/v1/models <ExternalLink />
        </a>
        {query.data
          ? ` · consultado ${new Date(query.data.fetchedAt).toLocaleString("es-PE")}`
          : ""}
      </p>
      <button
        type="button"
        className="secondary-button compact"
        onClick={() => query.refetch()}
        disabled={query.isFetching}
      >
        <RefreshCw /> {query.isFetching ? "Actualizando…" : "Actualizar"}
      </button>
      <p className="acl-note">
        Precios de lista estáticos verificados a {PRICING_ASOF}; fuente: página
        oficial de precios de cada plataforma.
      </p>
    </section>
  );
}
