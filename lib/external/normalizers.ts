import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import type { NormalizedExternalRecord } from "./types";

const openRouterSchema = z.object({
  data: z.array(
    z
      .object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().nullish(),
        context_length: z.number().nullish(),
        created: z.number().nullish(),
        hugging_face_id: z.string().nullish(),
        pricing: z.record(z.string(), z.unknown()).nullish(),
        architecture: z.record(z.string(), z.unknown()).nullish(),
        supported_parameters: z.array(z.string()).nullish(),
        top_provider: z.record(z.string(), z.unknown()).nullish(),
      })
      .passthrough(),
  ),
});

const huggingFaceSchema = z.array(
  z
    .object({
      id: z.string(),
      author: z.string().nullish(),
      pipeline_tag: z.string().nullish(),
      library_name: z.string().nullish(),
      tags: z.array(z.string()).optional(),
      downloads: z.number().nullish(),
      likes: z.number().nullish(),
      lastModified: z.string().nullish(),
      private: z.boolean().optional(),
      gated: z.union([z.boolean(), z.string()]).optional(),
      safetensors: z.record(z.string(), z.unknown()).nullish(),
    })
    .passthrough(),
);

const openAlexSchema = z.object({
  results: z.array(z.record(z.string(), z.unknown())),
});

const crossrefSchema = z.object({
  message: z.object({ items: z.array(z.record(z.string(), z.unknown())) }),
});

const githubSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
});

