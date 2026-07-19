import { useQuery } from "@tanstack/react-query";
import { Globe2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { CollapsibleLayout } from "../../components/layout/CollapsibleLayout";
import { getGlobalMap, synchronize } from "../observatory/api";
import { CountryPanel } from "./CountryPanel";
import { MapCanvas, type MapLayerVisibility } from "./MapCanvas";

const UNAVAILABLE_LAYERS = [
  "Regulación",
  "Infraestructura y centros de datos",
  "Eventos oficiales",
];

export function GlobalMapPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<MapLayerVisibility>({
    countries: true,
    institutions: true,
  });
  const [syncing, setSyncing] = useState(false);
  const map = useQuery({ queryKey: ["map-global"], queryFn: getGlobalMap });
  const data = map.data?.data;
  const focus = useMemo(() => {
    if (!selectedCountry || !data)
      return { center: [-30, 15] as [number, number], zoom: 1.6 };
    const feature = data.geojson.features.find(
      (entry) =>
        entry.properties.kind === "country" &&
        entry.properties.countryCode === selectedCountry,
    );
    return feature
      ? { center: feature.geometry.coordinates, zoom: 4 }
      : { center: [-30, 15] as [number, number], zoom: 1.6 };
  }, [selectedCountry, data]);

  async function runSync() {
    setSyncing(true);
    try {
      await synchronize("map");
      await map.refetch();
    } finally {
      setSyncing(false);
    }
  }

  const hasData = (data?.geojson.features.length ?? 0) > 0;
  return (
    <CollapsibleLayout
      storageKey="map"
      className="map-layout"
      panel={<CountryPanel code={selectedCountry} />}
    >
      <header className="page-heading">
        <div>
          <h1>
            <Globe2 /> Mapa global de inteligencia artificial
          </h1>
          <p>
            Basemap abierto (OpenFreeMap + MapLibre). Cada punto proviene de
            registros verificados en la base local.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button compact"
          onClick={runSync}
          disabled={syncing}
        >
          <RefreshCw className={syncing ? "spin" : ""} /> Sincronizar mapa
        </button>
      </header>
      <div className="map-shell panel">
        {hasData ? (
          <MapCanvas
            geojson={data?.geojson ?? null}
            visibility={visibility}
            focus={focus}
            onCountrySelect={setSelectedCountry}
          />
        ) : (
          <div className="honest-empty">
            <h2>Sin datos geográficos indexados</h2>
            <p>
              Ejecuta «Sincronizar mapa» para indexar instituciones (OpenAlex) y
              reconstruir los agregados por país. No se muestran puntos
              inventados.
            </p>
          </div>
        )}
        <div className="map-legend panel">
          <strong>Capas</strong>
          <label>
            <input
              type="checkbox"
              checked={visibility.countries}
              onChange={(event) =>
                setVisibility((value) => ({
                  ...value,
                  countries: event.target.checked,
                }))
              }
            />
            <i className="legend-dot cyan" /> Actividad por país (agregado)
          </label>
          <label>
            <input
              type="checkbox"
              checked={visibility.institutions}
              onChange={(event) =>
                setVisibility((value) => ({
                  ...value,
                  institutions: event.target.checked,
                }))
              }
            />
            <i className="legend-dot green" /> Instituciones (OpenAlex)
          </label>
          {UNAVAILABLE_LAYERS.map((layer) => (
            <label
              key={layer}
              className="legend-disabled"
              title="Sin fuente conectada"
            >
              <input type="checkbox" disabled />
              <i className="legend-dot muted" /> {layer} — sin fuente conectada
            </label>
          ))}
        </div>
      </div>
      {data ? (
        <p className="coverage-note">
          Cobertura: {data.coverage.institutionCount} instituciones con
          coordenadas provistas por la fuente. {data.coverage.note}
        </p>
      ) : null}
    </CollapsibleLayout>
  );
}
