/**
 * «IA en acción» — catálogo de asistentes comerciales, entornos locales y
 * la matriz «tipo de tarea → herramienta». Precios consultados el
 * 2026-11-16 en las páginas oficiales o, cuando la página no publica cifras
 * legibles, en coberturas secundarias; cada plan enlaza a la fuente oficial
 * para que el visitante verifique antes de pagar. `usd: null` = la cifra
 * cambia por país y no la afirmamos.
 */

export const PRICES_CHECKED_AT = "2026-11-16";
/** IGV que se cobra en Perú a servicios digitales de proveedores no domiciliados. */
export const IGV_RATE = 0.18;

export type TaskKind =
  | "research"
  | "sheets"
  | "writing"
  | "slides"
  | "visual"
  | "code"
  | "study"
  | "data";

export type OfficeApp = "excel" | "word" | "powerpoint" | "outlook";

export type Plan = {
  name: string;
  /** Precio mensual de lista en US$ sin impuestos; null = varía por país. */
  usd: number | null;
  /** Qué ganas frente al plan anterior, en una línea. */
  gain: string;
};

export type Assistant = {
  id: string;
  name: string;
  maker: string;
  origin: string;
  url: string;
  pricingUrl: string;
  /** Estilo de respuesta: cómo «se siente» trabajar con él. */
  style: string;
  /** Hasta dónde llega: documentos largos, archivos, extensión. */
  reach: string;
  /** Aviso honesto sobre límites, consumo o privacidad. */
  watchOut: string;
  /** Nombre de su función de investigación profunda, si la tiene. */
  research: string | null;
  /** Integración con herramientas de oficina, si la tiene. */
  office: string | null;
  plans: Plan[];
};