function isoFromUnix(value: number | null | undefined): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function firstDate(value: unknown): string | null {
  if (!Array.isArray(value) || !Array.isArray(value[0])) return null;
  const [year, month = 1, day = 1] = value[0];
  if (![year, month, day].every((item) => typeof item === "number"))
    return null;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

function providerFromModelId(id: string): string | null {
  const prefix = id.split("/")[0]?.toLowerCase() ?? "";
  const mapping: Record<string, string> = {
    openai: "openai",
    anthropic: "anthropic",
    google: "google-gemini",
    mistralai: "mistral",
    mistral: "mistral",
    nvidia: "nvidia",
    cohere: "cohere",
    deepseek: "deepseek",
    xai: "xai",
  };
  return mapping[prefix] ?? null;
}

export function normalizeOpenRouter(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = openRouterSchema.parse(payload);
  return parsed.data.map((model) => {
    const pricing = model.pricing ?? {};
    const supported = model.supported_parameters ?? [];
    return {
      sourceId: "openrouter",
      recordKind: "model",
      externalId: model.id,
      title: model.name ?? model.id,
      summary: model.description ?? null,
      originalUrl: `https://openrouter.ai/${model.id}`,
      sourceName: "OpenRouter",
      sourceType: "model_catalog",
      publishedAt: isoFromUnix(model.created),
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "confirmed",
      confidenceLevel: "high",
      language: null,
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: providerFromModelId(model.id),
      data: {
        apiIdentifier: model.id,
        contextLength: model.context_length ?? null,
        architecture: model.architecture ?? null,
        inputPricePerToken: pricing.prompt ?? null,
        outputPricePerToken: pricing.completion ?? null,
        imagePrice: pricing.image ?? null,
        requestPrice: pricing.request ?? null,
        supportedParameters: supported,
        toolCalling:
          supported.includes("tools") || supported.includes("tool_choice"),
        structuredOutput: supported.includes("response_format"),
        huggingFaceId: model.hugging_face_id ?? null,
        topProvider: model.top_provider ?? null,
        license: null,
        localAvailability: false,
      },
    };
  });
}

export function normalizeHuggingFace(
  payload: unknown,
  kind: "model" | "dataset" | "space",
  now: string,
): NormalizedExternalRecord[] {
  const parsed = huggingFaceSchema.parse(payload);
  const path = kind === "model" ? "" : `${kind}s/`;
  return parsed.map((item) => {
    const tags = item.tags ?? [];
    const licenseTag = tags.find((tag) => tag.startsWith("license:"));
    return {
      sourceId: "hugging-face",
      recordKind: kind,
      externalId: `${kind}:${item.id}`,
      title: item.id,
      summary: null,
      originalUrl: `https://huggingface.co/${path}${item.id}`,
      sourceName: "Hugging Face Hub",
      sourceType: `${kind}_catalog`,
      publishedAt: item.lastModified ?? null,
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "confirmed",
      confidenceLevel: "high",
      language:
        tags.find((tag) => tag.startsWith("language:"))?.split(":")[1] ?? null,
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: "hugging-face",
      data: {
        apiIdentifier: item.id,
        author: item.author ?? item.id.split("/")[0] ?? null,
        pipelineTag: item.pipeline_tag ?? null,
        library: item.library_name ?? null,
        tags,
        license: licenseTag?.slice("license:".length) ?? null,
        downloads: item.downloads ?? null,
        likes: item.likes ?? null,
        gated: item.gated ?? false,
        private: item.private ?? false,
        safetensors: item.safetensors ?? null,
        localAvailability: kind === "model",
      },
    };
  });
}

export function normalizeOpenAlex(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = openAlexSchema.parse(payload);
  return parsed.results.map((work) => {
    const id = stringValue(work.id) ?? crypto.randomUUID();
    const primary = (work.primary_location ?? {}) as Record<string, unknown>;
    const source = (primary.source ?? {}) as Record<string, unknown>;
    const openAccess = (work.open_access ?? {}) as Record<string, unknown>;
    const authorships = Array.isArray(work.authorships) ? work.authorships : [];
    const authors = authorships
      .map((entry) => {
        const author = ((entry as Record<string, unknown>).author ??
          {}) as Record<string, unknown>;
        return stringValue(author.display_name);
      })
      .filter(Boolean);
    const countries = [
      ...new Set(
        authorships.flatMap((entry) =>
          stringArray((entry as Record<string, unknown>).countries),
        ),
      ),
    ];
    return {
      sourceId: "openalex",
      recordKind: "paper",
      externalId: id,
      title: stringValue(work.title) ?? "Trabajo sin título informado",
      summary: null,
      originalUrl:
        stringValue(primary.landing_page_url) ?? stringValue(work.doi) ?? id,
      sourceName: "OpenAlex",
      sourceType: "academic_index",
      publishedAt: stringValue(work.publication_date),
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "confirmed",
      confidenceLevel: "high",
      language: stringValue(work.language),
      countryRegion: countries[0] ?? null,
      lastSuccessfulSyncAt: now,
      providerId: null,
      data: {
        workId: id,
        doi: stringValue(work.doi),
        type: stringValue(work.type),
        authors,
        countries,
        citationCount: numberValue(work.cited_by_count),
        openAccess: openAccess.is_oa === true,
        topics: Array.isArray(work.topics)
          ? work.topics
              .slice(0, 5)
              .map((topic) =>
                stringValue((topic as Record<string, unknown>).display_name),
              )
              .filter(Boolean)
          : [],
        venue: stringValue(source.display_name),
        evidenceType: stringValue(work.type),
      },
    };
  });
}

export function normalizeCrossref(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = crossrefSchema.parse(payload);
  return parsed.message.items.map((work) => {
    const doi = stringValue(work.DOI) ?? crypto.randomUUID();
    const title =
      stringArray(work.title)[0] ?? "Publicación sin título informado";
    const authors = Array.isArray(work.author)
      ? work.author
          .map((author) => {
            const value = author as Record<string, unknown>;
            return [stringValue(value.given), stringValue(value.family)]
              .filter(Boolean)
              .join(" ");
          })
          .filter(Boolean)
      : [];
    return {
      sourceId: "crossref",
      recordKind: "paper",
      externalId: doi,
      title,
      summary: stringValue(work.abstract),
      originalUrl: stringValue(work.URL) ?? `https://doi.org/${doi}`,
      sourceName: "Crossref",
      sourceType: "doi_registry",
      publishedAt: firstDate(work.published) ?? firstDate(work.created),
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "confirmed",
      confidenceLevel: "high",
      language: stringValue(work.language),
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: null,
      data: {
        doi,
        type: stringValue(work.type),
        authors,
        publisher: stringValue(work.publisher),
        containerTitle: stringArray(work["container-title"])[0] ?? null,
        citationCount: numberValue(work["is-referenced-by-count"]),
        evidenceType: stringValue(work.type),
      },
    };
  });
}

export function normalizeGitHub(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const parsed = githubSchema.parse(payload);
  return parsed.items.map((repository) => {
    const fullName = stringValue(repository.full_name) ?? crypto.randomUUID();
    const license = (repository.license ?? {}) as Record<string, unknown>;
    const owner = (repository.owner ?? {}) as Record<string, unknown>;
    return {
      sourceId: "github",
      recordKind: "repository",
      externalId: fullName,
      title: fullName,
      summary: stringValue(repository.description),
      originalUrl:
        stringValue(repository.html_url) ?? `https://github.com/${fullName}`,
      sourceName: "GitHub REST",
      sourceType: "repository_api",
      publishedAt: stringValue(repository.created_at),
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "confirmed",
      confidenceLevel: "high",
      language: null,
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: null,
      data: {
        owner: stringValue(owner.login),
        stars: numberValue(repository.stargazers_count),
        forks: numberValue(repository.forks_count),
        openIssues: numberValue(repository.open_issues_count),
        language: stringValue(repository.language),
        license: stringValue(license.spdx_id),
        createdAt: stringValue(repository.created_at),
        pushedAt: stringValue(repository.pushed_at),
        updatedAt: stringValue(repository.updated_at),
        topics: stringArray(repository.topics),
        homepage: stringValue(repository.homepage),
        latestRelease: null,
      },
    };
  });
}

export function normalizeArxivXml(
  xml: string,
  now: string,
): NormalizedExternalRecord[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const feed = (parsed.feed ?? {}) as Record<string, unknown>;
  const entries = Array.isArray(feed.entry)
    ? feed.entry
    : feed.entry
      ? [feed.entry]
      : [];
  return entries.map((raw) => {
    const entry = raw as Record<string, unknown>;
    const id = stringValue(entry.id) ?? crypto.randomUUID();
    const links = Array.isArray(entry.link)
      ? entry.link
      : entry.link
        ? [entry.link]
        : [];
    const pdf = links.find(
      (link) => (link as Record<string, unknown>)["@_title"] === "pdf",
    ) as Record<string, unknown> | undefined;
    const authorsRaw = Array.isArray(entry.author)
      ? entry.author
      : entry.author
        ? [entry.author]
        : [];
    const categoriesRaw = Array.isArray(entry.category)
      ? entry.category
      : entry.category
        ? [entry.category]
        : [];
    return {
      sourceId: "arxiv",
      recordKind: "paper",
      externalId: id.split("/abs/").pop() ?? id,
      title:
        stringValue(entry.title)?.replace(/\s+/g, " ") ??
        "Preprint sin título informado",
      summary: stringValue(entry.summary)?.replace(/\s+/g, " ") ?? null,
      originalUrl: id,
      sourceName: "arXiv",
      sourceType: "preprint_repository",
      publishedAt: stringValue(entry.published),
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "provisional",
      confidenceLevel: "high",
      language: "en",
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: null,
      data: {
        arxivId: id.split("/abs/").pop() ?? id,
        authors: authorsRaw
          .map((author) =>
            stringValue((author as Record<string, unknown>).name),
          )
          .filter(Boolean),
        categories: categoriesRaw
          .map((category) =>
            stringValue((category as Record<string, unknown>)["@_term"]),
          )
          .filter(Boolean),
        updatedAt: stringValue(entry.updated),
        pdfUrl: stringValue(pdf?.["@_href"]),
        doi: stringValue(entry["arxiv:doi"]),
        evidenceType: "preprint",
        peerReviewed: false,
      },
    };
  });
}

export function normalizeOfficialFeed(
  xml: string,
  source: { id: string; name: string; baseUrl: string },
  now: string,
): NormalizedExternalRecord[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rss = (parsed.rss ?? {}) as Record<string, unknown>;
  const channel = (rss.channel ?? {}) as Record<string, unknown>;
  const atom = (parsed.feed ?? {}) as Record<string, unknown>;
  const rawItems = channel.item ?? atom.entry ?? [];
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return items.slice(0, 40).map((raw) => {
    const item = raw as Record<string, unknown>;
    const linkRaw = item.link;
    const link =
      typeof linkRaw === "string"
        ? linkRaw
        : stringValue(
            (linkRaw as Record<string, unknown> | undefined)?.["@_href"],
          );
    const url = link ?? source.baseUrl;
    return {
      sourceId: source.id,
      recordKind: "news",
      externalId: stringValue(item.guid) ?? stringValue(item.id) ?? url,
      title:
        stringValue(item.title) ?? "Actualización oficial sin título informado",
      summary:
        stringValue(item.description) ?? stringValue(item.summary) ?? null,
      originalUrl: url,
      sourceName: source.name,
      sourceType: "official_feed",
      publishedAt:
        stringValue(item.pubDate) ??
        stringValue(item.published) ??
        stringValue(item.updated),
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "verified",
      confidenceLevel: "high",
      language: "en",
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: source.id.replace(/-news$/, ""),
      data: { officialSource: true, topic: "IA", region: null },
    };
  });
}

export function normalizeSecSubmissions(
  payload: unknown,
  now: string,
  options: { providerId?: string | null; limit?: number } = {},
): NormalizedExternalRecord[] {
  const root = z.record(z.string(), z.unknown()).parse(payload);
  const filings = (root.filings ?? {}) as Record<string, unknown>;
  const recent = (filings.recent ?? {}) as Record<string, unknown>;
  const accession = stringArray(recent.accessionNumber);
  const forms = stringArray(recent.form);
  const dates = stringArray(recent.filingDate);
  const docs = stringArray(recent.primaryDocument);
  const cik = stringValue(root.cik) ?? "0001045810";
  return accession
    .slice(0, options.limit ?? 30)
    .map((accessionNumber, index) => {
      const accessionPath = accessionNumber.replaceAll("-", "");
      const url = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionPath}/${docs[index] ?? ""}`;
      return {
        sourceId: "sec-edgar",
        recordKind: "filing",
        externalId: accessionNumber,
        title: `${stringValue(root.name) ?? "Emisor"} — formulario ${forms[index] ?? "no informado"}`,
        summary: `Presentación oficial ante la SEC. Formulario ${forms[index] ?? "no informado"}.`,
        originalUrl: url,
        sourceName: "SEC EDGAR",
        sourceType: "official_filing",
        publishedAt: dates[index] ?? null,
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "verified",
        confidenceLevel: "high",
        language: "en",
        countryRegion: "Estados Unidos",
        lastSuccessfulSyncAt: now,
        providerId: options.providerId ?? null,
        data: {
          cik,
          accessionNumber,
          form: forms[index] ?? null,
          filingDate: dates[index] ?? null,
          company: stringValue(root.name),
        },
      };
    });
}

// SEC XBRL companyconcept: fundamentos oficiales reportados (ingresos, utilidad).
// https://data.sec.gov/api/xbrl/companyconcept/CIK##########/us-gaap/<tag>.json
export function normalizeSecCompanyConcept(
  payload: unknown,
  metric: { tag: string; label: string },
  now: string,
  providerId: string | null = null,
): NormalizedExternalRecord[] {
  const root = z.record(z.string(), z.unknown()).parse(payload);
  const entityName = stringValue(root.entityName) ?? "Emisor no informado";
  const cik = String(root.cik ?? "");
  const units = (root.units ?? {}) as Record<string, unknown>;
  const observations = Array.isArray(units.USD) ? units.USD : [];
  const relevant = observations
    .map((raw) => raw as Record<string, unknown>)
    .filter((entry) => ["10-K", "10-Q"].includes(String(entry.form ?? "")));
  // Última observación anual y última trimestral, sin duplicar periodos.
  const byForm = new Map<string, Record<string, unknown>>();
  for (const entry of relevant) byForm.set(String(entry.form), entry);
  return [...byForm.values()].flatMap((entry) => {
    const value = numberValue(entry.val);
    const end = stringValue(entry.end);
    if (value === null || !end) return [];
    const form = String(entry.form);
    const conceptUrl = `https://data.sec.gov/api/xbrl/companyconcept/CIK${cik.padStart(10, "0")}/us-gaap/${metric.tag}.json`;
    return [
      {
        sourceId: "sec-xbrl",
        recordKind: "economic_indicator" as const,
        externalId: `${cik}:${metric.tag}:${form}`,
        title: `${entityName} — ${metric.label} (${form}, periodo al ${end})`,
        summary: null,
        originalUrl: conceptUrl,
        sourceName: "SEC XBRL",
        sourceType: "official_financial_facts",
        publishedAt: stringValue(entry.filed),
        detectedAt: now,
        retrievedAt: now,
        verificationStatus: "verified" as const,
        confidenceLevel: "high" as const,
        language: "en",
        countryRegion: "Estados Unidos",
        lastSuccessfulSyncAt: now,
        providerId,
        data: {
          indicatorType: "sec_fundamental",
          company: entityName,
          cik,
          metricTag: metric.tag,
          metricLabel: metric.label,
          value,
          unit: "USD",
          periodEnd: end,
          periodStart: stringValue(entry.start),
          form,
          fiscalPeriod: stringValue(entry.fp),
          fiscalYear: numberValue(entry.fy),
          filedAt: stringValue(entry.filed),
        },
      },
    ];
  });
}

