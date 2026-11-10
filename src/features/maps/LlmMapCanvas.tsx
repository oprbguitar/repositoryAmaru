import type { FeatureCollection } from "geojson";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import {
  dominantTrait,
  type LlmOrgStats,
  type MapMode,
  openShare,
  TRAIT_TOKENS,
} from "./llmModel";
import { initialZoom, touchMapOptions } from "./touchMap";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function token(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/** Concrete colors for the legend and canvas, read from the design tokens. */
export function modeColors() {
  return {
    accent: token("--accent") || "#20c8d4",
    open: token("--accent-2") || "#2ed489",
    mixed: token("--info") || "#5aa9ff",
    closed: token("--warn") || "#e8b04a",
    unknown: token("--text-subtle") || "#7d8fa3",
    halo: token("--bg-deep") || "#05121f",
    traits: Object.fromEntries(
      Object.entries(TRAIT_TOKENS).map(([key, name]) => [key, token(name)]),
    ) as Record<keyof typeof TRAIT_TOKENS, string>,
  };
}

function colorFor(org: LlmOrgStats, mode: MapMode): string {
  const c = modeColors();
  if (mode === "open") {
    const share = openShare(org);
    if (share === null) return c.unknown;
    return share >= 0.67 ? c.open : share <= 0.33 ? c.closed : c.mixed;
  }
  if (mode === "trends") {
    const trait = dominantTrait(org);
    return trait ? c.traits[trait] : c.unknown;
  }
  return c.accent;
}

function toGeoJson(orgs: LlmOrgStats[], mode: MapMode): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: orgs.map((org) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [org.longitude, org.latitude] },
      properties: {
        id: org.id,
        name: org.name,
        models: org.models,
        color: colorFor(org, mode),
      },
    })),
  };
}

export function LlmMapCanvas({
  orgs,
  mode,
  selectedId,
  onSelect,
}: {
  orgs: LlmOrgStats[];
  mode: MapMode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const latest = useRef({ orgs, mode, selectedId });
  latest.current = { orgs, mode, selectedId };

  const paint = () => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const { orgs: list, mode: m, selectedId: sel } = latest.current;
    (map.getSource("orgs") as maplibregl.GeoJSONSource)?.setData(
      toGeoJson(list, m),
    );
    map.setFilter("org-selected", ["==", ["get", "id"], sel ?? ""]);
    const target = list.find((o) => o.id === sel);
    if (target)
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(map.getZoom(), 3),
        duration: 900,
      });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: el mapa se crea una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [-20, 25],
      zoom: initialZoom(1.4),
      attributionControl: { compact: true },
      ...touchMapOptions(),
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on("load", () => {
      map.addSource("orgs", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "org-circles",
        type: "circle",
        source: "orgs",
        paint: {
          "circle-color": ["get", "color"],
          "circle-opacity": 0.6,
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 1.5,
          // Area is proportional to the number of models (sqrt scale).
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["sqrt", ["get", "models"]],
            1,
            5,
            10,
            14,
            25,
            30,
          ],
        },
      });
      map.addLayer({
        id: "org-selected",
        type: "circle",
        source: "orgs",
        filter: ["==", ["get", "id"], ""],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#2b2140",
          "circle-stroke-width": 2.5,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["sqrt", ["get", "models"]],
            1,
            8,
            25,
            34,
          ],
        },
      });
      map.addLayer({
        id: "org-labels",
        type: "symbol",
        source: "orgs",
        minzoom: 2.2,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.6],
          "text-anchor": "top",
          "text-optional": true,
        },
        paint: {
          // The basemap uses its normal (light) colours: dark label, white halo.
          "text-color": "#2b2140",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      });
      map.on("click", "org-circles", (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") selectRef.current(id);
      });
      map.on("mouseenter", "org-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "org-circles", () => {
        map.getCanvas().style.cursor = "";
      });
      loadedRef.current = true;
      paint();
    });
    mapRef.current = map;
    return () => {
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: paint lee refs
  useEffect(paint, [orgs, mode, selectedId]);

  return (
    <div
      ref={containerRef}
      className="lm-canvas"
      role="application"
      aria-label="Mapa de organizaciones desarrolladoras de LLM"
    />
  );
}
