/**
 * Prompt-chain catalogue. Authored deterministically (no AI at runtime) from
 * well-known public repositories and the PIT 2026 course material. Every
 * chain lists the sources it is based on; star counts are a snapshot taken
 * from the GitHub API on 2026-11-10 and are labelled as such in the UI.
 */

export type CategoryId =
  | "razonamiento"
  | "video"
  | "imagen"
  | "informes"
  | "mapas"
  | "juridico"
  | "software"
  | "investigacion"
  | "aprendizaje"
  | "agentes"
  | "datos"
  | "diagramas"
  | "documentos"
  | "tendencias";

export const CATEGORIES: ReadonlyArray<{
  id: CategoryId;
  label: string;
  hint: string;
  bubble: 1 | 2 | 3 | 4 | 5 | 6;
}> = [
  {
    id: "razonamiento",
    label: "Razonamiento",
    hint: "CoT, ToT, autoconsistencia",
    bubble: 5,
  },
  {
    id: "video",
    label: "Video",
    hint: "Guion → planos → prompts por capa",
    bubble: 1,
  },
  {
    id: "imagen",
    label: "Imagen",
    hint: "Brief → prompt estructurado → variantes",
    bubble: 6,
  },
  {
    id: "informes",
    label: "Informes",
    hint: "Por partes, con crítica y verificación",
    bubble: 3,
  },
  {
    id: "mapas",
    label: "Mapas mentales",
    hint: "Conceptos → jerarquía → markmap",
    bubble: 2,
  },
  {
    id: "juridico",
    label: "Jurídico",
    hint: "Relación jurídica, IRAC, riesgos",
    bubble: 4,
  },
  {
    id: "software",
    label: "Software",
    hint: "Especificación → plan → código → pruebas",
    bubble: 3,
  },
  {
    id: "investigacion",
    label: "Investigación",
    hint: "Pregunta → evidencia → síntesis",
    bubble: 2,
  },
  {
    id: "aprendizaje",
    label: "Aprendizaje",
    hint: "Preguntas sencillas a complejas",
    bubble: 6,
  },
  {
    id: "agentes",
    label: "Agentes",
    hint: "Sistemas agénticos por fases",
    bubble: 5,
  },
  {
    id: "datos",
    label: "Análisis de datos",
    hint: "CSV/Excel → perfil → hallazgos → gráficos",
    bubble: 3,
  },
  {
    id: "diagramas",
    label: "Diagramas y gráficos",
    hint: "Flujos, pie charts y secuencias en código",
    bubble: 2,
  },
  {
    id: "documentos",
    label: "Documentos largos",
    hint: "Leer, categorizar y resumir por partes",
    bubble: 4,
  },
  {
    id: "tendencias",
    label: "Tendencias",
    hint: "Ingeniería de contexto, MCP y agentes de código",
    bubble: 1,
  },
];

export type Source = { label: string; url: string; stars?: number };

export const SOURCES = {
  promptGuide: {
    label: "dair-ai/Prompt-Engineering-Guide",
    url: "https://github.com/dair-ai/Prompt-Engineering-Guide",
    stars: 79970,
  },
  promptsChat: {
    label: "f/prompts.chat (ex Awesome ChatGPT Prompts)",
    url: "https://github.com/f/prompts.chat",
    stars: 176840,
  },
  anthropicTutorial: {
    label: "anthropics/prompt-eng-interactive-tutorial",
    url: "https://github.com/anthropics/prompt-eng-interactive-tutorial",
    stars: 39193,
  },
  claudeCookbooks: {
    label: "anthropics/claude-cookbooks",
    url: "https://github.com/anthropics/claude-cookbooks",
    stars: 54496,
  },
  openaiCookbook: {
    label: "openai/openai-cookbook",
    url: "https://github.com/openai/openai-cookbook",
    stars: 77032,
  },
  geminiCookbook: {
    label: "google-gemini/cookbook",
    url: "https://github.com/google-gemini/cookbook",
    stars: 17917,
  },
  fabric: {
    label: "danielmiessler/Fabric (patrones)",
    url: "https://github.com/danielmiessler/Fabric",
    stars: 44595,
  },
  nirPrompt: {
    label: "NirDiamant/Prompt_Engineering",
    url: "https://github.com/NirDiamant/Prompt_Engineering",
    stars: 7932,
  },
  nirAgents: {
    label: "NirDiamant/GenAI_Agents",
    url: "https://github.com/NirDiamant/GenAI_Agents",
    stars: 24917,
  },
  tot: {
    label: "princeton-nlp/tree-of-thought-llm",
    url: "https://github.com/princeton-nlp/tree-of-thought-llm",
    stars: 6089,
  },
  dspy: {
    label: "stanfordnlp/dspy",
    url: "https://github.com/stanfordnlp/dspy",
    stars: 39002,
  },
  imageVideo: {
    label: "ai-boost/awesome-image-video-prompts",
    url: "https://github.com/ai-boost/awesome-image-video-prompts",
    stars: 3465,
  },
  shortFilm: {
    label: "jnMetaCode/ai-shortfilm-prompts",
    url: "https://github.com/jnMetaCode/ai-shortfilm-prompts",
    stars: 527,
  },
  nanoBanana: {
    label: "YouMind-OpenLab/awesome-nano-banana-pro-prompts",
    url: "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts",
    stars: 13771,
  },
  markmap: {
    label: "markmap/markmap",
    url: "https://github.com/markmap/markmap",
    stars: 13231,
  },
  mermaid: {
    label: "mermaid-js/mermaid",
    url: "https://github.com/mermaid-js/mermaid",
    stars: 91070,
  },
  legal: {
    label: "EnriqueArceNunez/legal-prompting",
    url: "https://github.com/EnriqueArceNunez/legal-prompting",
    stars: 6,
  },
  specKit: {
    label: "github/spec-kit",
    url: "https://github.com/github/spec-kit",
    stars: 149192,
  },
  superpowers: {
    label: "obra/superpowers",
    url: "https://github.com/obra/superpowers",
    stars: 315702,
  },
  systemPrompts: {
    label: "x1xhlol/system-prompts-and-models-of-ai-tools",
    url: "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools",
    stars: 144602,
  },
  langgraph: {
    label: "langchain-ai/langgraph",
    url: "https://github.com/langchain-ai/langgraph",
    stars: 44763,
  },
  crewai: {
    label: "crewAIInc/crewAI",
    url: "https://github.com/crewAIInc/crewAI",
    stars: 60740,
  },
  autogen: {
    label: "microsoft/autogen",
    url: "https://github.com/microsoft/autogen",
    stars: 61779,
  },
  openaiAgents: {
    label: "openai/openai-agents-python",
    url: "https://github.com/openai/openai-agents-python",
    stars: 30600,
  },
  adk: {
    label: "google/adk-python",
    url: "https://github.com/google/adk-python",
    stars: 22177,
  },
  agentsBeginners: {
    label: "microsoft/ai-agents-for-beginners",
    url: "https://github.com/microsoft/ai-agents-for-beginners",
    stars: 79367,
  },
  genaiBeginners: {
    label: "microsoft/generative-ai-for-beginners",
    url: "https://github.com/microsoft/generative-ai-for-beginners",
    stars: 123313,
  },
  dify: {
    label: "langgenius/dify",
    url: "https://github.com/langgenius/dify",
    stars: 160877,
  },
  n8n: {
    label: "n8n-io/n8n",
    url: "https://github.com/n8n-io/n8n",
    stars: 210014,
  },
  claudeSkills: {
    label: "ComposioHQ/awesome-claude-skills",
    url: "https://github.com/ComposioHQ/awesome-claude-skills",
    stars: 79219,
  },
  course: {
    label: "Curso PIT 2026 «Aplicaciones de IA» (UNI)",
    url: "#curso",
  },
} satisfies Record<string, Source>;

