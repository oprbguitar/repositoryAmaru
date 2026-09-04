/**
 * Catálogo curado de plataformas de API de IA y de proyectos que se pueden
 * construir sobre ellas. Los precios son de lista pública (USD) y se usan para
 * estimar consumo y margen; la fecha de verificación queda en `PRICING_ASOF`.
 */

export const PRICING_ASOF = "2026-09";

export type PlatformId =
  | "azure-openai"
  | "aws-bedrock"
  | "google-vertex"
  | "anthropic"
  | "openai"
  | "groq"
  | "deepgram"
  | "elevenlabs"
  | "openrouter"
  | "together";

export type Modality = "texto" | "voz" | "vision" | "embeddings";

export type Category = "hyperscaler" | "directo" | "especialista" | "agregador";

export type Platform = {
  id: PlatformId;
  name: string;
  vendor: string;
  category: Category;
  /** Modalidades cubiertas por la plataforma. */
  modalities: Modality[];
  summary: string;
  /** Por qué elegirla frente al resto. */
  strengths: string[];
  /** Lo que hay que asumir si se elige. */
  tradeoffs: string[];
  region: string;
  /** Cómo se factura realmente el servicio. */
  billing: string;
  docsUrl: string;
  pricingUrl: string;
  /** Precios de referencia para calcular consumo. */
  rates: Rate[];
};

export type Rate = {
  model: string;
  modality: Modality;
  /** USD por millón de tokens de entrada; null si no aplica. */
  inputPerMTok: number | null;
  /** USD por millón de tokens de salida; null si no aplica. */
  outputPerMTok: number | null;
  /** USD por minuto de audio; null si no aplica. */
  perAudioMinute: number | null;
  note: string;
};

