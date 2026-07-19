// Tabla de referencia geográfica estática (centroides aproximados por país).
// Es geodata de referencia, equivalente a un basemap: solo posiciona agregados
// cuyos valores provienen de registros reales en D1. No representa actividad.

export type CountryReference = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const COUNTRIES: Record<string, CountryReference> = {
  US: { code: "US", name: "Estados Unidos", latitude: 39.8, longitude: -98.6 },
  GB: { code: "GB", name: "Reino Unido", latitude: 54.0, longitude: -2.5 },
  FR: { code: "FR", name: "Francia", latitude: 46.6, longitude: 2.4 },
  DE: { code: "DE", name: "Alemania", latitude: 51.1, longitude: 10.4 },
  CN: { code: "CN", name: "China", latitude: 35.9, longitude: 104.2 },
  JP: { code: "JP", name: "Japón", latitude: 36.2, longitude: 138.3 },
  KR: { code: "KR", name: "Corea del Sur", latitude: 36.5, longitude: 127.9 },
  IN: { code: "IN", name: "India", latitude: 21.0, longitude: 78.7 },
  CA: { code: "CA", name: "Canadá", latitude: 56.1, longitude: -106.3 },
  IL: { code: "IL", name: "Israel", latitude: 31.4, longitude: 35.0 },
  SG: { code: "SG", name: "Singapur", latitude: 1.35, longitude: 103.82 },
  AU: { code: "AU", name: "Australia", latitude: -25.3, longitude: 133.8 },
  CH: { code: "CH", name: "Suiza", latitude: 46.8, longitude: 8.2 },
  NL: { code: "NL", name: "Países Bajos", latitude: 52.2, longitude: 5.3 },
  ES: { code: "ES", name: "España", latitude: 40.2, longitude: -3.6 },
  IT: { code: "IT", name: "Italia", latitude: 42.8, longitude: 12.8 },
  SE: { code: "SE", name: "Suecia", latitude: 62.2, longitude: 17.6 },
  FI: { code: "FI", name: "Finlandia", latitude: 64.5, longitude: 26.3 },
  NO: { code: "NO", name: "Noruega", latitude: 64.6, longitude: 12.7 },
  PL: { code: "PL", name: "Polonia", latitude: 52.1, longitude: 19.4 },
  PT: { code: "PT", name: "Portugal", latitude: 39.6, longitude: -8.0 },
  RU: { code: "RU", name: "Rusia", latitude: 61.5, longitude: 105.3 },
  TW: { code: "TW", name: "Taiwán", latitude: 23.7, longitude: 121.0 },
  HK: { code: "HK", name: "Hong Kong", latitude: 22.3, longitude: 114.2 },
  AE: {
    code: "AE",
    name: "Emiratos Árabes Unidos",
    latitude: 23.4,
    longitude: 53.8,
  },
  SA: { code: "SA", name: "Arabia Saudita", latitude: 23.9, longitude: 45.1 },
  TR: { code: "TR", name: "Turquía", latitude: 38.96, longitude: 35.24 },
  ZA: { code: "ZA", name: "Sudáfrica", latitude: -30.6, longitude: 22.9 },
  EG: { code: "EG", name: "Egipto", latitude: 26.8, longitude: 30.8 },
  NG: { code: "NG", name: "Nigeria", latitude: 9.1, longitude: 8.7 },
  KE: { code: "KE", name: "Kenia", latitude: 0.02, longitude: 37.9 },
  ID: { code: "ID", name: "Indonesia", latitude: -0.8, longitude: 113.9 },
  VN: { code: "VN", name: "Vietnam", latitude: 14.1, longitude: 108.3 },
  TH: { code: "TH", name: "Tailandia", latitude: 15.9, longitude: 101.0 },
  MY: { code: "MY", name: "Malasia", latitude: 4.2, longitude: 101.98 },
  PH: { code: "PH", name: "Filipinas", latitude: 12.9, longitude: 121.8 },
  BE: { code: "BE", name: "Bélgica", latitude: 50.5, longitude: 4.5 },
  AT: { code: "AT", name: "Austria", latitude: 47.5, longitude: 14.6 },
  DK: { code: "DK", name: "Dinamarca", latitude: 56.3, longitude: 9.5 },
  IE: { code: "IE", name: "Irlanda", latitude: 53.4, longitude: -8.2 },
  CZ: { code: "CZ", name: "Chequia", latitude: 49.8, longitude: 15.5 },
  GR: { code: "GR", name: "Grecia", latitude: 39.1, longitude: 21.8 },
  UA: { code: "UA", name: "Ucrania", latitude: 48.4, longitude: 31.2 },
  // LATAM
  PE: { code: "PE", name: "Perú", latitude: -9.19, longitude: -75.02 },
  BR: { code: "BR", name: "Brasil", latitude: -14.2, longitude: -51.9 },
  MX: { code: "MX", name: "México", latitude: 23.6, longitude: -102.6 },
  AR: { code: "AR", name: "Argentina", latitude: -38.4, longitude: -63.6 },
  CL: { code: "CL", name: "Chile", latitude: -35.7, longitude: -71.5 },
  CO: { code: "CO", name: "Colombia", latitude: 4.6, longitude: -74.3 },
  UY: { code: "UY", name: "Uruguay", latitude: -32.5, longitude: -55.8 },
  EC: { code: "EC", name: "Ecuador", latitude: -1.8, longitude: -78.2 },
  BO: { code: "BO", name: "Bolivia", latitude: -16.3, longitude: -63.6 },
  PY: { code: "PY", name: "Paraguay", latitude: -23.4, longitude: -58.4 },
  CR: { code: "CR", name: "Costa Rica", latitude: 9.75, longitude: -83.75 },
  PA: { code: "PA", name: "Panamá", latitude: 8.5, longitude: -80.8 },
  VE: { code: "VE", name: "Venezuela", latitude: 6.4, longitude: -66.6 },
  GT: { code: "GT", name: "Guatemala", latitude: 15.8, longitude: -90.2 },
  DO: {
    code: "DO",
    name: "República Dominicana",
    latitude: 18.7,
    longitude: -70.2,
  },
  CU: { code: "CU", name: "Cuba", latitude: 21.5, longitude: -77.8 },
  HN: { code: "HN", name: "Honduras", latitude: 15.2, longitude: -86.2 },
  SV: { code: "SV", name: "El Salvador", latitude: 13.8, longitude: -88.9 },
  NI: { code: "NI", name: "Nicaragua", latitude: 12.9, longitude: -85.2 },
};

