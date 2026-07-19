import { COUNTRIES, countryCodeFromValue } from "./countries";

// Agregación por país y generación de GeoJSON a partir de registros reales.
// Ningún valor se inventa: cada conteo proviene de filas de D1 y cada feature
// de institución usa coordenadas provistas por la fuente (OpenAlex).

export type CountryAggregate = {
  countryCode: string;
  countryName: string;
  papers: number;
  providers: number;
  models: number;
  institutions: number;
  repositories: number;
  news: number;
  total: number;
};

export type InstitutionPoint = {
  id: string;
  name: string;
  countryCode: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  worksCount: number | null;
  homepageUrl: string | null;
  sourceName: string;
};

export function aggregateCountries(rows: {
  paperCountries: string[];
  providerCountries: Array<{ country: string | null; models: number }>;
  institutionCountries: string[];
  newsCountries: string[];
}): CountryAggregate[] {
  const map = new Map<string, CountryAggregate>();
  const ensure = (code: string): CountryAggregate => {
    let aggregate = map.get(code);
    if (!aggregate) {
      aggregate = {
        countryCode: code,
        countryName: COUNTRIES[code]?.name ?? code,
        papers: 0,
        providers: 0,
        models: 0,
        institutions: 0,
        repositories: 0,
        news: 0,
        total: 0,
      };
      map.set(code, aggregate);
    }
    return aggregate;
  };

  for (const raw of rows.paperCountries) {
    const code = countryCodeFromValue(raw);
    if (code) ensure(code).papers += 1;
  }
  for (const provider of rows.providerCountries) {
    const code = countryCodeFromValue(provider.country);
    if (code) {
      const aggregate = ensure(code);
      aggregate.providers += 1;
      aggregate.models += provider.models;
    }
  }
  for (const raw of rows.institutionCountries) {
    const code = countryCodeFromValue(raw);
    if (code) ensure(code).institutions += 1;
  }
  for (const raw of rows.newsCountries) {
    const code = countryCodeFromValue(raw);
    if (code) ensure(code).news += 1;
  }
  for (const aggregate of map.values()) {
    aggregate.total =
      aggregate.papers +
      aggregate.providers +
      aggregate.models +
      aggregate.institutions +
      aggregate.repositories +
      aggregate.news;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

type Feature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
};

export function buildGlobalGeoJson(
  aggregates: CountryAggregate[],
  institutions: InstitutionPoint[],
): { type: "FeatureCollection"; features: Feature[] } {
  const features: Feature[] = [];
  for (const aggregate of aggregates) {
    const reference = COUNTRIES[aggregate.countryCode];
    if (!reference || aggregate.total === 0) continue;
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [reference.longitude, reference.latitude],
      },
      properties: {
        kind: "country",
        countryCode: aggregate.countryCode,
        name: aggregate.countryName,
        papers: aggregate.papers,
        providers: aggregate.providers,
        models: aggregate.models,
        institutions: aggregate.institutions,
        news: aggregate.news,
        total: aggregate.total,
      },
    });
  }
  for (const institution of institutions) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [institution.longitude, institution.latitude],
      },
      properties: {
        kind: "institution",
        id: institution.id,
        name: institution.name,
        countryCode: institution.countryCode,
        city: institution.city,
        worksCount: institution.worksCount,
        homepageUrl: institution.homepageUrl,
        sourceName: institution.sourceName,
      },
    });
  }
  return { type: "FeatureCollection", features };
}