// Frankfurter: tipos de cambio de referencia del BCE (sin clave).
// https://api.frankfurter.dev/v1/latest?base=USD
export function normalizeFrankfurter(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const root = z
    .object({
      base: z.string(),
      date: z.string(),
      rates: z.record(z.string(), z.number()),
    })
    .parse(payload);
  return Object.entries(root.rates).map(([currency, rate]) => ({
    sourceId: "frankfurter",
    recordKind: "economic_indicator" as const,
    externalId: `${root.base}/${currency}:${root.date}`,
    title: `Tipo de cambio ${root.base}/${currency} — ${root.date}`,
    summary: null,
    originalUrl: "https://www.frankfurter.dev/",
    sourceName: "Frankfurter (BCE)",
    sourceType: "official_economic_series",
    publishedAt: root.date,
    detectedAt: now,
    retrievedAt: now,
    verificationStatus: "verified" as const,
    confidenceLevel: "high" as const,
    language: "en",
    countryRegion: null,
    lastSuccessfulSyncAt: now,
    providerId: null,
    data: {
      indicatorType: "fx_reference_rate",
      base: root.base,
      currency,
      value: rate,
      unit: `${currency} por ${root.base}`,
      referenceDate: root.date,
      publisher: "Banco Central Europeo (tasas de referencia)",
    },
  }));
}