export const PLATFORMS: Platform[] = [
  {
    id: "azure-openai",
    name: "Azure OpenAI Service",
    vendor: "Microsoft",
    category: "hyperscaler",
    modalities: ["texto", "voz", "vision", "embeddings"],
    summary:
      "Los modelos de OpenAI servidos dentro de Azure, con la facturación, el aislamiento de red y los acuerdos de datos de la nube corporativa.",
    strengths: [
      "Residencia de datos por región y compromiso de no entrenar con tus prompts",
      "Se factura dentro del Enterprise Agreement que la empresa ya tiene",
      "Private Link, VNet y control de identidad con Entra ID",
      "Azure AI Speech cubre voz a texto y texto a voz en el mismo contrato",
    ],
    tradeoffs: [
      "Los modelos nuevos llegan semanas después que en la API directa",
      "Requiere solicitar cuota por región y por modelo",
      "La consola es notablemente más pesada que la de un proveedor directo",
    ],
    region: "Global · 30+ regiones Azure",
    billing: "Pago por token, o capacidad reservada (PTU) por hora",
    docsUrl: "https://learn.microsoft.com/azure/ai-services/openai/",
    pricingUrl:
      "https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/",
    rates: [
      {
        model: "GPT-4o",
        modality: "texto",
        inputPerMTok: 2.5,
        outputPerMTok: 10,
        perAudioMinute: null,
        note: "Caballo de batalla para chat y extracción",
      },
      {
        model: "GPT-4o mini",
        modality: "texto",
        inputPerMTok: 0.15,
        outputPerMTok: 0.6,
        perAudioMinute: null,
        note: "El más barato para clasificar y filtrar en volumen",
      },
      {
        model: "Azure AI Speech (STT)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0167,
        note: "≈ USD 1 por hora de audio transcrita",
      },
      {
        model: "text-embedding-3-small",
        modality: "embeddings",
        inputPerMTok: 0.02,
        outputPerMTok: null,
        perAudioMinute: null,
        note: "Indexado de documentos para búsqueda semántica",
      },
    ],
  },
  {
    id: "aws-bedrock",
    name: "Amazon Bedrock",
    vendor: "AWS",
    category: "hyperscaler",
    modalities: ["texto", "vision", "embeddings"],
    summary:
      "Una sola API sobre modelos de Anthropic, Meta, Mistral, Cohere y Amazon Nova, con IAM y VPC de AWS de por medio.",
    strengths: [
      "Cambiar de modelo es cambiar un identificador, no reescribir el cliente",
      "Se integra con la cuenta AWS existente: IAM, CloudWatch, PrivateLink",
      "Guardrails y evaluación de modelos vienen incluidos en la plataforma",
      "Knowledge Bases resuelve el RAG sin montar tu propia base vectorial",
    ],
    tradeoffs: [
      "La disponibilidad de modelos varía mucho por región",
      "Hay que pedir acceso modelo por modelo antes de invocar",
      "El rendimiento aprovisionado exige compromiso mensual",
    ],
    region: "Global · disponibilidad desigual por región",
    billing: "Pago por token, lotes con descuento, o throughput aprovisionado",
    docsUrl: "https://docs.aws.amazon.com/bedrock/",
    pricingUrl: "https://aws.amazon.com/bedrock/pricing/",
    rates: [
      {
        model: "Claude Sonnet (vía Bedrock)",
        modality: "texto",
        inputPerMTok: 3,
        outputPerMTok: 15,
        perAudioMinute: null,
        note: "Razonamiento largo y análisis de documentos",
      },
      {
        model: "Claude Haiku (vía Bedrock)",
        modality: "texto",
        inputPerMTok: 0.8,
        outputPerMTok: 4,
        perAudioMinute: null,
        note: "Filtrado y enrutamiento de alto volumen",
      },
      {
        model: "Amazon Nova Lite",
        modality: "texto",
        inputPerMTok: 0.06,
        outputPerMTok: 0.24,
        perAudioMinute: null,
        note: "La opción más barata del catálogo Bedrock",
      },
      {
        model: "Titan Text Embeddings V2",
        modality: "embeddings",
        inputPerMTok: 0.02,
        outputPerMTok: null,
        perAudioMinute: null,
        note: "Vectorización dentro de la misma VPC",
      },
    ],
  },
  {
    id: "google-vertex",
    name: "Google Vertex AI",
    vendor: "Google Cloud",
    category: "hyperscaler",
    modalities: ["texto", "voz", "vision", "embeddings"],
    summary:
      "Los modelos Gemini con ventana de contexto muy larga, más el stack de datos de Google Cloud pegado al lado.",
    strengths: [
      "Ventanas de contexto de hasta un millón de tokens sin trucos",
      "Multimodal real: video y audio entran como entrada nativa",
      "Se conecta directo a BigQuery para analítica sobre los resultados",
      "Speech-to-Text de Google cubre español latino con buena calidad",
    ],
    tradeoffs: [
      "El versionado de los modelos cambia con frecuencia",
      "La cuota inicial por proyecto es baja y hay que escalarla a mano",
      "Menos ejemplos de comunidad que en el ecosistema OpenAI",
    ],
    region: "Global · fuerte presencia en us-central1 y europe-west",
    billing: "Pago por token; el audio y el video se cobran por segundo",
    docsUrl: "https://cloud.google.com/vertex-ai/docs",
    pricingUrl: "https://cloud.google.com/vertex-ai/generative-ai/pricing",
    rates: [
      {
        model: "Gemini Flash",
        modality: "texto",
        inputPerMTok: 0.3,
        outputPerMTok: 2.5,
        perAudioMinute: null,
        note: "Contexto largo a precio bajo",
      },
      {
        model: "Gemini Pro",
        modality: "texto",
        inputPerMTok: 1.25,
        outputPerMTok: 10,
        perAudioMinute: null,
        note: "Razonamiento sobre corpus grandes",
      },
      {
        model: "Google Speech-to-Text",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.016,
        note: "Transcripción con diarización de hablantes",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Claude API",
    vendor: "Anthropic",
    category: "directo",
    modalities: ["texto", "vision"],
    summary:
      "Acceso directo a los modelos Claude, con caché de prompts y procesamiento por lotes como palancas principales de costo.",
    strengths: [
      "La caché de prompts recorta hasta 90% del costo de entrada repetida",
      "El modo lote reduce a la mitad el precio de trabajos no urgentes",
      "Muy sólido en documentos largos y en seguir formatos de salida",
      "Los modelos nuevos salen aquí primero",
    ],
    tradeoffs: [
      "Sin residencia de datos por región configurable como en un hyperscaler",
      "No cubre voz: hay que combinarlo con un especialista de audio",
    ],
    region: "Global · API pública",
    billing: "Pago por token, con caché y lotes como descuentos",
    docsUrl: "https://docs.claude.com/",
    pricingUrl: "https://claude.com/pricing",
    rates: [
      {
        model: "Claude Sonnet",
        modality: "texto",
        inputPerMTok: 3,
        outputPerMTok: 15,
        perAudioMinute: null,
        note: "Equilibrio entre calidad y costo",
      },
      {
        model: "Claude Haiku",
        modality: "texto",
        inputPerMTok: 0.8,
        outputPerMTok: 4,
        perAudioMinute: null,
        note: "Clasificación masiva y primer filtro",
      },
      {
        model: "Claude Sonnet (entrada cacheada)",
        modality: "texto",
        inputPerMTok: 0.3,
        outputPerMTok: 15,
        perAudioMinute: null,
        note: "Lectura de caché: 10% del precio de entrada",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI Platform",
    vendor: "OpenAI",
    category: "directo",
    modalities: ["texto", "voz", "vision", "embeddings"],
    summary:
      "La API directa: la ruta más corta a modelos de texto, voz en tiempo real y embeddings desde un solo proveedor.",
    strengths: [
      "La Realtime API permite voz conversacional con latencia baja",
      "Whisper resuelve transcripción barata sin infraestructura propia",
      "El ecosistema de librerías y ejemplos es el más grande",
    ],
    tradeoffs: [
      "Los controles de cumplimiento son más débiles que vía Azure",
      "Los límites de tasa por cuenta pueden frenar un lanzamiento",
    ],
    region: "Global · API pública",
    billing: "Pago por token; audio por minuto; lotes con 50% de descuento",
    docsUrl: "https://platform.openai.com/docs",
    pricingUrl: "https://openai.com/api/pricing/",
    rates: [
      {
        model: "GPT-4o mini",
        modality: "texto",
        inputPerMTok: 0.15,
        outputPerMTok: 0.6,
        perAudioMinute: null,
        note: "El filtro barato por defecto",
      },
      {
        model: "Whisper",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.006,
        note: "≈ USD 0.36 por hora transcrita",
      },
      {
        model: "text-embedding-3-small",
        modality: "embeddings",
        inputPerMTok: 0.02,
        outputPerMTok: null,
        perAudioMinute: null,
        note: "Indexado semántico económico",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq Cloud",
    vendor: "Groq",
    category: "especialista",
    modalities: ["texto", "voz"],
    summary:
      "Inferencia sobre hardware propio (LPU) con latencia muy baja para modelos abiertos como Llama y Mixtral.",
    strengths: [
      "Cientos de tokens por segundo: cambia lo que se siente en tiempo real",
      "Precios por token muy por debajo de los modelos propietarios",
      "Whisper acelerado para transcripción casi instantánea",
    ],
    tradeoffs: [
      "Solo modelos abiertos: no hay GPT ni Claude",
      "Menos garantías contractuales para cargas críticas",
    ],
    region: "Global · API pública",
    billing: "Pago por token; audio por hora de audio",
    docsUrl: "https://console.groq.com/docs",
    pricingUrl: "https://groq.com/pricing/",
    rates: [
      {
        model: "Llama 3.3 70B",
        modality: "texto",
        inputPerMTok: 0.59,
        outputPerMTok: 0.79,
        perAudioMinute: null,
        note: "Calidad media a precio de modelo abierto",
      },
      {
        model: "Llama 3.1 8B",
        modality: "texto",
        inputPerMTok: 0.05,
        outputPerMTok: 0.08,
        perAudioMinute: null,
        note: "Filtrado en volumen a costo casi nulo",
      },
      {
        model: "Whisper Large v3 Turbo",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.00067,
        note: "≈ USD 0.04 por hora de audio",
      },
    ],
  },
  {
    id: "deepgram",
    name: "Deepgram",
    vendor: "Deepgram",
    category: "especialista",
    modalities: ["voz"],
    summary:
      "Transcripción y voz sintética orientadas a producción, con streaming en vivo y diarización de hablantes.",
    strengths: [
      "Streaming en tiempo real estable para call centers",
      "Diarización y detección de idioma listas de fábrica",
      "Buen desempeño en español latinoamericano",
    ],
    tradeoffs: [
      "Solo cubre audio: el razonamiento va en otro proveedor",
      "El modelo más preciso cuesta bastante más que el estándar",
    ],
    region: "Global · API pública",
    billing: "Por minuto de audio procesado",
    docsUrl: "https://developers.deepgram.com/",
    pricingUrl: "https://deepgram.com/pricing",
    rates: [
      {
        model: "Nova (STT, pregrabado)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0043,
        note: "≈ USD 0.26 por hora transcrita",
      },
      {
        model: "Nova (STT, streaming)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0059,
        note: "Transcripción en vivo",
      },
      {
        model: "Aura (TTS)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.015,
        note: "Voz sintética conversacional",
      },
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    vendor: "ElevenLabs",
    category: "especialista",
    modalities: ["voz"],
    summary:
      "Síntesis de voz de calidad de estudio, con clonación y control expresivo en español.",
    strengths: [
      "La voz sintética más natural del mercado en español",
      "Clonación de voz a partir de muestras cortas",
      "Streaming de baja latencia para agentes conversacionales",
    ],
    tradeoffs: [
      "Muy caro por minuto frente a un TTS genérico",
      "La clonación exige consentimiento explícito y trae carga legal",
    ],
    region: "Global · API pública",
    billing: "Por caracteres sintetizados, en planes con cuota mensual",
    docsUrl: "https://elevenlabs.io/docs",
    pricingUrl: "https://elevenlabs.io/pricing",
    rates: [
      {
        model: "Multilingual v2 (TTS)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.18,
        note: "Calidad narración; ≈ USD 11 por hora generada",
      },
      {
        model: "Flash v2.5 (TTS)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.09,
        note: "Mitad de precio, latencia menor",
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    vendor: "OpenRouter",
    category: "agregador",
    modalities: ["texto", "vision"],
    summary:
      "Un endpoint único hacia cientos de modelos de todos los proveedores, con failover automático entre ellos.",
    strengths: [
      "Probar y comparar modelos sin abrir una cuenta por proveedor",
      "Failover automático cuando un proveedor se cae",
      "Una sola factura para todo el portafolio de modelos",
    ],
    tradeoffs: [
      "Un margen sobre el precio de lista del proveedor original",
      "Un salto de red extra que suma latencia",
      "Los datos pasan por un tercero más",
    ],
    region: "Global · API pública",
    billing: "Precio del proveedor más un margen del agregador",
    docsUrl: "https://openrouter.ai/docs",
    pricingUrl: "https://openrouter.ai/models",
    rates: [
      {
        model: "Enrutado a modelo grande",
        modality: "texto",
        inputPerMTok: 3.15,
        outputPerMTok: 15.75,
        perAudioMinute: null,
        note: "Referencia con ~5% de margen sobre lista",
      },
      {
        model: "Enrutado a modelo pequeño",
        modality: "texto",
        inputPerMTok: 0.16,
        outputPerMTok: 0.63,
        perAudioMinute: null,
        note: "Para filtrado con failover",
      },
    ],
  },
  {
    id: "together",
    name: "Together AI",
    vendor: "Together",
    category: "agregador",
    modalities: ["texto", "embeddings"],
    summary:
      "Inferencia y ajuste fino sobre modelos abiertos, con endpoints dedicados cuando el volumen lo justifica.",
    strengths: [
      "Ajuste fino de modelos abiertos sin administrar GPUs",
      "Endpoints dedicados con costo por hora predecible",
      "Catálogo amplio de modelos abiertos actualizados",
    ],
    tradeoffs: [
      "La calidad depende del modelo abierto elegido",
      "El ajuste fino exige datos limpios y evaluación propia",
    ],
    region: "Global · API pública",
    billing: "Pago por token, o GPU dedicada por hora",
    docsUrl: "https://docs.together.ai/",
    pricingUrl: "https://www.together.ai/pricing",
    rates: [
      {
        model: "Llama 3.3 70B Turbo",
        modality: "texto",
        inputPerMTok: 0.88,
        outputPerMTok: 0.88,
        perAudioMinute: null,
        note: "Precio simétrico de entrada y salida",
      },
      {
        model: "Llama 3.1 8B Turbo",
        modality: "texto",
        inputPerMTok: 0.18,
        outputPerMTok: 0.18,
        perAudioMinute: null,
        note: "Base económica para ajuste fino",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Proyectos construibles sobre el catálogo                                  */
/* -------------------------------------------------------------------------- */

export type ProjectKind = "voz" | "texto" | "mixto";
export type Effort = "días" | "semanas" | "meses";

export type Project = {
  id: string;
  title: string;
  kind: ProjectKind;
  effort: Effort;
  /** Qué problema resuelve, en una frase. */
  pitch: string;
  /** Cómo se arma, paso a paso. */
  pipeline: string[];
  /** Plataformas del catálogo que encajan, por id. */
  platforms: PlatformId[];
  /** La unidad que se factura al cliente. */
  billingUnit: string;
  /** Costo de API estimado por unidad, en USD. */
  unitCost: number;
  /** Precio de venta sugerido por unidad, en USD. */
  unitPrice: number;
  /** Lo que suele romper el margen. */
  marginRisk: string;
};

export const PROJECTS: Project[] = [
  {
    id: "auto-filtrado",
    title: "Auto-filtrado de documentos en cascada",
    kind: "texto",
    effort: "semanas",
    pitch:
      "Clasifica y descarta el 90% del corpus con un modelo barato, y reserva el modelo caro solo para lo que sobrevive al filtro.",
    pipeline: [
      "Ingesta y troceado del documento en fragmentos de 2 a 4 mil tokens",
      "Primer filtro con un modelo pequeño: relevante / descartado / dudoso",
      "Los dudosos suben a un modelo medio para desempatar",
      "Solo lo relevante llega al modelo grande para extracción estructurada",
      "Los resultados se cachean por hash para no repagar el mismo documento",
    ],
    platforms: ["groq", "anthropic", "aws-bedrock"],
    billingUnit: "1.000 documentos procesados",
    unitCost: 4.2,
    unitPrice: 25,
    marginRisk:
      "Si el primer filtro deja pasar demasiado, el costo se dispara: hay que medir la tasa de escalamiento cada semana.",
  },
  {
    id: "agente-voz",
    title: "Agente de voz para atención telefónica",
    kind: "voz",
    effort: "meses",
    pitch:
      "Contesta llamadas, entiende la intención, resuelve lo simple y transfiere lo complejo con el contexto ya escrito.",
    pipeline: [
      "Audio en vivo hacia transcripción por streaming",
      "El texto entra a un modelo con el contexto del cliente inyectado",
      "La respuesta vuelve a audio con voz sintética de baja latencia",
      "Cada turno se registra para auditoría y para medir la tasa de resolución",
    ],
    platforms: ["deepgram", "openai", "elevenlabs", "groq"],
    billingUnit: "1 hora de llamada atendida",
    unitCost: 1.85,
    unitPrice: 9,
    marginRisk:
      "El TTS de alta calidad domina el costo; bajar a una voz Flash cambia el margen más que cambiar de modelo de texto.",
  },
  {
    id: "actas-reuniones",
    title: "Actas y acuerdos a partir de reuniones grabadas",
    kind: "voz",
    effort: "semanas",
    pitch:
      "Transcribe, separa hablantes y devuelve acuerdos, responsables y fechas en una tabla lista para pegar.",
    pipeline: [
      "Transcripción pregrabada con diarización de hablantes",
      "Resumen por bloques para no pasar el audio entero al modelo",
      "Extracción estructurada de acuerdos, responsable y plazo",
      "Entrega en documento y en fila de base de datos",
    ],
    platforms: ["groq", "deepgram", "anthropic"],
    billingUnit: "1 hora de reunión",
    unitCost: 0.22,
    unitPrice: 4,
    marginRisk:
      "El margen es amplio, salvo que el cliente pida reprocesar el audio completo en cada corrección.",
  },
  {
    id: "buscador-interno",
    title: "Buscador semántico sobre el archivo interno",
    kind: "texto",
    effort: "semanas",
    pitch:
      "Pregunta en lenguaje natural sobre contratos, informes y correos, con la cita del documento de origen.",
    pipeline: [
      "Indexado único del corpus con embeddings baratos",
      "Recuperación de los fragmentos más cercanos a la pregunta",
      "Respuesta generada citando el fragmento exacto",
      "La caché de prompts sostiene el contexto fijo entre consultas",
    ],
    platforms: ["azure-openai", "aws-bedrock", "anthropic"],
    billingUnit: "1.000 consultas",
    unitCost: 6.5,
    unitPrice: 40,
    marginRisk:
      "El indexado es un costo único, pero reindexar todo por un cambio de modelo de embeddings lo vuelve recurrente.",
  },
  {
    id: "monitor-fuentes",
    title: "Monitor de fuentes con alertas por relevancia",
    kind: "texto",
    effort: "días",
    pitch:
      "Vigila fuentes públicas, descarta el ruido con un modelo barato y avisa solo cuando algo importa de verdad.",
    pipeline: [
      "Recolección programada de las fuentes ya configuradas",
      "Puntuación de relevancia con un modelo pequeño por artículo",
      "Resumen agrupado solo de lo que pasa el umbral",
      "Entrega por correo o panel, una vez al día",
    ],
    platforms: ["groq", "openai", "google-vertex"],
    billingUnit: "1.000 artículos evaluados",
    unitCost: 0.35,
    unitPrice: 6,
    marginRisk:
      "Barato mientras el resumen se agrupe; resumir artículo por artículo multiplica el costo por diez.",
  },
  {
    id: "traductor-multimodal",
    title: "Doblaje y subtitulado de video en español",
    kind: "mixto",
    effort: "meses",
    pitch:
      "Toma un video en otro idioma y devuelve subtítulos y pista de audio doblada con voz consistente.",
    pipeline: [
      "Transcripción del audio original con marcas de tiempo",
      "Traducción y ajuste de longitud para que calce con la imagen",
      "Síntesis de la pista doblada con la misma voz en cada escena",
      "Mezcla y exportación de subtítulos junto al audio",
    ],
    platforms: ["deepgram", "google-vertex", "elevenlabs"],
    billingUnit: "1 hora de video",
    unitCost: 12.4,
    unitPrice: 45,
    marginRisk:
      "La síntesis de voz es casi todo el costo, y cada corrección del cliente obliga a regenerar el audio completo.",
  },
  {
    id: "comparador-modelos",
    title: "Banco de pruebas de modelos con costo real",
    kind: "texto",
    effort: "días",
    pitch:
      "Corre la misma tarea contra varios modelos y compara calidad, latencia y costo antes de comprometerse con uno.",
    pipeline: [
      "Un set de casos con la respuesta esperada de cada uno",
      "Ejecución del set contra cada modelo por un endpoint único",
      "Registro de tokens, latencia y costo por corrida",
      "Tabla comparativa de calidad contra costo por mil llamadas",
    ],
    platforms: ["openrouter", "together", "groq"],
    billingUnit: "1 evaluación completa",
    unitCost: 2.1,
    unitPrice: 15,
    marginRisk:
      "El agregador cobra su margen sobre cada corrida; conviene migrar al proveedor directo una vez elegido el modelo.",
  },
  {
    id: "asistente-interno",
    title: "Asistente interno con datos de la empresa",
    kind: "mixto",
    effort: "meses",
    pitch:
      "Un asistente que responde con las políticas y los datos de la casa, dentro de la nube que la empresa ya audita.",
    pipeline: [
      "Despliegue dentro de la nube corporativa con red privada",
      "Base de conocimiento conectada a los repositorios internos",
      "Control de acceso por identidad para que cada quien vea lo suyo",
      "Registro completo de consultas para auditoría",
    ],
    platforms: ["azure-openai", "aws-bedrock", "google-vertex"],
    billingUnit: "1 usuario activo por mes",
    unitCost: 1.6,
    unitPrice: 12,
    marginRisk:
      "El costo por usuario es estable, pero un puñado de usuarios intensivos puede consumir el margen de todo el resto.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Cálculos                                                                  */
/* -------------------------------------------------------------------------- */

export function projectMargin(project: Project) {
  const profit = project.unitPrice - project.unitCost;
  return {
    profit,
    /** Margen bruto sobre el precio de venta, en porcentaje. */
    percent: project.unitPrice > 0 ? (profit / project.unitPrice) * 100 : 0,
    /** Cuántas veces el precio cubre el costo. */
    multiple: project.unitCost > 0 ? project.unitPrice / project.unitCost : 0,
  };
}

/** Costo de una corrida de texto, en USD. */
export function textRunCost(
  rate: Rate,
  inputTokens: number,
  outputTokens: number,
): number {
  const input = ((rate.inputPerMTok ?? 0) * inputTokens) / 1_000_000;
  const output = ((rate.outputPerMTok ?? 0) * outputTokens) / 1_000_000;
  return input + output;
}

/** Todas las tarifas de texto del catálogo, ordenadas de la más barata. */
export function textRates(): Array<Rate & { platform: Platform }> {
  return PLATFORMS.flatMap((platform) =>
    platform.rates
      .filter((rate) => rate.modality === "texto")
      .map((rate) => ({ ...rate, platform })),
  ).sort((left, right) => (left.inputPerMTok ?? 0) - (right.inputPerMTok ?? 0));
}

/** Todas las tarifas de voz del catálogo, ordenadas de la más barata. */
export function voiceRates(): Array<Rate & { platform: Platform }> {
  return PLATFORMS.flatMap((platform) =>
    platform.rates
      .filter((rate) => rate.modality === "voz")
      .map((rate) => ({ ...rate, platform })),
  ).sort(
    (left, right) => (left.perAudioMinute ?? 0) - (right.perAudioMinute ?? 0),
  );
}

export function catalogStats() {
  const margins = PROJECTS.map((project) => projectMargin(project).percent);
  return {
    platforms: PLATFORMS.length,
    projects: PROJECTS.length,
    rates: PLATFORMS.reduce((total, p) => total + p.rates.length, 0),
    medianMargin: Math.round(
      [...margins].sort((a, b) => a - b)[Math.floor(margins.length / 2)] ?? 0,
    ),
  };
}
