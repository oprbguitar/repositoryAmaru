// Motor de recomendación determinista de Mi laboratorio.
// Reglas explícitas sobre datos indexados reales (ofertas de precios, modelos
// abiertos, repositorios). Nunca inventa precios: si faltan datos, el costo se
// marca como parcial. Versionar cualquier cambio de reglas en ENGINE_VERSION.

export const ENGINE_VERSION = "1.0.0";

export type PrivacyLevel =
  | "public_cloud"
  | "private_cloud"
  | "local_preferred"
  | "fully_offline"
  | "confidential";

export type ExpectedResult =
  | "chat"
  | "rag"
  | "document_analysis"
  | "transcription"
  | "ocr"
  | "classification"
  | "dashboard"
  | "agent"
  | "voice"
  | "image_analysis"
  | "automation";

export type ProjectInputs = {
  name: string;
  problem: string;
  domain: string;
  region: string;
  users: {
    internal: boolean;
    external: boolean;
    estimatedCount: number;
    technicalLevel: "basic" | "intermediate" | "advanced";
    languages: string[];
  };
  dataTypes: string[];
  dailyVolumeDocuments: number;
  averageDocumentPages: number;
  sensitiveData: boolean;
  personalData: boolean;
  privacy: PrivacyLevel;
  monthlyBudgetUsd: number;
  freeOnly: boolean;
  hardware: {
    cpu: string;
    ramGb: number;
    gpu: string;
    vramGb: number;
    storageGb: number;
    os: string;
    dockerAvailable: boolean;
  };
  expectedResults: ExpectedResult[];
};

export type IndexedOffering = {
  modelExternalId: string;
  modelTitle: string;
  providerName: string;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  contextLength: number | null;
  verifiedAt: string;
};

export type IndexedOpenModel = {
  externalId: string;
  title: string;
  sourceName: string;
  license: string | null;
  url: string;
};

export type IndexedRepository = {
  externalId: string;
  title: string;
  stars: number;
  topics: string[];
  url: string;
};

export type EngineContext = {
  offerings: IndexedOffering[];
  openModels: IndexedOpenModel[];
  repositories: IndexedRepository[];
};

export type CostItem = {
  concept: string;
  monthlyUsd: number | null;
  formula: string;
  source: string | null;
};

export type Alternative = {
  kind: "economic" | "local" | "professional";
  title: string;
  architecture: string[];
  models: Array<{
    id: string;
    title: string;
    provider: string;
    reason: string;
  }>;
  repositories: Array<{ title: string; url: string; stars: number }>;
  costItems: CostItem[];
  totalMonthlyUsd: number | null;
  costComplete: boolean;
  hardwareRequirement: string;
  privacyLevel: string;
  difficulty: "baja" | "media" | "alta";
  advantages: string[];
  limitations: string[];
  risks: string[];
  stages: string[];
  explanation: {
    constraintsApplied: string[];
    dataSources: string[];
    missingInformation: string[];
    confidence: "alta" | "media" | "baja";
  };
};

const TOKENS_PER_PAGE = 600;

function estimateMonthlyTokens(inputs: ProjectInputs): {
  inputMillions: number;
  outputMillions: number;
  formula: string;
} {
  const pagesPerMonth =
    Math.max(inputs.dailyVolumeDocuments, 0) *
    Math.max(inputs.averageDocumentPages, 1) *
    22;
  const inputTokens = pagesPerMonth * TOKENS_PER_PAGE;
  const outputTokens = inputTokens * 0.25;
  return {
    inputMillions: inputTokens / 1_000_000,
    outputMillions: outputTokens / 1_000_000,
    formula: `${inputs.dailyVolumeDocuments} docs/día × ${inputs.averageDocumentPages} páginas × ${TOKENS_PER_PAGE} tokens/página × 22 días; salida estimada = 25 % de la entrada`,
  };
}

function architectureFor(results: ExpectedResult[], local: boolean): string[] {
  const nodes = ["Usuario", "Interfaz web"];
  if (results.includes("voice")) nodes.push("Captura de audio");
  nodes.push("API");
  if (results.includes("transcription") || results.includes("voice"))
    nodes.push("Speech-to-text");
  if (results.includes("ocr")) nodes.push("OCR");
  if (results.includes("rag") || results.includes("document_analysis")) {
    nodes.push(
      "Ingesta de archivos",
      "Chunking",
      "Embeddings",
      "Base vectorial",
      "Retriever",
    );
  }
  if (results.includes("agent") || results.includes("automation"))
    nodes.push("Orquestador de agentes", "Herramientas");
  nodes.push(local ? "LLM local" : "LLM (API)");
  if (results.includes("dashboard")) nodes.push("Dashboard");
  nodes.push("Almacenamiento", "Registros");
  return nodes;
}