export function normalizeBcrp(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const root = z.record(z.string(), z.unknown()).parse(payload);
  const periods = Array.isArray(root.periods) ? root.periods : [];
  return periods.map((raw) => {
    const period = raw as Record<string, unknown>;
    const values = Array.isArray(period.values) ? period.values : [];
    // BCRPData entrega cada observación como arreglo de cadenas: values: ["3.416"]
    const first = values[0];
    const value =
      typeof first === "string" || typeof first === "number"
        ? first
        : ((first as Record<string, unknown> | undefined)?.value ?? null);
    const name = stringValue(period.name) ?? "Periodo no informado";
    return {
      sourceId: "bcrp",
      recordKind: "economic_indicator",
      externalId: `PD04640PD:${name}`,
      title: `Tipo de cambio USD/PEN — ${name}`,
      summary: null,
      originalUrl:
        "https://estadisticas.bcrp.gob.pe/estadisticas/series/diarias/resultados/PD04640PD/html",
      sourceName: "BCRPData",
      sourceType: "official_economic_series",
      publishedAt: null,
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "verified",
      confidenceLevel: "high",
      language: "es",
      countryRegion: "Perú",
      lastSuccessfulSyncAt: now,
      providerId: null,
      data: {
        seriesCode: "PD04640PD",
        period: name,
        value: typeof value === "number" ? String(value) : stringValue(value),
        unit: "S/ por US$",
        quoteTimestamp: name,
        retrievalTimestamp: now,
      },
    };
  });
}