export const STARS_SNAPSHOT = "2026-11-10";

/** Model tiers instead of brand promises: the UI shows examples per tier. */
export const MODEL_TIERS = {
  razonador: {
    label: "Razonador de frontera",
    examples: "Claude Opus/Sonnet, GPT-5, Gemini 2.5 Pro, DeepSeek R1",
  },
  rapido: {
    label: "Rápido y económico",
    examples: "Claude Haiku, GPT-5 mini, Gemini Flash, Llama 3.x 8B",
  },
  contexto: {
    label: "Contexto largo",
    examples: "Gemini Pro (1–2 M tokens), Claude con 1 M de contexto",
  },
  codigo: {
    label: "Programación",
    examples: "Claude Sonnet/Opus, GPT-5 Codex, Qwen3 Coder, Codestral",
  },
  imagen: {
    label: "Generación de imagen",
    examples: "Gemini «Nano Banana», GPT-Image, FLUX, Midjourney",
  },
  video: {
    label: "Generación de video",
    examples: "Veo 3, Sora 2, Kling, Seedance, Runway",
  },
  voz: {
    label: "Voz y audio",
    examples: "ElevenLabs, OpenAI TTS, Gemini TTS",
  },
  local: {
    label: "Local / privado",
    examples: "Llama, Qwen, Mistral en Ollama o LM Studio",
  },
  gratis: {
    label: "Gratis en este sitio",
    examples: "Workers AI (Llama 3.2 3B) con cupo diario",
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

export type ChainStep = {
  title: string;
  goal: string;
  tier: ModelTier;
  prompt: string;
  output: string;
};

export type PromptChain = {
  id: string;
  category: CategoryId;
  title: string;
  summary: string;
  level: "intermedio" | "avanzado";
  variables: ReadonlyArray<{ key: string; label: string; example: string }>;
  steps: ReadonlyArray<ChainStep>;
  sources: ReadonlyArray<Source>;
};

export const CHAINS: ReadonlyArray<PromptChain> = [
  {
    id: "video-9-capas",
    category: "video",
    title: "Video corto en 9 capas",
    summary:
      "Del concepto al prompt final por plano. Cada plano se describe en nueve capas para que el modelo de video no improvise.",
    level: "avanzado",
    variables: [
      {
        key: "tema",
        label: "Tema o historia",
        example: "una llama que aprende a programar en Cusco",
      },
      { key: "duracion", label: "Duración total", example: "45 segundos" },
      { key: "formato", label: "Formato", example: "vertical 9:16 para redes" },
      {
        key: "estilo",
        label: "Estilo visual",
        example: "animación 3D cálida, tipo stop-motion",
      },
    ],
    steps: [
      {
        title: "1 · Concepto y logline",
        goal: "Fijar la idea, el público y el gancho de los primeros 3 segundos.",
        tier: "razonador",
        prompt:
          "Actúa como director creativo de video corto. Tema: {{tema}}. Duración: {{duracion}}. Formato: {{formato}}.\nPropón 3 conceptos distintos. Para cada uno: logline de 1 frase, público, emoción dominante y gancho de los primeros 3 segundos. Luego elige el mejor y justifica en 3 viñetas.",
        output: "3 conceptos + elección justificada",
      },
      {
        title: "2 · Guion por escenas",
        goal: "Dividir la historia en escenas con tiempo asignado.",
        tier: "razonador",
        prompt:
          "Con el concepto elegido, escribe un guion de {{duracion}} dividido en escenas. Tabla: nº, segundos (inicio–fin), qué ocurre, texto en pantalla, narración/diálogo. Ninguna escena dura más de 8 segundos.",
        output: "Tabla de escenas con tiempos",
      },
      {
        title: "3 · Biblia de consistencia",
        goal: "Evitar que personajes y entorno cambien entre planos.",
        tier: "razonador",
        prompt:
          "Crea la «biblia» del video: descripción fija de cada personaje (rasgos, ropa, colores HEX, proporciones), del entorno y de la paleta {{estilo}}. Redáctala como bloque reutilizable que se pegará al inicio de cada prompt de plano.",
        output: "Bloque de consistencia reutilizable",
      },
      {
        title: "4 · Desglose en 9 capas por plano",
        goal: "Describir cada plano con las nueve capas.",
        tier: "razonador",
        prompt:
          "Para cada escena, genera un plano con estas 9 capas, una por línea:\n1) Sujeto  2) Acción  3) Entorno  4) Encuadre y lente  5) Movimiento de cámara  6) Iluminación  7) Estilo y paleta ({{estilo}})  8) Ánimo y ritmo  9) Audio (música, efectos, diálogo).\nAñade «Técnico»: duración, {{formato}}, y «Evitar»: lo que no debe aparecer.",
        output: "Ficha de 9 capas por plano",
      },
      {
        title: "5 · Prompt final por plano",
        goal: "Convertir cada ficha en el prompt del modelo de video.",
        tier: "rapido",
        prompt:
          'Convierte cada ficha de 9 capas en un prompt de video en inglés, en un solo párrafo, empezando por la biblia de consistencia. Máximo 120 palabras por plano. Devuelve JSON: [{"plano":1,"prompt":"...","negativo":"...","segundos":n}].',
        output: "JSON listo para Veo / Sora / Kling",
      },
      {
        title: "6 · Voz, música y control de calidad",
        goal: "Cerrar audio y revisar continuidad antes de generar.",
        tier: "razonador",
        prompt:
          "Revisa el JSON como supervisor de continuidad: señala saltos de personaje, de luz o de eje de cámara y corrígelos. Luego escribe el guion de locución con marcas de pausa y una descripción de música (tempo, instrumentos) para el modelo de voz.",
        output: "JSON corregido + locución + música",
      },
    ],
    sources: [SOURCES.imageVideo, SOURCES.shortFilm, SOURCES.geminiCookbook],
  },
  {
    id: "imagen-consistente",
    category: "imagen",
    title: "Imagen con texto exacto y variantes",
    summary:
      "Brief → prompt estructurado por bloques → variantes controladas → edición puntual. Útil para afiches, portadas y personajes.",
    level: "intermedio",
    variables: [
      { key: "pieza", label: "Pieza", example: "afiche para un taller de IA" },
      {
        key: "texto",
        label: "Texto exacto en la imagen",
        example: "TALLER IA 2026",
      },
      { key: "estilo", label: "Estilo", example: "ilustración plana pastel" },
    ],
    steps: [
      {
        title: "1 · Brief visual",
        goal: "Aclarar objetivo, público y restricciones.",
        tier: "rapido",
        prompt:
          "Actúa como director de arte. Pieza: {{pieza}}. Estilo: {{estilo}}. Redacta un brief: objetivo, público, mensaje, jerarquía visual (qué se ve primero), paleta (5 colores HEX) y qué evitar.",
        output: "Brief de 6 puntos",
      },
      {
        title: "2 · Prompt por bloques",
        goal: "Separar sujeto, composición, luz, lente, estilo y texto.",
        tier: "rapido",
        prompt:
          'Con el brief, escribe un prompt de imagen en bloques: [Sujeto] [Composición y encuadre] [Iluminación] [Lente/perspectiva] [Estilo y paleta] [Texto exacto entre comillas: "{{texto}}", tipografía y posición] [Relación de aspecto]. Termina con una línea «Evitar:».',
        output: "Prompt estructurado",
      },
      {
        title: "3 · Variantes controladas",
        goal: "Explorar cambiando una sola variable a la vez.",
        tier: "rapido",
        prompt:
          "Genera 4 variantes del prompt cambiando solo una dimensión por variante (composición, luz, paleta, tipografía). Indica qué cambió en cada una.",
        output: "4 prompts comparables",
      },
      {
        title: "4 · Edición puntual",
        goal: "Corregir sin regenerar todo.",
        tier: "imagen",
        prompt:
          'Instrucción de edición para el modelo de imagen: conserva todo igual excepto [elemento]. Cambia [elemento] por [nuevo valor]. Verifica que el texto diga exactamente "{{texto}}".',
        output: "Imagen final",
      },
    ],
    sources: [SOURCES.nanoBanana, SOURCES.imageVideo, SOURCES.course],
  },
  {
    id: "informe-por-partes",
    category: "informes",
    title: "Informe técnico por partes",
    summary:
      "El modelo no escribe todo de golpe: primero el esquema, luego cada sección con evidencia, después se autocritica y al final se ensambla.",
    level: "avanzado",
    variables: [
      {
        key: "tema",
        label: "Tema del informe",
        example: "adopción de IA generativa en mypes peruanas",
      },
      { key: "lector", label: "Lector", example: "gerencia no técnica" },
      { key: "extension", label: "Extensión", example: "6 páginas" },
    ],
    steps: [
      {
        title: "1 · Esquema",
        goal: "Estructura antes que prosa.",
        tier: "razonador",
        prompt:
          "Actúa como analista sénior. Tema: {{tema}}. Lector: {{lector}}. Extensión: {{extension}}.\nPropón un índice con 5–7 secciones. Para cada sección: pregunta que responde, datos que necesita y longitud. No redactes aún.",
        output: "Índice con preguntas por sección",
      },
      {
        title: "2 · Evidencia por sección",
        goal: "Reunir datos con fuente antes de redactar.",
        tier: "contexto",
        prompt:
          "Para la sección «[nombre]», lista los hechos clave con su fuente (autor, año, enlace). Marca como [VERIFICAR] todo dato sin fuente. No inventes cifras.",
        output: "Lista de hechos con fuente",
      },
      {
        title: "3 · Redacción sección a sección",
        goal: "Escribir cada parte con la evidencia anterior.",
        tier: "razonador",
        prompt:
          "Redacta la sección «[nombre]» usando solo la evidencia aprobada. Tono para {{lector}}. Cierra con 1 frase de implicancia práctica.",
        output: "Sección redactada",
      },
      {
        title: "4 · Autocrítica (self-refine)",
        goal: "Detectar huecos y sesgos.",
        tier: "razonador",
        prompt:
          "Critica el borrador como revisor exigente: afirmaciones sin sustento, sesgos, contradicciones, jerga innecesaria. Luego reescribe aplicando tus críticas.",
        output: "Borrador mejorado + lista de cambios",
      },
      {
        title: "5 · Ensamblado y resumen ejecutivo",
        goal: "Unir y abrir con lo esencial.",
        tier: "rapido",
        prompt:
          "Une las secciones, uniforma estilo y numeración, y escribe un resumen ejecutivo de 5 viñetas al inicio y 3 recomendaciones al final.",
        output: "Informe completo",
      },
      {
        title: "6 · Verificación de citas",
        goal: "Que ninguna referencia sea inventada.",
        tier: "rapido",
        prompt:
          "Extrae todas las referencias en una tabla (cita, URL/DOI, afirmación que respalda). Señala las que no tengan URL o DOI verificable para revisión humana.",
        output: "Tabla de verificación",
      },
    ],
    sources: [SOURCES.fabric, SOURCES.anthropicTutorial, SOURCES.course],
  },
  {
    id: "mapa-mental",
    category: "mapas",
    title: "Mapa mental desde cualquier texto",
    summary:
      "Extrae conceptos, los jerarquiza y entrega Markdown compatible con markmap o un bloque mermaid «mindmap».",
    level: "intermedio",
    variables: [
      {
        key: "texto",
        label: "Tema o texto fuente",
        example: "Unidad 5: agentes, RAG y herramientas",
      },
      { key: "profundidad", label: "Niveles", example: "3" },
    ],
    steps: [
      {
        title: "1 · Extracción de conceptos",
        goal: "Separar ideas centrales de detalles.",
        tier: "rapido",
        prompt:
          "Lee el contenido: {{texto}}.\nLista los 15–25 conceptos clave con una definición de máximo 12 palabras cada uno.",
        output: "Lista de conceptos",
      },
      {
        title: "2 · Jerarquía y relaciones",
        goal: "Agrupar en ramas.",
        tier: "razonador",
        prompt:
          "Agrupa los conceptos en 4–6 ramas principales con hasta {{profundidad}} niveles. Indica relaciones transversales importantes como «A → causa → B».",
        output: "Árbol con relaciones",
      },
      {
        title: "3 · Salida markmap",
        goal: "Formato que se dibuja solo.",
        tier: "rapido",
        prompt:
          "Devuelve ÚNICAMENTE Markdown con encabezados #, ## y viñetas, listo para pegar en markmap.js.org. Sin texto adicional.",
        output: "Markdown de markmap",
      },
      {
        title: "4 · Alternativa mermaid",
        goal: "Para documentos que aceptan mermaid.",
        tier: "rapido",
        prompt:
          "Convierte el mismo árbol a un bloque ```mermaid mindmap``` válido (indentación con dos espacios, sin caracteres especiales en los nodos).",
        output: "Bloque mermaid",
      },
    ],
    sources: [SOURCES.markmap, SOURCES.mermaid, SOURCES.course],
  },
  {
    id: "relacion-juridica",
    category: "juridico",
    title: "Análisis de relación jurídica (Perú)",
    summary:
      "Hechos → sujetos, objeto y vínculo → normas → IRAC por cuestión → contraargumentos → riesgos. Siempre requiere revisión de un abogado.",
    level: "avanzado",
    variables: [
      {
        key: "caso",
        label: "Hechos del caso",
        example:
          "contrato de locación renovado 4 años con horario y jefe directo",
      },
      { key: "rama", label: "Rama del derecho", example: "laboral" },
    ],
    steps: [
      {
        title: "1 · Hechos ordenados",
        goal: "Cronología neutral, sin calificar.",
        tier: "razonador",
        prompt:
          "Actúa como asistente legal en Perú. Ordena cronológicamente los hechos: {{caso}}. Separa hechos probados, alegados y faltantes. No califiques jurídicamente todavía.",
        output: "Cronología + vacíos de información",
      },
      {
        title: "2 · Elementos de la relación jurídica",
        goal: "Identificar sujetos, objeto, vínculo y causa.",
        tier: "razonador",
        prompt:
          "Identifica la relación jurídica: sujeto activo, sujeto pasivo, objeto, vínculo (derechos y deberes) y hecho jurídico que la origina, en materia {{rama}}. Explica cada elemento con el hecho que lo sustenta.",
        output: "Tabla de elementos",
      },
      {
        title: "3 · Cuestiones y normas",
        goal: "Qué hay que resolver y con qué normas.",
        tier: "contexto",
        prompt:
          "Formula las cuestiones jurídicas como preguntas. Para cada una, indica normas peruanas y jurisprudencia que podrían aplicar, marcando [VERIFICAR VIGENCIA] en todas. No inventes números de expediente.",
        output: "Cuestiones + normas a verificar",
      },
      {
        title: "4 · IRAC por cuestión",
        goal: "Razonamiento ordenado.",
        tier: "razonador",
        prompt:
          "Desarrolla cada cuestión con IRAC: Issue (cuestión), Rule (norma), Application (aplicación a los hechos), Conclusion. Señala el nivel de certeza (alto/medio/bajo).",
        output: "IRAC por cuestión",
      },
      {
        title: "5 · Abogado del diablo",
        goal: "Anticipar la defensa contraria.",
        tier: "razonador",
        prompt:
          "Asume la posición contraria y redacta sus 3 mejores argumentos y las pruebas que usaría. Luego responde cada uno.",
        output: "Contraargumentos y réplicas",
      },
      {
        title: "6 · Riesgos y próximos pasos",
        goal: "Decisión informada, no un dictamen.",
        tier: "rapido",
        prompt:
          "Resume: viabilidad, riesgos, plazos a verificar, pruebas que faltan y preguntas para el abogado. Incluye al final: «Este análisis no reemplaza asesoría legal profesional».",
        output: "Resumen ejecutivo legal",
      },
    ],
    sources: [SOURCES.legal, SOURCES.fabric],
  },
  {
    id: "arbol-de-pensamientos",
    category: "razonamiento",
    title: "Problema complejo con árbol de pensamientos",
    summary:
      "Explora varias rutas, las evalúa, poda las débiles y valida la respuesta por mayoría (autoconsistencia).",
    level: "avanzado",
    variables: [
      {
        key: "problema",
        label: "Problema",
        example: "¿conviene migrar un sistema local a la nube este año?",
      },
    ],
    steps: [
      {
        title: "1 · Descomposición",
        goal: "Partir el problema en subproblemas.",
        tier: "razonador",
        prompt:
          "Problema: {{problema}}.\nDescompónlo en 3–5 subproblemas independientes y di qué información necesita cada uno.",
        output: "Subproblemas",
      },
      {
        title: "2 · Tres ramas",
        goal: "Generar enfoques distintos.",
        tier: "razonador",
        prompt:
          "Imagina 3 expertos con enfoques distintos (técnico, financiero, de riesgo). Cada uno escribe su primer paso de razonamiento y lo comparte. Si un experto detecta que su camino es incorrecto, lo abandona.",
        output: "3 ramas con primer paso",
      },
      {
        title: "3 · Evaluación y poda",
        goal: "Puntuar y retroceder si hace falta.",
        tier: "razonador",
        prompt:
          "Puntúa cada rama de 1 a 10 en viabilidad, costo y riesgo. Descarta las de puntaje < 6 y desarrolla las restantes 2 pasos más. Si todas fallan, vuelve al paso 1 (backtracking).",
        output: "Ramas puntuadas",
      },
      {
        title: "4 · Autoconsistencia",
        goal: "Votar la respuesta más estable.",
        tier: "rapido",
        prompt:
          "Resuelve de nuevo el problema 3 veces de forma independiente y compara las conclusiones. Quédate con la que se repite y explica las discrepancias.",
        output: "Conclusión por mayoría",
      },
    ],
    sources: [SOURCES.tot, SOURCES.promptGuide, SOURCES.course],
  },
  {
    id: "escalera-de-preguntas",
    category: "aprendizaje",
    title: "Escalera de preguntas: de sencillo a complejo",
    summary:
      "Para estudiar cualquier tema: explicación simple, nivel universitario, preguntas socráticas y examen corto con retroalimentación.",
    level: "intermedio",
    variables: [
      { key: "tema", label: "Tema", example: "autoatención en transformers" },
    ],
    steps: [
      {
        title: "1 · Explicación simple",
        goal: "Intuición antes que fórmulas.",
        tier: "gratis",
        prompt:
          "Explica {{tema}} como si tuviera 12 años, con una analogía cotidiana y en máximo 120 palabras.",
        output: "Explicación con analogía",
      },
      {
        title: "2 · Nivel universitario",
        goal: "Precisión técnica.",
        tier: "razonador",
        prompt:
          "Ahora explica {{tema}} a nivel universitario: definición formal, componentes, un ejemplo numérico pequeño y errores comunes.",
        output: "Explicación técnica",
      },
      {
        title: "3 · Preguntas socráticas",
        goal: "Que la persona piense, no que copie.",
        tier: "gratis",
        prompt:
          "Hazme 5 preguntas socráticas sobre {{tema}}, de menor a mayor dificultad. Espera mi respuesta a cada una antes de continuar y corrige con pistas, no con la solución.",
        output: "Diálogo guiado",
      },
      {
        title: "4 · Examen corto",
        goal: "Comprobar comprensión.",
        tier: "rapido",
        prompt:
          'Crea 6 preguntas de opción múltiple sobre {{tema}} con 4 alternativas. Al final, en JSON: [{"pregunta":"","correcta":"B","porque":""}].',
        output: "Quiz + clave en JSON",
      },
    ],
    sources: [SOURCES.anthropicTutorial, SOURCES.genaiBeginners],
  },
  {
    id: "software-por-especificacion",
    category: "software",
    title: "Software guiado por especificación",
    summary:
      "Especificación → plan técnico → tareas → implementación tarea por tarea → pruebas → revisión. El método que hoy usan los agentes de código.",
    level: "avanzado",
    variables: [
      {
        key: "producto",
        label: "Producto",
        example: "app para registrar asistencia de un taller",
      },
      {
        key: "stack",
        label: "Stack preferido",
        example: "React + Cloudflare Workers + D1",
      },
    ],
    steps: [
      {
        title: "1 · Especificación",
        goal: "Qué y para quién, sin tecnología.",
        tier: "razonador",
        prompt:
          "Escribe la especificación de {{producto}}: problema, usuarios, historias de usuario con criterios de aceptación (Dado/Cuando/Entonces), fuera de alcance y preguntas abiertas. No menciones tecnología.",
        output: "spec.md",
      },
      {
        title: "2 · Plan técnico",
        goal: "Arquitectura y decisiones.",
        tier: "codigo",
        prompt:
          "Con spec.md y el stack {{stack}}, redacta plan.md: modelo de datos, endpoints, componentes, seguridad (secretos fuera del repositorio), pruebas y riesgos. Justifica cada decisión en una línea.",
        output: "plan.md",
      },
      {
        title: "3 · Tareas pequeñas",
        goal: "Trabajo verificable en pasos.",
        tier: "codigo",
        prompt:
          "Divide plan.md en tareas de menos de 1 hora, ordenadas por dependencia. Cada tarea: archivos, criterio de terminado y prueba que la verifica.",
        output: "tasks.md",
      },
      {
        title: "4 · Implementación con pruebas primero",
        goal: "Una tarea a la vez.",
        tier: "codigo",
        prompt:
          "Implementa solo la tarea N. Primero escribe la prueba que falla, luego el código mínimo que la pasa, luego refactoriza. Muestra el diff y el resultado de las pruebas.",
        output: "Diff + pruebas en verde",
      },
      {
        title: "5 · Revisión",
        goal: "Otro modelo revisa al primero.",
        tier: "razonador",
        prompt:
          "Revisa el diff como revisor sénior: errores, seguridad, rendimiento y legibilidad. Clasifica por severidad y propone el cambio exacto.",
        output: "Lista de hallazgos",
      },
    ],
    sources: [SOURCES.specKit, SOURCES.superpowers, SOURCES.systemPrompts],
  },
  {
    id: "web-9-puntos",
    category: "software",
    title: "Prompt para una web (9 puntos del curso)",
    summary:
      "La estructura de la Unidad 4 para Bolt.new o Lovable: objetivo, alcance, apariencia, estructura, contenido, comportamiento, responsive, restricciones y entrega.",
    level: "intermedio",
    variables: [
      { key: "web", label: "Qué web", example: "landing para un curso de IA" },
      {
        key: "publico",
        label: "Para quién",
        example: "estudiantes de ingeniería",
      },
    ],
    steps: [
      {
        title: "1 · Redactar los 9 puntos",
        goal: "Un prompt completo, sin huecos.",
        tier: "razonador",
        prompt:
          "Ayúdame a escribir el prompt de construcción para {{web}} dirigida a {{publico}}. Pregúntame lo que falte y luego entrega el prompt con estos apartados: 1. Objetivo 2. Alcance (qué sí y qué no) 3. Apariencia 4. Estructura 5. Contenido por sección 6. Comportamiento 7. Responsive 8. Restricciones técnicas 9. Criterio de entrega.",
        output: "Prompt maestro",
      },
      {
        title: "2 · Iterar por sección",
        goal: "Cambios pequeños, no reescrituras.",
        tier: "codigo",
        prompt:
          "Modifica solo la sección «[nombre]»: [cambio]. No toques el resto del código ni el estilo global.",
        output: "Web ajustada",
      },
    ],
    sources: [SOURCES.course],
  },
  {
    id: "investigacion-academica",
    category: "investigacion",
    title: "Investigación académica asistida",
    summary:
      "IA propone → investigador verifica → investigador decide. Pregunta, búsqueda, tabla de evidencia, síntesis y limitaciones.",
    level: "avanzado",
    variables: [
      {
        key: "pregunta",
        label: "Pregunta de investigación",
        example: "¿la IA generativa mejora el aprendizaje universitario?",
      },
    ],
    steps: [
      {
        title: "1 · Afinar la pregunta",
        goal: "Pregunta investigable.",
        tier: "razonador",
        prompt:
          "Convierte «{{pregunta}}» en una pregunta PICO (población, intervención, comparación, resultado) y propone 5 cadenas de búsqueda con operadores booleanos.",
        output: "Pregunta PICO + búsquedas",
      },
      {
        title: "2 · Tabla de evidencia",
        goal: "Comparar estudios lado a lado.",
        tier: "contexto",
        prompt:
          "Con los resúmenes que te pego (de Consensus, Semantic Scholar o Investigación de AMARU), arma una tabla: autor/año, tipo de estudio, muestra, metodología, resultado, limitaciones, DOI.",
        output: "Tabla de evidencia",
      },
      {
        title: "3 · Síntesis con grado de acuerdo",
        goal: "Qué dice la literatura en conjunto.",
        tier: "razonador",
        prompt:
          "Sintetiza la tabla: grado de acuerdo entre estudios (sí / mixto / no), calidad de la evidencia y vacíos. Cita cada afirmación con [autor, año].",
        output: "Síntesis citada",
      },
      {
        title: "4 · Uso ético",
        goal: "Transparencia sobre la ayuda de IA.",
        tier: "rapido",
        prompt:
          "Redacta una nota de uso de IA para la metodología: qué herramientas se usaron, para qué tareas y cómo se verificó cada referencia.",
        output: "Declaración de uso de IA",
      },
    ],
    sources: [SOURCES.course, SOURCES.promptGuide],
  },
  {
    id: "analisis-de-datos",
    category: "datos",
    title: "Análisis de datos desde un CSV o Excel",
    summary:
      "Perfil de los datos, limpieza, preguntas de negocio, hallazgos con cifras y gráficos listos. Sin inventar valores.",
    level: "intermedio",
    variables: [
      {
        key: "datos",
        label: "Qué datos son",
        example: "ventas mensuales 2025 por tienda",
      },
      {
        key: "pregunta",
        label: "Pregunta de negocio",
        example: "¿qué tiendas crecen y cuáles caen?",
      },
    ],
    steps: [
      {
        title: "1 · Perfil de los datos",
        goal: "Entender columnas, tipos y calidad antes de concluir.",
        tier: "contexto",
        prompt:
          "Adjunto un archivo con {{datos}}. Antes de analizar, describe: columnas y tipo, filas, rango de fechas, valores faltantes, duplicados y valores atípicos. No calcules conclusiones todavía.",
        output: "Perfil de calidad",
      },
      {
        title: "2 · Limpieza propuesta",
        goal: "Decidir qué corregir y por qué.",
        tier: "rapido",
        prompt:
          "Propón las transformaciones de limpieza necesarias y su impacto (filas afectadas). Muéstralas como código Python (pandas) o fórmulas de Excel, sin aplicarlas aún.",
        output: "Plan de limpieza + código",
      },
      {
        title: "3 · Análisis guiado por la pregunta",
        goal: "Responder con cifras verificables.",
        tier: "razonador",
        prompt:
          "Responde: {{pregunta}}. Para cada hallazgo indica la cifra exacta, cómo se calculó y el nivel de confianza. Si los datos no alcanzan para responder, dilo.",
        output: "Hallazgos con cifras",
      },
      {
        title: "4 · Gráficos",
        goal: "Un gráfico por mensaje, el adecuado.",
        tier: "rapido",
        prompt:
          "Para cada hallazgo, elige el gráfico adecuado (línea para tiempo, barras para comparar, dispersión para relación; pie chart solo si son partes de un todo con ≤5 categorías) y genera el código o la especificación con títulos y ejes en español.",
        output: "Gráficos + código",
      },
      {
        title: "5 · Resumen ejecutivo",
        goal: "Lo que una gerencia necesita leer.",
        tier: "rapido",
        prompt:
          "Resume en 5 viñetas los hallazgos, 3 recomendaciones y las limitaciones de los datos.",
        output: "Resumen de 1 página",
      },
    ],
    sources: [SOURCES.openaiCookbook, SOURCES.claudeCookbooks],
  },
  {
    id: "diagramas-y-graficos",
    category: "diagramas",
    title: "Diagramas de flujo y gráficos detallados",
    summary:
      "El modelo escribe el diagrama como código (mermaid) y una herramienta lo dibuja: flujos, secuencias, procesos y pie charts sin errores de trazo.",
    level: "intermedio",
    variables: [
      {
        key: "proceso",
        label: "Proceso o datos",
        example: "atención de un reclamo desde que llega hasta que se cierra",
      },
    ],
    steps: [
      {
        title: "1 · Pasos y decisiones",
        goal: "Ordenar antes de dibujar.",
        tier: "rapido",
        prompt:
          "Describe {{proceso}} como lista numerada de pasos. Marca las decisiones (sí/no), los responsables y los puntos de espera.",
        output: "Lista de pasos y decisiones",
      },
      {
        title: "2 · Diagrama de flujo",
        goal: "Código que se dibuja solo.",
        tier: "rapido",
        prompt:
          "Convierte la lista en un bloque ```mermaid flowchart TD```. Usa rombos para decisiones, subgrafos por responsable y textos cortos sin caracteres especiales. Devuelve solo el bloque.",
        output: "Código mermaid (pegar en Mermaid Live)",
      },
      {
        title: "3 · Diagrama de secuencia",
        goal: "Quién habla con quién.",
        tier: "rapido",
        prompt:
          "Genera también un ```mermaid sequenceDiagram``` con los actores del proceso y los mensajes entre ellos.",
        output: "Secuencia mermaid",
      },
      {
        title: "4 · Gráfico de proporciones",
        goal: "Pie chart cuando corresponde.",
        tier: "rapido",
        prompt:
          "Si hay proporciones (por ejemplo, % de reclamos por tipo), genera un ```mermaid pie``` con título. Si no hay datos reales, deja valores de ejemplo marcados como EJEMPLO.",
        output: "Pie chart mermaid",
      },
    ],
    sources: [SOURCES.mermaid, SOURCES.course],
  },
  {
    id: "documento-largo",
    category: "documentos",
    title: "Leer un documento largo: categorizar y resumir",
    summary:
      "Para PDFs de cientos de páginas: índice, categorías, resumen por parte y preguntas. Funciona con NotebookLM, Claude, Gemini o Copilot en Word.",
    level: "intermedio",
    variables: [
      {
        key: "documento",
        label: "Documento",
        example: "reglamento interno de 180 páginas",
      },
      {
        key: "objetivo",
        label: "Para qué lo lees",
        example: "saber qué obligaciones tengo como jefe de área",
      },
    ],
    steps: [
      {
        title: "1 · Mapa del documento",
        goal: "Ver la estructura antes del detalle.",
        tier: "contexto",
        prompt:
          "Adjunto {{documento}}. Devuelve su índice real (capítulos y páginas) y, en una línea por capítulo, de qué trata. No resumas todavía.",
        output: "Índice comentado",
      },
      {
        title: "2 · Categorización",
        goal: "Agrupar por temas útiles.",
        tier: "contexto",
        prompt:
          "Clasifica el contenido en 5–8 categorías útiles para: {{objetivo}}. Para cada categoría lista las secciones y páginas donde aparece.",
        output: "Tabla categoría → páginas",
      },
      {
        title: "3 · Resumen por categoría",
        goal: "Lo esencial, con cita.",
        tier: "razonador",
        prompt:
          "Resume cada categoría en máximo 6 viñetas. Cada viñeta termina con (pág. N). Si algo es ambiguo en el texto, márcalo como [AMBIGUO].",
        output: "Resúmenes citados",
      },
      {
        title: "4 · Preguntas y acciones",
        goal: "Pasar de leer a actuar.",
        tier: "rapido",
        prompt:
          "Con base en {{objetivo}}, lista: obligaciones, plazos, riesgos y 5 preguntas que debería hacer a quien corresponda. Todo con número de página.",
        output: "Lista de acciones",
      },
    ],
    sources: [SOURCES.course, SOURCES.geminiCookbook],
  },
  {
    id: "ingenieria-de-contexto",
    category: "tendencias",
    title: "Ingeniería de contexto (más allá del prompt)",
    summary:
      "La tendencia actual: en vez de un prompt perfecto, preparar el contexto (reglas, ejemplos, archivos y herramientas MCP) para que un agente trabaje solo y bien.",
    level: "avanzado",
    variables: [
      {
        key: "tarea",
        label: "Tarea recurrente",
        example: "preparar el reporte semanal de ventas",
      },
    ],
    steps: [
      {
        title: "1 · Archivo de reglas",
        goal: "Lo que el agente debe saber siempre.",
        tier: "razonador",
        prompt:
          "Redacta un archivo de instrucciones permanentes (tipo CLAUDE.md o AGENTS.md) para la tarea «{{tarea}}»: objetivo, público, formato de salida, fuentes permitidas, lo que nunca debe hacer y cómo verificar el resultado.",
        output: "Archivo de reglas",
      },
      {
        title: "2 · Ejemplos de oro",
        goal: "Mostrar, no solo decir.",
        tier: "rapido",
        prompt:
          "Crea 2 ejemplos completos de entrada → salida ideal para «{{tarea}}» y 1 ejemplo de salida incorrecta explicando por qué está mal.",
        output: "Ejemplos few-shot",
      },
      {
        title: "3 · Herramientas (MCP)",
        goal: "Dar acceso a datos, no pegarlos.",
        tier: "razonador",
        prompt:
          "Lista qué herramientas o conectores MCP necesita el agente para «{{tarea}}» (hoja de cálculo, correo, base de datos, búsqueda), qué permisos mínimos requiere cada uno y qué acciones deben pedir confirmación humana.",
        output: "Mapa de herramientas y permisos",
      },
      {
        title: "4 · Habilidad reutilizable",
        goal: "Empaquetar para repetir.",
        tier: "codigo",
        prompt:
          "Empaqueta reglas, ejemplos y pasos como una «skill» reutilizable: nombre, cuándo activarse, pasos y criterio de terminado. Formato Markdown con encabezado YAML.",
        output: "Skill en Markdown",
      },
      {
        title: "5 · Evaluación",
        goal: "Medir antes de confiar.",
        tier: "rapido",
        prompt:
          "Diseña 5 casos de prueba con resultado esperado para comprobar que el agente hace bien «{{tarea}}» y una rúbrica de 1 a 5.",
        output: "Casos de prueba + rúbrica",
      },
    ],
    sources: [SOURCES.claudeSkills, SOURCES.superpowers, SOURCES.dspy],
  },
];

/** Techniques summarised from the course (Unidad 2 y 3) and the Prompt Engineering Guide. */
export const TECHNIQUES: ReadonlyArray<{
  id: string;
  name: string;
  what: string;
  when: string;
  template: string;
}> = [
  {
    id: "zero-shot",
    name: "Zero-shot",
    what: "Instrucción directa, sin ejemplos. Rápida pero menos precisa.",
    when: "Tareas comunes y bien definidas.",
    template:
      "Clasifica el siguiente texto como positivo, neutro o negativo: «…»",
  },
  {
    id: "few-shot",
    name: "Few-shot",
    what: "Das 2–5 ejemplos de entrada y salida para que imite el patrón.",
    when: "Formatos propios o criterios difíciles de explicar.",
    template: "Ejemplo 1: … → …\nEjemplo 2: … → …\nAhora: … →",
  },
  {
    id: "cot",
    name: "Cadena de pensamiento (CoT)",
    what: "Pide pasos intermedios de razonamiento antes de la respuesta.",
    when: "Lógica, matemática, planificación.",
    template:
      "Resuelve paso a paso y, al final, escribe «Respuesta:» con el resultado.",
  },
  {
    id: "rol",
    name: "Role prompting",
    what: "«Actúa como…» fija vocabulario, criterio y tono.",
    when: "Cuando importa la perspectiva experta.",
    template:
      "Actúa como auditor de seguridad con 10 años de experiencia. Revisa…",
  },
  {
    id: "conocimiento-generado",
    name: "Conocimiento generado",
    what: "Primero genera hechos sobre el tema; luego responde usándolos.",
    when: "Preguntas que requieren contexto previo.",
    template:
      "Paso 1: enumera 5 hechos sobre X.\nPaso 2: con esos hechos, responde: …",
  },
  {
    id: "autoconsistencia",
    name: "Autoconsistencia",
    what: "Varias rutas de razonamiento y se elige la respuesta más repetida.",
    when: "Respuestas críticas donde un error cuesta.",
    template:
      "Resuelve como 3 expertos distintos y quédate con la conclusión mayoritaria.",
  },
  {
    id: "self-refine",
    name: "Autorrefinamiento",
    what: "El modelo critica su propia salida y la mejora.",
    when: "Textos, ideas y código de calidad.",
    template:
      "Después de crear la idea, critícala. Luego usa las críticas para perfeccionarla.",
  },
  {
    id: "tot",
    name: "Árbol de pensamientos (ToT)",
    what: "Explora ramas en paralelo, evalúa y retrocede si hace falta.",
    when: "Problemas abiertos con varias soluciones.",
    template:
      "Propón 3 caminos, evalúa cada uno del 1 al 10 y desarrolla solo los mejores.",
  },
  {
    id: "estructura",
    name: "Salida estructurada",
    what: "Defines el formato exacto (JSON, tabla, plantilla).",
    when: "Cuando otro sistema leerá la respuesta.",
    template: "Devuelve ÚNICAMENTE JSON válido con este esquema: {…}",
  },
  {
    id: "restricciones",
    name: "Basado en restricciones",
    what: "Límites claros de contenido, estilo, extensión o fuentes.",
    when: "Control de tono, longitud y riesgos.",
    template:
      "Máximo 150 palabras, sin jerga, solo con datos del texto proporcionado.",
  },
];

export const AGENT_PATTERNS: ReadonlyArray<{
  id: string;
  name: string;
  idea: string;
  use: string;
}> = [
  {
    id: "chaining",
    name: "Encadenamiento de prompts",
    idea: "Cada paso recibe la salida del anterior y hay controles entre pasos.",
    use: "Informes, guiones, traducciones con revisión.",
  },
  {
    id: "routing",
    name: "Enrutamiento",
    idea: "Un clasificador envía cada pedido al prompt o modelo adecuado.",
    use: "Soporte: preguntas fáciles a modelo barato, difíciles a razonador.",
  },
  {
    id: "parallel",
    name: "Paralelización",
    idea: "Varias llamadas a la vez (secciones o votos) y luego se unen.",
    use: "Revisar un contrato por cláusulas; autoconsistencia.",
  },
  {
    id: "orchestrator",
    name: "Orquestador–trabajadores",
    idea: "Un modelo planifica y reparte subtareas a otros, luego integra.",
    use: "Investigación profunda, cambios en varios archivos de código.",
  },
  {
    id: "evaluator",
    name: "Evaluador–optimizador",
    idea: "Uno genera, otro califica con una rúbrica y se repite hasta aprobar.",
    use: "Copys, prompts de imagen, traducciones finas.",
  },
  {
    id: "react",
    name: "ReAct (razonar + actuar)",
    idea: "Bucle Pensamiento → Acción (herramienta) → Observación hasta terminar.",
    use: "Agentes con herramientas: búsqueda, APIs, base de datos.",
  },
  {
    id: "rag",
    name: "RAG",
    idea: "Antes de responder, recupera fragmentos de tus documentos y responde solo con ellos.",
    use: "Asistentes sobre reglamentos, sílabos, manuales.",
  },
  {
    id: "multiagent",
    name: "Multiagente con supervisor",
    idea: "Agentes con roles (investigador, redactor, revisor) coordinados por un supervisor.",
    use: "Producción de contenido y equipos de desarrollo.",
  },
];

export type AgentPhase = {
  name: string;
  tier: ModelTier;
  instructions: string;
  tools: string;
  exit: string;
};

export type AgentBlueprint = {
  id: string;
  product: string;
  summary: string;
  pattern: string;
  phases: ReadonlyArray<AgentPhase>;
  guardrails: ReadonlyArray<string>;
  stack: ReadonlyArray<Source>;
};

export const AGENT_BLUEPRINTS: ReadonlyArray<AgentBlueprint> = [
  {
    id: "investigacion-profunda",
    product: "Agente de investigación profunda",
    summary:
      "Planifica búsquedas, lee en paralelo, contrasta y redacta con citas.",
    pattern: "Orquestador–trabajadores + evaluador",
    phases: [
      {
        name: "Planificador",
        tier: "razonador",
        instructions:
          "Eres el planificador. Convierte la pregunta en 4–8 subpreguntas verificables. Para cada una define consultas de búsqueda, tipo de fuente preferida y criterio de suficiencia. Devuelve JSON. No respondas la pregunta.",
        tools: "Ninguna (solo razona)",
        exit: "JSON de subpreguntas aprobado por el supervisor",
      },
      {
        name: "Investigadores (en paralelo)",
        tier: "rapido",
        instructions:
          "Eres un investigador asignado a UNA subpregunta. Busca, lee y extrae hechos con cita exacta y URL. Si una fuente contradice a otra, repórtalo. Prohibido completar con conocimiento propio.",
        tools: "Búsqueda web, lector de PDF, APIs académicas",
        exit: "≥3 fuentes por subpregunta o declaración de «insuficiente»",
      },
      {
        name: "Analista",
        tier: "contexto",
        instructions:
          "Integra los hallazgos: agrupa, resuelve contradicciones por calidad de fuente y marca el nivel de confianza de cada conclusión.",
        tools: "Ninguna",
        exit: "Matriz de hallazgos con confianza",
      },
      {
        name: "Redactor",
        tier: "razonador",
        instructions:
          "Redacta el informe con resumen ejecutivo, secciones por subpregunta y citas [n]. Cada afirmación factual debe tener cita.",
        tools: "Ninguna",
        exit: "Borrador completo",
      },
      {
        name: "Verificador",
        tier: "rapido",
        instructions:
          "Comprueba que cada cita exista y respalde la frase. Devuelve la lista de frases a corregir. Si hay más de 2 fallos, devuelve el informe al redactor.",
        tools: "Lector de URL",
        exit: "0 citas sin respaldo",
      },
    ],
    guardrails: [
      "Presupuesto máximo de búsquedas y de tokens por ejecución",
      "Registrar cada consulta y fuente (auditoría)",
      "Nunca inventar referencias: «sin fuente» es una respuesta válida",
    ],
    stack: [SOURCES.langgraph, SOURCES.openaiAgents, SOURCES.nirAgents],
  },
  {
    id: "fabrica-video",
    product: "Fábrica de video corto",
    summary:
      "De una idea a planos generados, locución y montaje con control de continuidad.",
    pattern: "Encadenamiento + evaluador por plano",
    phases: [
      {
        name: "Guionista",
        tier: "razonador",
        instructions:
          "Genera concepto, guion por escenas (≤8 s cada una) y biblia de consistencia. Usa la cadena «Video corto en 9 capas».",
        tools: "Ninguna",
        exit: "Guion y biblia aprobados",
      },
      {
        name: "Director de fotografía",
        tier: "rapido",
        instructions:
          "Convierte cada escena en ficha de 9 capas y prompt final en inglés; devuelve JSON por plano.",
        tools: "Ninguna",
        exit: "JSON válido por plano",
      },
      {
        name: "Generador",
        tier: "video",
        instructions:
          "Envía cada plano al modelo de video con la misma semilla y referencias de personaje.",
        tools: "API de video (Veo, Sora, Kling)",
        exit: "Clip por plano",
      },
      {
        name: "Supervisor de continuidad",
        tier: "razonador",
        instructions:
          "Revisa fotogramas clave contra la biblia. Rechaza y regenera planos con saltos de personaje, luz o eje.",
        tools: "Visión (comprensión de imagen)",
        exit: "Todos los planos aprobados",
      },
      {
        name: "Voz y montaje",
        tier: "voz",
        instructions:
          "Genera la locución con pausas, música según tempo y entrega una lista de edición (EDL) con tiempos.",
        tools: "TTS, editor (CapCut/FFmpeg)",
        exit: "Video final exportado",
      },
    ],
    guardrails: [
      "Derechos de imagen y voz: no clonar personas reales sin permiso",
      "Límite de regeneraciones por plano para controlar costo",
    ],
    stack: [SOURCES.crewai, SOURCES.imageVideo, SOURCES.shortFilm],
  },
  {
    id: "soporte-rag",
    product: "Asistente con tus documentos (RAG)",
    summary:
      "Responde sobre reglamentos, sílabos o manuales citando el fragmento exacto.",
    pattern: "Enrutamiento + RAG + ReAct",
    phases: [
      {
        name: "Ingesta",
        tier: "local",
        instructions:
          "Divide documentos en fragmentos de 500–800 tokens con 10% de solapamiento, guarda título, página y fecha; crea embeddings.",
        tools: "Base vectorial (Vectorize, pgvector, Qdrant)",
        exit: "Índice con metadatos",
      },
      {
        name: "Enrutador",
        tier: "rapido",
        instructions:
          "Clasifica la consulta: saludo, pregunta documental, acción (crear ticket) o fuera de alcance. Responde solo con la etiqueta.",
        tools: "Ninguna",
        exit: "Etiqueta válida",
      },
      {
        name: "Respondedor",
        tier: "rapido",
        instructions:
          "Responde SOLO con los fragmentos recuperados. Si no están, di «No encuentro esa información en los documentos». Cita documento y página.",
        tools: "Búsqueda vectorial",
        exit: "Respuesta con cita",
      },
      {
        name: "Agente de acciones",
        tier: "razonador",
        instructions:
          "Si la consulta requiere una acción, sigue ReAct: Pensamiento → Acción → Observación. Confirma con la persona antes de ejecutar algo irreversible.",
        tools: "Webhooks, CRM, correo (n8n / Dify)",
        exit: "Acción confirmada y registrada",
      },
    ],
    guardrails: [
      "Protección contra prompt injection en documentos",
      "Memoria por usuario sin datos sensibles innecesarios (Ley 29733)",
      "Respuesta de respaldo (fallback) si el modelo falla",
    ],
    stack: [SOURCES.dify, SOURCES.n8n, SOURCES.agentsBeginners],
  },
  {
    id: "equipo-desarrollo",
    product: "Equipo de desarrollo agéntico",
    summary:
      "Especificar, planificar, implementar y revisar con agentes distintos y pruebas como juez.",
    pattern: "Orquestador–trabajadores + evaluador–optimizador",
    phases: [
      {
        name: "Analista de producto",
        tier: "razonador",
        instructions:
          "Escribe spec.md con historias y criterios de aceptación. Lista preguntas abiertas y no avances sin respuesta.",
        tools: "Ninguna",
        exit: "Especificación sin preguntas abiertas",
      },
      {
        name: "Arquitecto",
        tier: "codigo",
        instructions:
          "Escribe plan.md y tasks.md. Cada tarea con archivos, prueba y criterio de terminado.",
        tools: "Lectura del repositorio",
        exit: "Plan revisado",
      },
      {
        name: "Implementador",
        tier: "codigo",
        instructions:
          "Toma una tarea, escribe la prueba primero, implementa lo mínimo, ejecuta pruebas y linters. Nunca subas secretos al repositorio.",
        tools: "Terminal, editor, pruebas",
        exit: "Pruebas en verde",
      },
      {
        name: "Revisor",
        tier: "razonador",
        instructions:
          "Revisa el diff por correctitud, seguridad y simplicidad. Devuelve hallazgos con severidad; el implementador corrige hasta 0 críticos.",
        tools: "Diff, análisis estático",
        exit: "0 hallazgos críticos",
      },
    ],
    guardrails: [
      "Rama aparte y PR; nada directo a producción",
      "Secretos solo en variables de entorno",
      "Límite de iteraciones por tarea",
    ],
    stack: [
      SOURCES.specKit,
      SOURCES.superpowers,
      SOURCES.autogen,
      SOURCES.claudeSkills,
    ],
  },
];

export const FRAMEWORKS: ReadonlyArray<Source & { note: string }> = [
  {
    ...SOURCES.langgraph,
    note: "Grafos con estado; control fino de bucles y memoria.",
  },
  {
    ...SOURCES.crewai,
    note: "Equipos de agentes por roles; rápido de prototipar.",
  },
  {
    ...SOURCES.autogen,
    note: "Conversaciones multiagente; investigación de Microsoft.",
  },
  { ...SOURCES.openaiAgents, note: "Agentes, handoffs y guardrails ligeros." },
  { ...SOURCES.adk, note: "Kit de Google para construir y evaluar agentes." },
  {
    ...SOURCES.dspy,
    note: "Programar en vez de escribir prompts; optimiza cadenas.",
  },
  {
    ...SOURCES.dify,
    note: "Visual: flujos agénticos y RAG sin mucho código (curso).",
  },
  {
    ...SOURCES.n8n,
    note: "Automatización con nodos de IA y webhooks (curso).",
  },
];

export function fillTemplate(text: string, values: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = values[key]?.trim();
    return value ? value : match;
  });
}

