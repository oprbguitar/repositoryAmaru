import type { FeatureCollection } from "geojson";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { MapGeoJson } from "../../../types/api";
import { touchMapOptions } from "./touchMap";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export type MapLayerVisibility = {
  countries: boolean;
  institutions: boolean;
};

// Lienzo MapLibre con basemap abierto (OpenFreeMap). Los datos provienen del
// endpoint GeoJSON del worker: nada se dibuja sin registros reales.
export function MapCanvas({
  geojson,
  visibility,
  focus,
  onCountrySelect,
}: {
  geojson: MapGeoJson | null;
  visibility: MapLayerVisibility;
  focus: { center: [number, number]; zoom: number };
  onCountrySelect: (code: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const selectRef = useRef(onCountrySelect);
  selectRef.current = onCountrySelect;

  // biome-ignore lint/correctness/useExhaustiveDependencies: el mapa se crea una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: focus.center,
      zoom: focus.zoom,
      attributionControl: { compact: true },
      ...touchMapOptions(),
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on("load", () => {
      map.addSource("countries", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addSource("institutions", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterRadius: 42,
      });
      map.addLayer({
        id: "country-circles",
        type: "circle",
        source: "countries",
        paint: {
          "circle-color": "#20c8d4",
          "circle-opacity": 0.32,
          "circle-stroke-color": "#20c8d4",
          "circle-stroke-width": 1.4,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "total"],
            1,
            7,
            50,
            14,
            500,
            26,
            5000,
            40,
          ],
        },
      });
      map.addLayer({
        id: "country-labels",
        type: "symbol",
        source: "countries",
        layout: {
          "text-field": [
            "format",
            ["get", "name"],
            {},
            "\n",
            {},
            ["to-string", ["get", "total"]],
            {},
          ],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#2b2140",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      });
      map.addLayer({
        id: "institution-clusters",
        type: "circle",
        source: "institutions",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#9d7aea",
          "circle-opacity": 0.55,
          "circle-radius": ["step", ["get", "point_count"], 9, 10, 14, 50, 20],
        },
      });
      map.addLayer({
        id: "institution-cluster-count",
        type: "symbol",
        source: "institutions",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 10,
        },
        paint: { "text-color": "#edf5fb" },
      });
      map.addLayer({
        id: "institution-points",
        type: "circle",
        source: "institutions",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#2ed489",
          "circle-radius": 4.5,
          "circle-stroke-color": "#05121f",
          "circle-stroke-width": 1,
        },
      });
      map.on("click", "country-circles", (event) => {
        const feature = event.features?.[0];
        const code = feature?.properties?.countryCode;
        if (typeof code === "string") selectRef.current(code);
      });
      map.on("click", "institution-points", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const properties = feature.properties as Record<string, unknown>;
        const name = String(properties.name ?? "Institución");
        const city = properties.city ? String(properties.city) : null;
        const works = properties.worksCount
          ? `${properties.worksCount} trabajos registrados (OpenAlex)`
          : "Producción no informada";
        const homepage = properties.homepageUrl
          ? `<a href="${String(properties.homepageUrl)}" target="_blank" rel="noreferrer">Sitio oficial</a>`
          : "";
        new maplibregl.Popup({ closeButton: true, maxWidth: "260px" })
          .setLngLat(event.lngLat)
          .setHTML(
            `<strong>${name}</strong><br/>${city ?? ""}<br/><small>${works}</small><br/>${homepage}`,
          )
          .addTo(map);
      });
      for (const layer of ["country-circles", "institution-points"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
      loadedRef.current = true;
      applyData(map, geojson, visibility);
    });
    mapRef.current = map;
    return () => {
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && loadedRef.current) applyData(map, geojson, visibility);
  }, [geojson, visibility]);

  useEffect(() => {
    mapRef.current?.flyTo({
      center: focus.center,
      zoom: focus.zoom,
      duration: 1200,
    });
  }, [focus]);

  return <div ref={containerRef} className="map-canvas" />;
}

function applyData(
  map: MapLibreMap,
  geojson: MapGeoJson | null,
  visibility: MapLayerVisibility,
) {
  const features = geojson?.features ?? [];
  const countrySource = map.getSource("countries") as maplibregl.GeoJSONSource;
  const institutionSource = map.getSource(
    "institutions",
  ) as maplibregl.GeoJSONSource;
  countrySource?.setData({
    type: "FeatureCollection",
    features: features.filter(
      (feature) => feature.properties.kind === "country",
    ),
  } as FeatureCollection);
  institutionSource?.setData({
    type: "FeatureCollection",
    features: features.filter(
      (feature) => feature.properties.kind === "institution",
    ),
  } as FeatureCollection);
  for (const layer of ["country-circles", "country-labels"]) {
    if (map.getLayer(layer))
      map.setLayoutProperty(
        layer,
        "visibility",
        visibility.countries ? "visible" : "none",
      );
  }
  for (const layer of [
    "institution-clusters",
    "institution-cluster-count",
    "institution-points",
  ]) {
    if (map.getLayer(layer))
      map.setLayoutProperty(
        layer,
        "visibility",
        visibility.institutions ? "visible" : "none",
      );
  }
}