export const ASSISTANTS: ReadonlyArray<Assistant> = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    maker: "OpenAI",
    origin: "EE. UU.",
    url: "https://chatgpt.com",
    pricingUrl: "https://chatgpt.com/pricing",
    style:
      "Conversacional y versátil: explica, redacta, analiza archivos y genera Excel, Word o PowerPoint descargables desde el chat.",
    reach:
      "Proyectos con archivos, análisis de datos con código, imágenes y agente. Los planes de pago amplían mensajes y adjuntos.",
    watchOut:
      "Go incluye anuncios y deja la investigación profunda en modo limitado. Para trabajo profesional diario, Plus es el punto de partida.",
    research: "Deep research (investigación profunda)",
    office:
      "No edita dentro de Word/Excel de escritorio: subes el archivo, lo analiza y te devuelve uno nuevo para descargar.",
    plans: [
      {
        name: "Free",
        usd: 0,
        gain: "Uso limitado de mensajes, archivos y voz.",
      },
      {
        name: "Go",
        usd: 8,
        gain: "Más mensajes, imágenes y adjuntos; con anuncios.",
      },
      {
        name: "Plus",
        usd: 20,
        gain: "Deep research ampliado, Codex, proyectos, tareas programadas y GPTs.",
      },
      {
        name: "Pro",
        usd: 100,
        gain: "Desde US$ 100: niveles de uso máximos y sesiones largas de Codex.",
      },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    maker: "Anthropic",
    origin: "EE. UU.",
    url: "https://claude.ai",
    pricingUrl: "https://claude.com/pricing",
    style:
      "Redacción cuidada y análisis de documentos largos; muy bueno para razonar sobre normas, contratos, informes y código.",
    reach:
      "Proyectos con documentos, Investigación, Claude Code y complementos para Microsoft 365 (Excel y PowerPoint) en Pro y Max.",
    watchOut:
      "El uso se mide por ventanas de 5 horas y un tope semanal: conversaciones muy largas con PDFs pesados lo agotan rápido. Abre un chat nuevo por tema, sube texto o Markdown en vez de PDF escaneado y pide respuestas concretas.",
    research: "Investigación (Research)",
    office:
      "Complemento dentro de Excel y PowerPoint; además crea archivos Excel, Word y PowerPoint descargables.",
    plans: [
      {
        name: "Free",
        usd: 0,
        gain: "Uso limitado, sin Claude Code ni Research.",
      },
      {
        name: "Pro",
        usd: 20,
        gain: "Claude Code, Research y Microsoft 365. US$ 17/mes si pagas el año.",
      },
      { name: "Max 5×", usd: 100, gain: "5 veces el uso de Pro." },
      { name: "Max 20×", usd: 200, gain: "20 veces el uso de Pro." },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    maker: "Google",
    origin: "EE. UU.",
    url: "https://gemini.google.com",
    pricingUrl: "https://gemini.google/subscriptions/",
    style:
      "Rápido y multimodal; destaca cuando ya trabajas con Gmail, Drive, Docs, Sheets y Slides. NotebookLM responde solo con tus fuentes.",
    reach:
      "Deep Research, NotebookLM, lectura de Drive y videos de YouTube; los planes amplían el cómputo y el almacenamiento.",
    watchOut:
      "Sus funciones de oficina viven en Google Workspace en línea (Docs, Sheets, Slides), no en Word o Excel de escritorio. En AI Pro el límite se renueva cada 5 horas hasta un tope semanal.",
    research: "Deep Research",
    office:
      "Integrado en Docs, Sheets, Slides y Gmail en el navegador; requiere tus archivos en Google Drive.",
    plans: [
      {
        name: "Gratis",
        usd: 0,
        gain: "Gemini básico y NotebookLM con límites.",
      },
      {
        name: "AI Plus",
        usd: null,
        gain: "Plan de entrada; su precio cambia por país (EE. UU. entre US$ 4.99 y 7.99).",
      },
      {
        name: "AI Pro",
        usd: 19.99,
        gain: "Más cómputo, Deep Research y funciones en Workspace.",
      },
      {
        name: "AI Ultra",
        usd: 100,
        gain: "5 veces el uso de Pro; hay nivel de US$ 200 (20×).",
      },
    ],
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    maker: "Microsoft",
    origin: "EE. UU.",
    url: "https://copilot.microsoft.com",
    pricingUrl:
      "https://www.microsoft.com/microsoft-365/buy/compare-all-microsoft-365-products",
    style:
      "Trabaja dentro del archivo abierto en Word, Excel, PowerPoint, Outlook y OneNote. Ideal para profesiones de oficina que ya viven en Microsoft 365.",
    reach:
      "Fórmulas y tablas en Excel, borradores y resúmenes en Word, presentaciones desde un documento, correos en Outlook; Researcher en Premium.",
    watchOut:
      "Personal y Familia traen créditos de IA mensuales (Personal: 60) y en Familia solo el titular usa Copilot. Premium quita el tope práctico. Las licencias de empresa se compran aparte.",
    research: "Researcher (en Microsoft 365 Premium)",
    office:
      "Nativo en Word, Excel, PowerPoint y Outlook de escritorio y web: no necesitas copiar y pegar.",
    plans: [
      { name: "Copilot gratis", usd: 0, gain: "Chat web y app, sin Office." },
      {
        name: "M365 Personal",
        usd: 9.99,
        gain: "Office de escritorio + Copilot con 60 créditos de IA al mes.",
      },
      {
        name: "M365 Familia",
        usd: 12.99,
        gain: "Hasta 6 personas en Office; Copilot solo para el titular.",
      },
      {
        name: "M365 Premium",
        usd: 19.99,
        gain: "Copilot sin tope práctico en tareas diarias y Researcher.",
      },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    maker: "Perplexity AI",
    origin: "EE. UU.",
    url: "https://www.perplexity.ai",
    pricingUrl: "https://www.perplexity.ai/pro",
    style:
      "Buscador conversacional: cada respuesta trae sus fuentes enlazadas. Útil para ubicar normas, noticias y artículos rápido.",
    reach: "Búsqueda con citas, investigación y espacios con tus archivos.",
    watchOut:
      "Resume lo que encuentra en la web: abre siempre la fuente original antes de citarla en un informe.",
    research: "Research",
    office: null,
    plans: [
      { name: "Free", usd: 0, gain: "Búsquedas con citas." },
      {
        name: "Pro",
        usd: 20,
        gain: "Más búsquedas Pro, elección de modelo y archivos.",
      },
    ],
  },
  {
    id: "grok",
    name: "Grok",
    maker: "xAI",
    origin: "EE. UU.",
    url: "https://grok.com",
    pricingUrl: "https://grok.com/plans",
    style:
      "Directo y al día con lo que se publica en X; bueno para tendencias.",
    reach: "Búsqueda en X y web, imágenes y modo de razonamiento.",
    watchOut:
      "Lo que circula en X no es fuente verificada: contrasta antes de usarlo profesionalmente.",
    research: "DeepSearch",
    office: null,
    plans: [
      { name: "Gratis", usd: 0, gain: "Uso limitado." },
      {
        name: "SuperGrok",
        usd: null,
        gain: "Más uso y modelos superiores; verifica el precio vigente.",
      },
    ],
  },
  {
    id: "meta",
    name: "Meta AI (Muse Spark)",
    maker: "Meta",
    origin: "EE. UU.",
    url: "https://www.meta.ai",
    pricingUrl:
      "https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs/",
    style:
      "Dentro de WhatsApp, Instagram y Facebook: respuestas rápidas sin instalar nada. La app Muse es su agente aparte.",
    reach:
      "Consultas, imágenes y razonamiento (Muse Spark); llega por país de forma gradual.",
    watchOut:
      "Práctico para consultas cotidianas; no lo uses con datos de pacientes, clientes o expedientes.",
    research: null,
    office: null,
    plans: [
      { name: "Meta AI", usd: 0, gain: "Gratis en las apps de Meta." },
      {
        name: "Muse Power",
        usd: 20,
        gain: "Agente Muse con más uso (según cobertura publicada).",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    maker: "DeepSeek",
    origin: "China",
    url: "https://chat.deepseek.com",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    style:
      "Razonamiento fuerte en matemática y código, chat gratuito y API muy barata.",
    reach:
      "Chat con archivos y búsqueda; sus modelos abiertos también corren en local.",
    watchOut:
      "Sus servidores están en China: no subas datos personales ni confidenciales al chat. Para privacidad, usa sus pesos abiertos en tu PC.",
    research: null,
    office: null,
    plans: [
      { name: "Chat", usd: 0, gain: "Gratis; la API se cobra por consumo." },
    ],
  },
  {
    id: "qwen",
    name: "Qwen Chat",
    maker: "Alibaba",
    origin: "China",
    url: "https://chat.qwen.ai",
    pricingUrl: "https://chat.qwen.ai",
    style:
      "Familia muy completa (texto, código, visión); varios de sus modelos son abiertos.",
    reach:
      "Chat, documentos, imágenes y Deep Research; los modelos Qwen son de los más usados en local.",
    watchOut:
      "Mismo cuidado de privacidad que con cualquier servicio en la nube extranjero.",
    research: "Deep Research",
    office: null,
    plans: [{ name: "Chat", usd: 0, gain: "Gratis." }],
  },
  {
    id: "kimi",
    name: "Kimi",
    maker: "Moonshot AI",
    origin: "China",
    url: "https://www.kimi.com",
    pricingUrl: "https://www.kimi.com",
    style: "Pensado para leer documentos muy largos y trabajar como agente.",
    reach: "Contexto extenso, investigación y presentaciones.",
    watchOut:
      "Revisa en su web los planes de pago vigentes y dónde se guardan tus archivos.",
    research: "Researcher",
    office: null,
    plans: [
      { name: "Gratis", usd: 0, gain: "Uso base; planes de pago opcionales." },
    ],
  },
  {
    id: "mistral",
    name: "Le Chat",
    maker: "Mistral AI",
    origin: "Francia",
    url: "https://chat.mistral.ai",
    pricingUrl: "https://mistral.ai/pricing",
    style:
      "Europeo, rápido y con buena privacidad (RGPD); modelos abiertos disponibles.",
    reach: "Chat, documentos, búsqueda e investigación.",
    watchOut: "Menos integraciones de oficina que Copilot o Gemini.",
    research: "Research",
    office: null,
    plans: [
      { name: "Free", usd: 0, gain: "Uso base." },
      { name: "Pro", usd: 14.99, gain: "Más uso y funciones avanzadas." },
    ],
  },
];

export function assistantById(id: string) {
  return ASSISTANTS.find((assistant) => assistant.id === id);
}

/** Precio con IGV, en soles. */
export function solesWithIgv(usd: number, fx: number) {
  return usd * fx * (1 + IGV_RATE);
}

/* ------------------------------------------------------------------------ */
/* Tipo de tarea → qué herramienta conviene                                  */
/* ------------------------------------------------------------------------ */

export type TaskProfile = {
  label: string;
  hint: string;
  /** Asistentes en orden de recomendación, con el porqué. */
  commercial: ReadonlyArray<{ id: string; why: string }>;
  /** Qué hacer en local para este tipo de tarea. */
  local: { runtime: string; models: string; note: string };
};

export const TASKS: Record<TaskKind, TaskProfile> = {
  research: {
    label: "Investigación profunda",
    hint: "Buscar, comparar y fundamentar con fuentes.",
    commercial: [
      { id: "chatgpt", why: "Deep research arma informes largos con citas." },
      {
        id: "gemini",
        why: "Deep Research + NotebookLM para trabajar solo con tus fuentes.",
      },
      { id: "claude", why: "Research y análisis fino de documentos largos." },
      { id: "perplexity", why: "Ubica fuentes rápido, cada línea con enlace." },
    ],
    local: {
      runtime: "AnythingLLM u Open WebUI sobre Ollama",
      models: "Qwen3 8B · Gemma 3 12B (o mayores si tu PC lo permite)",
      note: "En local no hay búsqueda web por defecto: tú cargas los documentos (RAG) y el modelo responde sobre ellos.",
    },
  },
  sheets: {
    label: "Hojas de cálculo",
    hint: "Fórmulas, tablas dinámicas, conciliaciones y macros.",
    commercial: [
      {
        id: "copilot",
        why: "Trabaja dentro del Excel abierto: fórmulas, tablas y gráficos.",
      },
      {
        id: "claude",
        why: "Complemento de Excel y genera libros con fórmulas listas.",
      },
      {
        id: "chatgpt",
        why: "Sube el .xlsx: analiza con código y devuelve el archivo.",
      },
      { id: "gemini", why: "Si tu equipo usa Google Sheets en línea." },
    ],
    local: {
      runtime: "LM Studio u Ollama",
      models: "Qwen3 8B · Qwen2.5-Coder 7B (fórmulas y VBA)",
      note: "Un modelo local no abre Excel: le pegas la estructura de columnas y te devuelve fórmulas o macros VBA para copiar.",
    },
  },
  writing: {
    label: "Redacción y documentos",
    hint: "Informes, oficios, escritos, contratos y correos.",
    commercial: [
      {
        id: "copilot",
        why: "Borradores, reescritura y resumen dentro de Word y Outlook.",
      },
      { id: "claude", why: "Tono formal y coherencia en textos largos." },
      { id: "chatgpt", why: "Versátil; entrega .docx listo para editar." },
      { id: "gemini", why: "Directo en Google Docs y Gmail." },
    ],
    local: {
      runtime: "LM Studio o Jan",
      models: "Qwen3 8B · Gemma 3 12B · Mistral Small",
      note: "Útil para borradores con información confidencial que no debe salir de tu equipo.",
    },
  },
  slides: {
    label: "Presentaciones",
    hint: "Diapositivas, exposiciones y material visual.",
    commercial: [
      {
        id: "copilot",
        why: "Crea una presentación en PowerPoint a partir de un Word.",
      },
      { id: "claude", why: "Complemento en PowerPoint y genera .pptx." },
      { id: "gemini", why: "Directo en Google Slides." },
      { id: "chatgpt", why: "Genera .pptx con estructura y notas del orador." },
    ],
    local: {
      runtime: "Ollama + Marp o Slidev",
      models: "Qwen3 8B",
      note: "El modelo escribe el contenido en Markdown y una herramienta como Marp lo convierte en diapositivas.",
    },
  },
  visual: {
    label: "Imágenes y planos",
    hint: "Renders, bocetos, diagramas y lectura de planos.",
    commercial: [
      {
        id: "chatgpt",
        why: "Genera y edita imágenes; describe planos y fotos.",
      },
      { id: "gemini", why: "Edición de imágenes y lectura visual muy capaz." },
      { id: "claude", why: "Lee planos y diagramas para revisar o describir." },
    ],
    local: {
      runtime: "ComfyUI (imágenes) · LM Studio con modelo de visión",
      models: "FLUX / SDXL para generar · Gemma 3 o Qwen-VL para leer imágenes",
      note: "La generación de imágenes en local pide GPU con 8 GB de VRAM o más.",
    },
  },
  code: {
    label: "Automatizar y programar",
    hint: "Scripts, macros, apps y agentes.",
    commercial: [
      {
        id: "claude",
        why: "Claude Code: agente que programa dentro de tu proyecto.",
      },
      {
        id: "chatgpt",
        why: "Codex: agente de programación incluido desde Plus.",
      },
      { id: "gemini", why: "Gemini CLI y Antigravity." },
      { id: "deepseek", why: "Barato por API para automatizaciones." },
    ],
    local: {
      runtime: "Ollama + agente (OpenCode, Aider, Cline)",
      models: "Qwen3-Coder · gpt-oss 20B",
      note: "Los agentes locales son más lentos y menos precisos que los comerciales, pero tu código no sale del equipo.",
    },
  },
  study: {
    label: "Estudio y docencia",
    hint: "Resúmenes, preguntas, casos y material didáctico.",
    commercial: [
      {
        id: "gemini",
        why: "NotebookLM: resúmenes, guías y audio solo de tus fuentes.",
      },
      { id: "chatgpt", why: "Modo estudio y cuestionarios." },
      { id: "claude", why: "Explica paso a paso y arma casos." },
    ],
    local: {
      runtime: "AnythingLLM (con tus libros) · LM Studio",
      models: "Gemma 3 4B–12B · Qwen3 8B",
      note: "Bueno para estudiar sin conexión con tus propios apuntes.",
    },
  },
  data: {
    label: "Análisis de datos",
    hint: "Estadística, series, indicadores y tableros.",
    commercial: [
      { id: "chatgpt", why: "Ejecuta Python sobre tu CSV/Excel y grafica." },
      { id: "claude", why: "Análisis con código y artefactos interactivos." },
      { id: "copilot", why: "Análisis dentro de Excel con Python en Excel." },
      { id: "gemini", why: "Sheets y Colab con Gemini." },
    ],
    local: {
      runtime: "Ollama + Jupyter / Python",
      models: "Qwen3 8B–14B · Qwen2.5-Coder",
      note: "El modelo escribe el código de análisis; tú lo ejecutas en tu PC con tus datos.",
    },
  },
};

/* ------------------------------------------------------------------------ */
/* IA local                                                                  */
/* ------------------------------------------------------------------------ */

export type LocalRuntime = {
  id: string;
  name: string;
  kind: string;
  url: string;
  start: string;
};

export const LOCAL_RUNTIMES: ReadonlyArray<LocalRuntime> = [
  {
    id: "ollama",
    name: "Ollama",
    kind: "Motor + app (Windows, macOS, Linux)",
    url: "https://ollama.com",
    start: "ollama run qwen3:8b",
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    kind: "App de escritorio con buscador de modelos",
    url: "https://lmstudio.ai",
    start: "Descargar → buscar «qwen3» → Load",
  },
  {
    id: "jan",
    name: "Jan",
    kind: "App de escritorio de código abierto",
    url: "https://jan.ai",
    start: "Descargar → Hub → elegir modelo",
  },
  {
    id: "anythingllm",
    name: "AnythingLLM",
    kind: "Chat con tus documentos (RAG)",
    url: "https://anythingllm.com",
    start: "Crear espacio → subir PDFs → elegir Ollama como motor",
  },
  {
    id: "openwebui",
    name: "Open WebUI",
    kind: "Interfaz web privada para Ollama",
    url: "https://openwebui.com",
    start: "Instalar con Docker o pip y apuntar a Ollama",
  },
];

export type HardwareTier = {
  id: string;
  label: string;
  /** RAM mínima del sistema en GiB. */
  ramGib: number;
  /** VRAM dedicada sugerida en GiB (0 = solo CPU). */
  vramGib: number;
  can: string;
  examples: string;
};

/**
 * Escalones orientativos: un modelo cuantizado a 4 bits ocupa ≈ 0,6 GB por
 * cada mil millones de parámetros, más contexto. LM Studio recomienda en
 * Windows 16 GB de RAM y 4 GB de VRAM como punto de partida.
 */
export const HARDWARE_TIERS: ReadonlyArray<HardwareTier> = [
  {
    id: "basic",
    label: "Equipo básico",
    ramGib: 8,
    vramGib: 0,
    can: "Modelos pequeños (3–4 B): resúmenes cortos y borradores, lento sin GPU.",
    examples: "gemma3:4b · qwen3:4b · llama3.2:3b",
  },
  {
    id: "mid",
    label: "Oficina recomendada",
    ramGib: 16,
    vramGib: 6,
    can: "Modelos de 7–12 B: redacción, consulta de documentos y fórmulas con fluidez.",
    examples: "qwen3:8b · gemma3:12b · llama3.1:8b",
  },
  {
    id: "high",
    label: "Estación de trabajo",
    ramGib: 32,
    vramGib: 12,
    can: "Modelos de 14–30 B: análisis largos, código y RAG con muchos documentos.",
    examples: "qwen3:14b · gpt-oss:20b · gemma3:27b",
  },
  {
    id: "pro",
    label: "Servidor o PC avanzada",
    ramGib: 64,
    vramGib: 24,
    can: "Modelos de 70 B o más: calidad cercana a los comerciales, para equipos o instituciones.",
    examples: "gpt-oss:120b · llama3.3:70b · qwen3:32b",
  },
];

/** Escalón que alcanza un perfil de hardware (null si no hay datos). */
export function tierFor(ramGib: number | null, vramGib: number | null) {
  if (ramGib == null) return null;
  let reached: HardwareTier | null = null;
  for (const tier of HARDWARE_TIERS) {
    const ramOk = ramGib >= tier.ramGib;
    // VRAM sin dato (el navegador no siempre la informa) no descarta el escalón.
    const vramOk =
      tier.vramGib === 0 ||
      vramGib == null ||
      vramGib >= tier.vramGib ||
      ramGib >= tier.ramGib * 2;
    if (ramOk && vramOk) reached = tier;
  }
  return reached;
}

/* ------------------------------------------------------------------------ */
/* Oficina con IA                                                            */
/* ------------------------------------------------------------------------ */

export const OFFICE_APPS: Record<
  OfficeApp,
  { label: string; tasks: ReadonlyArray<string> }
> = {
  excel: {
    label: "Excel",
    tasks: [
      "Explicar o escribir fórmulas (BUSCARX, SUMAR.SI.CONJUNTO, SI anidados).",
      "Crear tablas dinámicas y gráficos a partir de una pregunta.",
      "Detectar diferencias en conciliaciones y datos atípicos.",
      "Generar macros VBA o scripts de Office para tareas repetitivas.",
    ],
  },
  word: {
    label: "Word",
    tasks: [
      "Redactar un borrador a partir de notas o de otro documento.",
      "Resumir, reescribir en tono formal y revisar coherencia.",
      "Convertir una lista de datos en tabla o informe.",
    ],
  },
  powerpoint: {
    label: "PowerPoint",
    tasks: [
      "Crear una presentación desde un Word o PDF.",
      "Resumir una presentación larga y sugerir notas del orador.",
      "Reorganizar diapositivas y proponer diseño.",
    ],
  },
  outlook: {
    label: "Outlook",
    tasks: [
      "Resumir hilos largos de correo.",
      "Redactar respuestas con el tono adecuado.",
    ],
  },
};

/** Cómo se reparte cada asistente el trabajo de oficina. */
export const OFFICE_COMPARISON: ReadonlyArray<{
  id: string;
  where: string;
  best: string;
  limit: string;
}> = [
  {
    id: "copilot",
    where: "Dentro de Word, Excel, PowerPoint y Outlook (escritorio y web).",
    best: "Si tu oficina ya usa Microsoft 365: trabaja sobre el archivo abierto.",
    limit:
      "Créditos mensuales en Personal/Familia; los archivos deben estar en OneDrive para varias funciones.",
  },
  {
    id: "gemini",
    where: "Dentro de Google Docs, Sheets, Slides y Gmail (en línea).",
    best: "Equipos que comparten todo en Google Drive.",
    limit: "No trabaja dentro de Office de escritorio; necesita conexión.",
  },
  {
    id: "claude",
    where: "Complemento en Excel y PowerPoint + archivos descargables.",
    best: "Modelos financieros, libros con fórmulas y presentaciones bien estructuradas.",
    limit:
      "Consume bastante uso con archivos grandes: divide el trabajo por hojas.",
  },
  {
    id: "chatgpt",
    where: "En el chat: subes el archivo y descargas el resultado.",
    best: "Análisis con código sobre tus datos y archivos nuevos listos.",
    limit:
      "Copias y pegas entre el chat y Office; no edita el archivo abierto.",
  },
];

/** Enlace a una búsqueda de YouTube: siempre vigente, sin inventar videos. */
export function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
