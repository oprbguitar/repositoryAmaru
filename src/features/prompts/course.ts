/**
 * Summary of the PIT 2026 course «Aplicaciones de inteligencia artificial»
 * (Universidad Nacional de Ingeniería), taken from the text version of the
 * material the owner provided. Only what complements the rest of AMARU is
 * kept; model names are those the course itself cites (dated material).
 */

export const COURSE = {
  title: "Aplicaciones de inteligencia artificial — PIT 2026",
  origin:
    "Programa de Iniciación Tecnológica, Universidad Nacional de Ingeniería",
  format: "6 sesiones virtuales · 18 horas",
  note: "Resumen del material del curso. Los modelos citados corresponden a la fecha del material; para versiones actuales revisa «Modelos».",
};

export const COURSE_SESSIONS: ReadonlyArray<{
  n: number;
  title: string;
  points: ReadonlyArray<string>;
  link?: { label: string; tab: "cadenas" | "tecnicas" | "agentes" };
}> = [
  {
    n: 1,
    title: "Fundamentos e ecosistema generativo",
    points: [
      "Tokens, embeddings, codificación posicional y autoatención (Q, K, V).",
      "Comparación de ecosistemas de frontera y casos de uso.",
      "Ética, alucinaciones, privacidad y gobernanza de datos.",
    ],
  },
  {
    n: 2,
    title: "El arte del prompt engineering",
    points: [
      "Anatomía: rol, tarea, contexto y formato.",
      "Zero/few-shot, CoT, autoconsistencia, autorrefinamiento, ToT.",
      "Temperatura, Top-P y máximo de tokens; salida JSON.",
    ],
    link: { label: "Ver técnicas", tab: "tecnicas" },
  },
  {
    n: 3,
    title: "IA para productividad e investigación",
    points: [
      "Consensus: medidor de consenso, síntesis, tabla de papers.",
      "Napkin: texto a diagramas, mapas mentales y cronogramas.",
      "Uso ético: verificar referencias inventadas.",
    ],
    link: { label: "Cadena de investigación", tab: "cadenas" },
  },
  {
    n: 4,
    title: "Software con IA (vibe coding)",
    points: [
      "De la sintaxis a la orquestación por intención.",
      "Bolt.new (WebContainers) frente a Lovable.dev (UI + Supabase).",
      "Prompt para web en 9 puntos.",
    ],
    link: { label: "Prompt para una web", tab: "cadenas" },
  },
  {
    n: 5,
    title: "Agentes, RAG y herramientas",
    points: [
      "ReAct: pensamiento → acción → observación.",
      "Herramientas: APIs, web scraping, código.",
      "Memoria, contexto y RAG con n8n y Dify.",
    ],
    link: { label: "Ver agentes", tab: "agentes" },
  },
  {
    n: 6,
    title: "Orquestación y despliegue",
    points: [
      "Canales: WhatsApp, Telegram, Slack con webhooks.",
      "Memoria conversacional por usuario y CRMs.",
      "Fallbacks, seguridad en producción y multiagente.",
    ],
    link: { label: "Patrones agénticos", tab: "agentes" },
  },
];

export const ECOSYSTEMS: ReadonlyArray<{
  company: string;
  strength: string;
  ideal: string;
}> = [
  {
    company: "OpenAI",
    strength:
      "Versatilidad general, multimodal nativo, ecosistema de GPTs y Canvas.",
    ideal: "Agentes de propósito general, conversación y visión.",
  },
  {
    company: "Anthropic (Claude)",
    strength: "Razonamiento, escritura refinada y código limpio; Artifacts.",
    ideal: "Programación asistida y documentos técnicos densos.",
  },
  {
    company: "Google (Gemini)",
    strength: "Multimodal nativo y ventana de contexto de 1–2 M de tokens.",
    ideal: "Repositorios completos, horas de video, libros enteros.",
  },
  {
    company: "Mistral AI",
    strength:
      "Eficiencia por parámetro, modelos abiertos y soberanía de datos.",
    ideal: "Entornos con privacidad estricta y despliegue local.",
  },
  {
    company: "DeepSeek",
    strength: "Mixture-of-Experts, CoT explícito, licencia MIT, muy económico.",
    ideal: "Matemática, código complejo y despliegue privado.",
  },
];

export const PARAMETERS: ReadonlyArray<{
  name: string;
  low: string;
  high: string;
}> = [
  {
    name: "Temperatura",
    low: "Baja (0–0,3): respuestas estables y precisas; extracción, código, JSON.",
    high: "Alta (0,8–1,2): más variedad; lluvia de ideas, ficción.",
  },
  {
    name: "Top-P",
    low: "Bajo (0,1–0,5): solo las palabras más probables; formal y predecible.",
    high: "Alto (0,9–1): vocabulario amplio; textos creativos.",
  },
  {
    name: "Máx. tokens",
    low: "Corto: respuestas breves y baratas.",
    high: "Largo: informes; vigila el costo y el corte a mitad de frase.",
  },
];

export const GOVERNANCE: ReadonlyArray<{
  aspect: string;
  classic: string;
  llm: string;
}> = [
  {
    aspect: "Gobernanza",
    classic: "Controla bases de datos y aplicaciones.",
    llm: "Controla fuentes, prompts, herramientas y documentos que usa el modelo.",
  },
  {
    aspect: "Privacidad",
    classic: "Protege datos personales almacenados.",
    llm: "Protege también los datos que se envían al modelo.",
  },
  {
    aspect: "Seguridad",
    classic: "Control de acceso a sistemas.",
    llm: "Defensa contra prompt injection, fuga de datos y acceso indebido vía el modelo.",
  },
  {
    aspect: "Auditoría",
    classic: "Registra accesos a la base de datos.",
    llm: "Registra consultas, respuestas, documentos recuperados y acciones de agentes.",
  },
];

/** Hands-on comparisons proposed in the course (u1 · comparación entre LLM). */
export const COMPARISONS: ReadonlyArray<{
  title: string;
  prompt: string;
  expect: string;
}> = [
  {
    title: "Razonamiento visible (CoT)",
    prompt:
      "Tres cajas etiquetadas «Manzanas», «Naranjas» y «Manzanas y Naranjas» están todas mal etiquetadas. Puedes sacar una sola fruta de una sola caja sin mirar. ¿De qué caja sacas para deducir el contenido de las tres?",
    expect:
      "Un modelo con razonamiento explícito muestra los pasos; otros dan la respuesta directa.",
  },
  {
    title: "JSON limpio para otro sistema",
    prompt:
      "Actúa como una API que extrae datos. Del texto «El cliente Juan Pérez (ID: 8841) compró una laptop por $1200 el 12/05/2026 y aplicó un descuento del 10%.» devuelve ÚNICAMENTE JSON con cliente{nombre,id}, transaccion{monto_original,descuento_aplicado,monto_final}.",
    expect:
      "Algunos modelos devuelven JSON crudo listo para consumir; otros lo envuelven en texto, lo que rompe integraciones.",
  },
  {
    title: "Herramientas nativas",
    prompt:
      "Genera una imagen de un letrero de neón azul en una calle nocturna que diga exactamente «NEURAL».",
    expect:
      "Los ecosistemas con herramientas integradas generan la imagen; otros solo devuelven un prompt mejorado.",
  },
  {
    title: "Revisión de código",
    prompt:
      "Este código Python tiene una condición de carrera al retirar saldo con dos hilos. Arréglalo, refactoriza con patrón Repository y excepciones propias.",
    expect:
      "Se espera que detecten la condición de carrera y usen un lock; cambia cuánto texto acompaña al código.",
  },
];