export const LATAM_CODES = [
  "PE",
  "BR",
  "MX",
  "AR",
  "CL",
  "CO",
  "UY",
  "EC",
  "BO",
  "PY",
  "CR",
  "PA",
] as const;

// Los países de proveedores se guardaron en español en la tabla providers.
const SPANISH_NAME_TO_CODE: Record<string, string> = {
  "estados unidos": "US",
  "reino unido": "GB",
  francia: "FR",
  alemania: "DE",
  china: "CN",
  japon: "JP",
  japón: "JP",
  "corea del sur": "KR",
  india: "IN",
  canada: "CA",
  canadá: "CA",
  israel: "IL",
  singapur: "SG",
  australia: "AU",
  suiza: "CH",
  "paises bajos": "NL",
  "países bajos": "NL",
  espana: "ES",
  españa: "ES",
  peru: "PE",
  perú: "PE",
  brasil: "BR",
  mexico: "MX",
  méxico: "MX",
  argentina: "AR",
  chile: "CL",
  colombia: "CO",
  uruguay: "UY",
  ecuador: "EC",
  bolivia: "BO",
  paraguay: "PY",
  "costa rica": "CR",
  panama: "PA",
  panamá: "PA",
};

export function countryCodeFromValue(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    return COUNTRIES[upper] ? upper : null;
  }
  return SPANISH_NAME_TO_CODE[trimmed.toLocaleLowerCase("es")] ?? null;
}

export function countryName(code: string): string {
  return COUNTRIES[code]?.name ?? code;
}