function relevantRepositories(
  repositories: IndexedRepository[],
  results: ExpectedResult[],
  local: boolean,
): IndexedRepository[] {
  const groups: string[][] = [];
  if (results.includes("rag") || results.includes("document_analysis"))
    groups.push([
      "rag",
      "retrieval-augmented-generation",
      "vector-database",
      "embeddings",
    ]);
  if (results.includes("agent") || results.includes("automation"))
    groups.push(["ai-agent", "agents", "llm-agent", "agent"]);
  if (results.includes("transcription") || results.includes("voice"))
    groups.push([
      "speech-to-text",
      "whisper",
      "speech-recognition",
      "text-to-speech",
    ]);
  if (results.includes("ocr")) groups.push(["ocr", "document-understanding"]);
  if (results.includes("image_analysis"))
    groups.push(["computer-vision", "vision"]);
  if (local)
    groups.push(["local-ai", "ollama", "llama-cpp", "vllm", "llamacpp"]);
  if (groups.length === 0) groups.push(["llm", "chatbot"]);
  const wanted = new Set<string>(groups.flat());
  return repositories
    .filter((repository) =>
      repository.topics.some((topic) => wanted.has(topic)),
    )
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 4);
}

function cheapestOfferings(offerings: IndexedOffering[]): IndexedOffering[] {
  return offerings
    .filter(
      (offering) =>
        offering.inputPricePerMillion !== null &&
        offering.outputPricePerMillion !== null,
    )
    .sort(
      (a, b) => (a.inputPricePerMillion ?? 0) - (b.inputPricePerMillion ?? 0),
    );
}

function capableOfferings(offerings: IndexedOffering[]): IndexedOffering[] {
  return offerings
    .filter(
      (offering) =>
        (offering.contextLength ?? 0) >= 100_000 &&
        offering.inputPricePerMillion !== null,
    )
    .sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0));
}

function apiCost(
  offering: IndexedOffering | undefined,
  tokens: ReturnType<typeof estimateMonthlyTokens>,
): CostItem {
  if (
    !offering ||
    offering.inputPricePerMillion === null ||
    offering.outputPricePerMillion === null
  ) {
    return {
      concept: "Inferencia LLM (API)",
      monthlyUsd: null,
      formula: "Sin ofertas de precio indexadas para calcular",
      source: null,
    };
  }
  const cost =
    tokens.inputMillions * offering.inputPricePerMillion +
    tokens.outputMillions * offering.outputPricePerMillion;
  return {
    concept: `Inferencia LLM (${offering.modelTitle} vía ${offering.providerName})`,
    monthlyUsd: Math.round(cost * 100) / 100,
    formula: `${tokens.inputMillions.toFixed(2)}M tokens entrada × $${offering.inputPricePerMillion}/M + ${tokens.outputMillions.toFixed(2)}M salida × $${offering.outputPricePerMillion}/M — ${tokens.formula}`,
    source: `Precio verificado ${offering.verifiedAt.slice(0, 10)} (OpenRouter endpoints)`,
  };
}

function localHardwareCheck(inputs: ProjectInputs): {
  capable: boolean;
  requirement: string;
} {
  const vram = inputs.hardware.vramGb;
  const ram = inputs.hardware.ramGb;
  if (vram >= 16 || ram >= 48)
    return {
      capable: true,
      requirement: `Hardware declarado (VRAM ${vram} GB, RAM ${ram} GB) permite modelos abiertos de 7–14B cuantizados o mayores`,
    };
  if (vram >= 8 || ram >= 24)
    return {
      capable: true,
      requirement: `Hardware declarado (VRAM ${vram} GB, RAM ${ram} GB) permite modelos abiertos de 3–8B cuantizados`,
    };
  return {
    capable: false,
    requirement: `Hardware declarado (VRAM ${vram} GB, RAM ${ram} GB) limita la inferencia local a modelos pequeños (<4B); considerar ampliación`,
  };
}