export function chainToMarkdown(
  chain: PromptChain,
  values: Record<string, string>,
) {
  const lines = [
    `# ${chain.title}`,
    "",
    chain.summary,
    "",
    ...chain.variables.map(
      (variable) =>
        `- **${variable.label}:** ${values[variable.key]?.trim() || variable.example}`,
    ),
    "",
  ];
  for (const step of chain.steps) {
    lines.push(
      `## ${step.title}`,
      "",
      `*Objetivo:* ${step.goal}  `,
      `*Modelo sugerido:* ${MODEL_TIERS[step.tier].label} (${MODEL_TIERS[step.tier].examples})  `,
      `*Salida:* ${step.output}`,
      "",
      "```text",
      fillTemplate(step.prompt, values),
      "```",
      "",
    );
  }
  lines.push(
    "## Fuentes",
    "",
    ...chain.sources.map((source) =>
      source.url.startsWith("http")
        ? `- [${source.label}](${source.url})`
        : `- ${source.label}`,
    ),
    "",
    "_Generado por AMARU · Prompts y agentes (plantilla determinista, sin IA)._",
  );
  return lines.join("\n");
}

export function blueprintToMarkdown(blueprint: AgentBlueprint) {
  const lines = [
    `# ${blueprint.product}`,
    "",
    blueprint.summary,
    "",
    `**Patrón:** ${blueprint.pattern}`,
    "",
  ];
  blueprint.phases.forEach((phase, index) => {
    lines.push(
      `## Fase ${index + 1} · ${phase.name}`,
      "",
      `- **Modelo:** ${MODEL_TIERS[phase.tier].label} (${MODEL_TIERS[phase.tier].examples})`,
      `- **Herramientas:** ${phase.tools}`,
      `- **Termina cuando:** ${phase.exit}`,
      "",
      "```text",
      phase.instructions,
      "```",
      "",
    );
  });
  lines.push(
    "## Barandas",
    "",
    ...blueprint.guardrails.map((item) => `- ${item}`),
    "",
    "## Frameworks sugeridos",
    "",
    ...blueprint.stack.map((source) => `- [${source.label}](${source.url})`),
  );
  return lines.join("\n");
}
