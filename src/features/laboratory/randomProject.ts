// Generador de proyectos aleatorios para Mi laboratorio.
// Produce entradas completas y coherentes para el motor determinista, de modo
// que un proyecto pueda crearse de inicio a fin con un solo clic y mostrar
// todas las alternativas, costos y riesgos calculados.

import type {
  ExpectedResult,
  ProjectInputs,
} from "../../../lib/laboratory/engine";

type Scenario = {
  domain: string;
  problem: string;
  results: ExpectedResult[];
  dataTypes: string[];
};

const SCENARIOS: Scenario[] = [
  {
    domain: "Legal",
    problem:
      "Revisar contratos y expedientes extensos para detectar cláusulas de riesgo y resumirlas para el equipo.",
    results: ["rag", "document_analysis", "classification"],
    dataTypes: ["PDF", "DOCX", "Carpeta local"],
  },
  {
    domain: "Salud",
    problem:
      "Transcribir consultas médicas y generar notas clínicas estructuradas protegiendo los datos del paciente.",
    results: ["transcription", "document_analysis"],
    dataTypes: ["Audio", "Texto"],
  },
  {
    domain: "Educación",
    problem:
      "Construir un asistente de estudio que responda preguntas sobre el material del curso y genere cuestionarios.",
    results: ["chat", "rag"],
    dataTypes: ["PDF", "Texto", "Sitio web"],
  },
  {
    domain: "Finanzas",
    problem:
      "Extraer cifras de facturas y reportes escaneados y consolidarlas en un tablero mensual.",
    results: ["ocr", "document_analysis", "dashboard"],
    dataTypes: ["PDF", "Imágenes", "XLSX"],
  },
  {
    domain: "Atención al cliente",
    problem:
      "Clasificar tickets entrantes, sugerir respuestas y escalar los casos críticos automáticamente.",
    results: ["classification", "chat", "automation"],
    dataTypes: ["Texto", "API", "Base de datos"],
  },
  {
    domain: "Agroindustria",
    problem:
      "Analizar fotografías de cultivos para detectar plagas y generar alertas de campo.",
    results: ["image_analysis", "dashboard"],
    dataTypes: ["Imágenes", "Carpeta local"],
  },
  {
    domain: "Medios",
    problem:
      "Transcribir entrevistas en audio y video, resumirlas y etiquetar los temas tratados.",
    results: ["transcription", "document_analysis", "classification"],
    dataTypes: ["Audio", "Video"],
  },
  {
    domain: "Logística",
    problem:
      "Automatizar la lectura de guías de remisión y conciliar entregas contra el sistema de pedidos.",
    results: ["ocr", "automation", "agent"],
    dataTypes: ["PDF", "Imágenes", "API"],
  },
  {
    domain: "Gobierno",
    problem:
      "Habilitar un asistente de voz en español para consultas ciudadanas frecuentes sobre trámites.",
    results: ["voice", "chat"],
    dataTypes: ["Texto", "Sitio web"],
  },
  {
    domain: "Investigación",
    problem:
      "Organizar una biblioteca de papers y responder preguntas con citas a los documentos fuente.",
    results: ["rag", "chat", "document_analysis"],
    dataTypes: ["PDF", "Texto", "Carpeta local"],
  },
];

const PRIVACY_LEVELS: ProjectInputs["privacy"][] = [
  "public_cloud",
  "private_cloud",
  "local_preferred",
  "fully_offline",
  "confidential",
];

const HARDWARE_PROFILES: ProjectInputs["hardware"][] = [
  {
    cpu: "Intel Core i5 (portátil)",
    ramGb: 16,
    gpu: "",
    vramGb: 0,
    storageGb: 512,
    os: "Windows",
    dockerAvailable: false,
  },
  {
    cpu: "AMD Ryzen 7",
    ramGb: 32,
    gpu: "NVIDIA RTX 3060",
    vramGb: 12,
    storageGb: 1024,
    os: "Windows",
    dockerAvailable: true,
  },
  {
    cpu: "Intel Core i9",
    ramGb: 64,
    gpu: "NVIDIA RTX 4090",
    vramGb: 24,
    storageGb: 2048,
    os: "Linux",
    dockerAvailable: true,
  },
  {
    cpu: "Apple M2",
    ramGb: 24,
    gpu: "GPU integrada",
    vramGb: 0,
    storageGb: 512,
    os: "macOS",
    dockerAvailable: true,
  },
];

const BUDGETS = [0, 20, 50, 100, 250, 500];

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomProjectInputs(): ProjectInputs {
  const scenario = pick(SCENARIOS);
  const privacy = pick(PRIVACY_LEVELS);
  const budget = pick(BUDGETS);
  const external = Math.random() < 0.4;
  const sensitive =
    privacy === "confidential" || privacy === "fully_offline"
      ? true
      : Math.random() < 0.3;
  const serial = Math.floor(Math.random() * 900) + 100;
  return {
    name: `Aleatorio ${serial} — ${scenario.domain}`,
    problem: scenario.problem,
    domain: scenario.domain,
    region: "Perú",
    users: {
      internal: true,
      external,
      estimatedCount: pickInt(1, 120),
      technicalLevel: pick(["basic", "intermediate", "advanced"] as const),
      languages: ["es"],
    },
    dataTypes: scenario.dataTypes,
    dailyVolumeDocuments: pickInt(5, 400),
    averageDocumentPages: pickInt(1, 40),
    sensitiveData: sensitive,
    personalData: sensitive && Math.random() < 0.7,
    privacy,
    monthlyBudgetUsd: budget,
    freeOnly: budget === 0,
    hardware: pick(HARDWARE_PROFILES),
    expectedResults: scenario.results,
  };
}