function sumCosts(items: CostItem[]): {
  total: number | null;
  complete: boolean;
} {
  const known = items.filter((item) => item.monthlyUsd !== null);
  const complete = known.length === items.length && items.length > 0;
  const total = known.reduce((sum, item) => sum + (item.monthlyUsd ?? 0), 0);
  return {
    total: known.length ? Math.round(total * 100) / 100 : null,
    complete,
  };
}

export function recommend(
  inputs: ProjectInputs,
  context: EngineContext,
): Alternative[] {
  const tokens = estimateMonthlyTokens(inputs);
  const localOnly =
    inputs.privacy === "fully_offline" || inputs.privacy === "confidential";
  const preferLocal = localOnly || inputs.privacy === "local_preferred";
  const cheapest = cheapestOfferings(context.offerings);
  const capable = capableOfferings(context.offerings);
  const hardware = localHardwareCheck(inputs);
  const repositoriesLocal = relevantRepositories(
    context.repositories,
    inputs.expectedResults,
    true,
  );
  const repositoriesCloud = relevantRepositories(
    context.repositories,
    inputs.expectedResults,
    false,
  );
  const dataSources = [
    "model_offerings (precios OpenRouter por proveedor)",
    "observatory_records (modelos abiertos y repositorios indexados)",
    "Perfil de hardware declarado por el usuario",
  ];
  const missingBase: string[] = [];
  if (!context.offerings.length)
    missingBase.push(
      "No hay ofertas de precios indexadas: sincroniza modelos para calcular costos",
    );
  if (!context.repositories.length)
    missingBase.push("No hay repositorios indexados para sugerir herramientas");

  const alternatives: Alternative[] = [];

  // 1. Alternativa económica (API de menor precio verificado)
  {
    const offering = inputs.freeOnly
      ? cheapest.find((entry) => entry.inputPricePerMillion === 0)
      : cheapest[0];
    const items: CostItem[] = [apiCost(offering, tokens)];
    const { total, complete } = sumCosts(items);
    const constraints = [
      inputs.freeOnly
        ? "Restricción: solo opciones gratuitas"
        : `Presupuesto mensual declarado: US$ ${inputs.monthlyBudgetUsd}`,
      `Privacidad: ${inputs.privacy}`,
    ];
    alternatives.push({
      kind: "economic",
      title: "Alternativa económica (API de bajo costo)",
      architecture: architectureFor(inputs.expectedResults, false),
      models: offering
        ? [
            {
              id: offering.modelExternalId,
              title: offering.modelTitle,
              provider: offering.providerName,
              reason: inputs.freeOnly
                ? "Oferta gratuita verificada de menor precio indexada"
                : "Menor precio de entrada por millón de tokens entre las ofertas indexadas",
            },
          ]
        : [],
      repositories: repositoriesCloud.map((repository) => ({
        title: repository.title,
        url: repository.url,
        stars: repository.stars,
      })),
      costItems: items,
      totalMonthlyUsd: total,
      costComplete: complete,
      hardwareRequirement:
        "Sin requisitos locales: la inferencia ocurre en la nube",
      privacyLevel: "Nube pública (los datos salen del equipo)",
      difficulty: "baja",
      advantages: [
        "Menor costo inicial",
        "Sin mantenimiento de infraestructura",
        "Escala con la demanda",
      ],
      limitations: [
        "Los datos se envían a un proveedor externo",
        "Dependencia de disponibilidad y precios del proveedor",
      ],
      risks: localOnly
        ? [
            "Incompatible con la restricción de privacidad declarada (confidencial/offline)",
          ]
        : ["Cambios de precio del proveedor afectan el costo mensual"],
      stages: [
        "Prototipo con la API seleccionada",
        "Conexión de datos de entrada",
        "Pruebas con usuarios",
        "Puesta en producción y monitoreo de costos",
      ],
      explanation: {
        constraintsApplied: constraints,
        dataSources,
        missingInformation: offering
          ? missingBase
          : [...missingBase, "Sin oferta que cumpla la restricción de precio"],
        confidence: offering ? "alta" : "baja",
      },
    });
  }

  // 2. Alternativa local/privada (modelos abiertos en hardware propio)
  {
    const openModel = context.openModels[0];
    const items: CostItem[] = [
      {
        concept: "Inferencia local (electricidad y mantenimiento)",
        monthlyUsd: null,
        formula:
          "Depende de tarifas eléctricas locales no indexadas por el observatorio",
        source: null,
      },
    ];
    const { total, complete } = sumCosts(items);
    alternatives.push({
      kind: "local",
      title: "Alternativa local y privada (modelos abiertos)",
      architecture: architectureFor(inputs.expectedResults, true),
      models: openModel
        ? [
            {
              id: openModel.externalId,
              title: openModel.title,
              provider: `Ejecución local (${openModel.sourceName})`,
              reason:
                "Modelo con pesos abiertos indexado más reciente compatible con ejecución local",
            },
          ]
        : [],
      repositories: repositoriesLocal.map((repository) => ({
        title: repository.title,
        url: repository.url,
        stars: repository.stars,
      })),
      costItems: items,
      totalMonthlyUsd: total,
      costComplete: complete,
      hardwareRequirement: hardware.requirement,
      privacyLevel: "Local: los datos no salen del equipo",
      difficulty: hardware.capable ? "media" : "alta",
      advantages: [
        "Privacidad completa de los datos",
        "Sin costo por token",
        "Funciona sin conexión",
      ],
      limitations: [
        hardware.capable
          ? "Calidad limitada por el tamaño de modelo que soporta el hardware"
          : "El hardware declarado es insuficiente para modelos medianos",
        "Requiere instalación y mantenimiento técnico",
      ],
      risks: [
        "Actualizaciones de modelos y herramientas quedan a cargo del usuario",
      ],
      stages: [
        "Instalar runtime local (Ollama / llama.cpp / vLLM)",
        "Descargar y validar el modelo abierto",
        "Montar la canalización de datos",
        "Pruebas de calidad y rendimiento",
      ],
      explanation: {
        constraintsApplied: [
          `Privacidad: ${inputs.privacy}`,
          hardware.requirement,
        ],
        dataSources,
        missingInformation: [
          ...missingBase,
          "El costo eléctrico local no está indexado; el costo se marca parcial",
        ],
        confidence: openModel ? "media" : "baja",
      },
    });
  }

  // 3. Alternativa profesional (modelo de mayor capacidad indexada)
  {
    const offering = capable[0] ?? cheapest.at(-1);
    const items: CostItem[] = [apiCost(offering, tokens)];
    const { total, complete } = sumCosts(items);
    alternatives.push({
      kind: "professional",
      title: "Alternativa profesional (mayor capacidad)",
      architecture: [
        ...architectureFor(inputs.expectedResults, false),
        "Monitoreo",
        "Autenticación",
      ],
      models: offering
        ? [
            {
              id: offering.modelExternalId,
              title: offering.modelTitle,
              provider: offering.providerName,
              reason:
                "Mayor ventana de contexto entre las ofertas indexadas con precio verificado",
            },
          ]
        : [],
      repositories: repositoriesCloud.map((repository) => ({
        title: repository.title,
        url: repository.url,
        stars: repository.stars,
      })),
      costItems: items,
      totalMonthlyUsd: total,
      costComplete: complete,
      hardwareRequirement:
        "Sin requisitos locales exigentes; se recomienda entorno de despliegue gestionado",
      privacyLevel: preferLocal
        ? "Nube — revisa acuerdos de tratamiento de datos antes de usarla"
        : "Nube con controles de acceso",
      difficulty: "media",
      advantages: [
        "Mayor calidad y contexto",
        "Arquitectura preparada para producción",
      ],
      limitations: ["Mayor costo mensual", "Requiere gestión de credenciales"],
      risks:
        inputs.monthlyBudgetUsd > 0 &&
        total !== null &&
        total > inputs.monthlyBudgetUsd
          ? [
              `El costo estimado (US$ ${total}) supera el presupuesto declarado (US$ ${inputs.monthlyBudgetUsd})`,
            ]
          : ["Dependencia del proveedor seleccionado"],
      stages: [
        "Diseño de arquitectura y seguridad",
        "Implementación por módulos",
        "Evaluación con métricas",
        "Despliegue y monitoreo continuo",
      ],
      explanation: {
        constraintsApplied: [
          `Usuarios estimados: ${inputs.users.estimatedCount}`,
          `Presupuesto mensual: US$ ${inputs.monthlyBudgetUsd}`,
        ],
        dataSources,
        missingInformation: missingBase,
        confidence: offering ? "alta" : "baja",
      },
    });
  }

  return alternatives;
}