export function normalizeOpenAiCompatibleModels(
  payload: unknown,
  source: { id: string; name: string; providerId: string; modelsUrl: string },
  now: string,
): NormalizedExternalRecord[] {
  const root = z
    .object({ data: z.array(z.record(z.string(), z.unknown())) })
    .parse(payload);
  return root.data.map((model) => {
    const id = stringValue(model.id) ?? crypto.randomUUID();
    return {
      sourceId: source.id,
      recordKind: "model",
      externalId: id,
      title: id,
      summary: null,
      originalUrl: source.modelsUrl,
      sourceName: source.name,
      sourceType: "account_model_api",
      publishedAt:
        typeof model.created === "number" ? isoFromUnix(model.created) : null,
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "verified",
      confidenceLevel: "high",
      language: null,
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: source.providerId,
      data: {
        apiIdentifier: id,
        ownedBy: stringValue(model.owned_by),
        contextLength: null,
        inputPricePerToken: null,
        outputPricePerToken: null,
        toolCalling: null,
        localAvailability: false,
        license: null,
      },
    };
  });
}

export function normalizeGeminiModels(
  payload: unknown,
  now: string,
): NormalizedExternalRecord[] {
  const root = z
    .object({ models: z.array(z.record(z.string(), z.unknown())) })
    .parse(payload);
  return root.models.map((model) => {
    const name = stringValue(model.name) ?? crypto.randomUUID();
    const apiIdentifier = name.replace(/^models\//, "");
    return {
      sourceId: "gemini-api",
      recordKind: "model",
      externalId: name,
      title: stringValue(model.displayName) ?? apiIdentifier,
      summary: stringValue(model.description),
      originalUrl: "https://ai.google.dev/gemini-api/docs/models",
      sourceName: "Google Gemini Models API",
      sourceType: "official_model_api",
      publishedAt: null,
      detectedAt: now,
      retrievedAt: now,
      verificationStatus: "verified",
      confidenceLevel: "high",
      language: null,
      countryRegion: null,
      lastSuccessfulSyncAt: now,
      providerId: "google-gemini",
      data: {
        apiIdentifier,
        version: stringValue(model.version),
        contextLength: numberValue(model.inputTokenLimit),
        outputTokenLimit: numberValue(model.outputTokenLimit),
        supportedParameters: stringArray(model.supportedGenerationMethods),
        toolCalling: null,
        inputPricePerToken: null,
        outputPricePerToken: null,
        localAvailability: false,
        license: null,
      },
    };
  });
}

export { githubSchema, huggingFaceSchema, openRouterSchema };
