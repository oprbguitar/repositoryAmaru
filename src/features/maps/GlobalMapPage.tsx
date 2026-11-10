import { useQuery } from "@tanstack/react-query";
import { Globe2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ApiResponse } from "../../../types/api";
import { SyncActionButton } from "../../components/common/SyncActionButton";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getGlobalMap, synchronize } from "../observatory/api";
import { formatDate } from "../observatory/format";
import { CountryPanel } from "./CountryPanel";
import { LlmMapCanvas, modeColors } from "./LlmMapCanvas";
import { LlmPanel } from "./LlmPanel";
import {
  type LlmOriginsResponse,
  type MapMode,
  TRAIT_LABELS,
  type TraitKey,
} from "./llmModel";
import { MapCanvas, type MapLayerVisibility } from "./MapCanvas";
import "./maps.css";
import { AdminNote, AUTO_UPDATE_NOTE } from "../admin/AdminNote";

const MODES: Array<{ id: MapMode; label: string; purpose: string }> = [
  {
    id: "origin",
    label: "Origen",
    purpose:
      "Dónde nacieron los LLM: cada círculo es una organización en su ciudad sede.",
  },
  {
    id: "open",
    label: "Abierto vs cerrado",
    purpose: "Qué parte de los modelos de cada organización publica sus pesos.",
  },
  {
    id: "trends",
    label: "Tendencias",
    purpose: "Qué técnica predomina en los modelos de cada origen.",
  },
  {
    id: "institutions",
    label: "Investigación (OpenAlex)",
    purpose: "Instituciones con producción científica indexada.",
  },
];

async function getLlmOrigins(): Promise<ApiResponse<LlmOriginsResponse>> {
  const response = await fetch("/api/map/llm-origins");
  if (!response.ok) throw new Error("No se pudo consultar los orígenes.");
  return response.json();
}

function Legend({
  mode,
  data,
}: {
  mode: MapMode;
  data: LlmOriginsResponse | undefined;
}) {
  const c = modeColors();
  const items: Array<{ color: string; label: string }> =
    mode === "open"
      ? [
          {
            color: c.open,
            label: "Mayoría abierta (≥ 67 % con pesos públicos)",
          },
          { color: c.mixed, label: "Mixta (34–66 %)" },
          { color: c.closed, label: "Mayoría cerrada (≤ 33 %)" },
          { color: c.unknown, label: "Sin clasificar" },
        ]
      : mode === "trends"
        ? [
            ...(Object.keys(TRAIT_LABELS) as TraitKey[]).map((key) => ({
              color: c.traits[key],
              label: TRAIT_LABELS[key],
            })),
            { color: c.unknown, label: "Sin parámetros publicados" },
          ]
        : [{ color: c.accent, label: "Organización desarrolladora" }];
  return (
    <div className="lm-legend">
      <h2>Qué muestra este mapa</h2>
      <p>
        {MODES.find((m) => m.id === mode)?.purpose} El tamaño del círculo es
        proporcional (raíz cuadrada) al número de modelos indexados.
        {mode === "trends"
          ? " El color indica el rasgo con más modelos; el detalle está en el panel."
          : ""}
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <i className="lm-swatch" style={{ background: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
      {data ? (
        <p className="lm-legend-meta">
          Datos al {formatDate(data.asOf)} · fuentes:{" "}
          {data.sources.map((source, index) => (
            <span key={source.name}>
              {index ? " · " : ""}
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>{" "}
              ({source.records})
            </span>
          ))}{" "}
          · sedes verificadas {formatDate(data.registryVerifiedAt)}
        </p>
      ) : null}
    </div>
  );
}

export function GlobalMapPage() {
  const [mode, setMode] = useState<MapMode>("origin");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [visibility] = useState<MapLayerVisibility>({
    countries: true,
    institutions: true,
  });
  const [syncing, setSyncing] = useState(false);
  const llm = useQuery({
    queryKey: ["map-llm-origins"],
    queryFn: getLlmOrigins,
  });
  const institutions = useQuery({
    queryKey: ["map-global"],
    queryFn: getGlobalMap,
    enabled: mode === "institutions",
  });
  const llmData = llm.data?.data;
  const instData = institutions.data?.data;
  const org = useMemo(
    () => llmData?.orgs.find((o) => o.id === selectedOrg) ?? null,
    [llmData, selectedOrg],
  );
  const focus = useMemo(() => {
    const feature = instData?.geojson.features.find(
      (entry) =>
        entry.properties.kind === "country" &&
        entry.properties.countryCode === selectedCountry,
    );
    return feature
      ? { center: feature.geometry.coordinates, zoom: 4 }
      : { center: [-30, 15] as [number, number], zoom: 1.6 };
  }, [selectedCountry, instData]);

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("map");
      await Promise.all([llm.refetch(), institutions.refetch()]);
    } finally {
      setSyncing(false);
    }
  }

  const panel =
    mode === "institutions" ? (
      <CountryPanel code={selectedCountry} />
    ) : (
      <LlmPanel data={llmData} org={org} onSelect={setSelectedOrg} />
    );

  return (
    <CollapsibleLayout storageKey="map" className="map-layout" panel={panel}>
      <header className="page-heading">
        <div>
          <h1>
            <Globe2 /> De dónde nacieron los LLM
          </h1>
          <p>
            Organizaciones desarrolladoras por ciudad sede, con modelos
            indexados, apertura y técnicas predominantes. Datos derivados del
            catálogo local; cada cifra enlaza a su fuente.
          </p>
        </div>
        <SyncActionButton
          label="Sincronizar mapa"
          busy={syncing}
          onClick={runSync}
        />
      </header>
      <nav className="lm-modes" aria-label="Capa del mapa">
        {MODES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={mode === entry.id}
            onClick={() => setMode(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>
      <div className="lm-stage">
        {mode === "institutions" ? (
          (instData?.geojson.features.length ?? 0) > 0 ? (
            <MapCanvas
              geojson={instData?.geojson ?? null}
              visibility={visibility}
              focus={focus}
              onCountrySelect={setSelectedCountry}
            />
          ) : (
            <div className="honest-empty">
              <h2>
                {institutions.isLoading
                  ? "Consultando instituciones…"
                  : "Sin datos geográficos indexados"}
              </h2>
              <p>
                <AdminNote fallback={AUTO_UPDATE_NOTE}>
                  Ejecuta «Sincronizar mapa» para indexar instituciones
                  (OpenAlex). No se muestran puntos inventados.
                </AdminNote>
              </p>
            </div>
          )
        ) : llmData?.orgs.length ? (
          <LlmMapCanvas
            orgs={llmData.orgs}
            mode={mode}
            selectedId={selectedOrg}
            onSelect={setSelectedOrg}
          />
        ) : (
          <div className="honest-empty">
            <h2>
              {llm.isLoading ? "Consultando modelos…" : "Sin modelos indexados"}
            </h2>
            <p>
              Sincroniza OpenRouter y Hugging Face para derivar los orígenes. No
              se atribuye ningún modelo a un país sin fuente.
            </p>
          </div>
        )}
        {mode === "institutions" ? (
          <div className="lm-legend">
            <h2>Qué muestra esta capa</h2>
            <p>
              Violeta: grupos de instituciones; verde: institución individual
              (OpenAlex); cian: actividad agregada por país. Cobertura:{" "}
              {instData?.coverage.institutionCount ?? 0} instituciones.
            </p>
          </div>
        ) : (
          <Legend mode={mode} data={llmData} />
        )}
      </div>
    </CollapsibleLayout>
  );
}
