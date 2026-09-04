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
  | "together"
  | "mistral"
  | "cohere"
  | "deepseek"
  | "xai"
  | "cloudflare-ai"
  | "assemblyai"
  | "fireworks"
  | "replicate"
  | "stability"
  | "perplexity";

export type Modality =
  | "texto"
  | "voz"
  | "vision"
  | "embeddings"
  | "imagen"
  | "video";

export type Category =
  | "hyperscaler"
  | "directo"
  | "especialista"
  | "agregador"
  | "borde";

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
  /** USD por unidad generada, para lo que no se cobra por token ni por minuto. */
  perUnit?: number;
  /** Qué es una unidad: "imagen", "segundo de video", "1.000 documentos". */
  unitLabel?: string;
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
  {
    id: "mistral",
    name: "Mistral AI",
    vendor: "Mistral",
    category: "directo",
    modalities: ["texto", "vision", "embeddings"],
    summary:
      "Modelos europeos con pesos abiertos en varias de sus versiones, y la opción de desplegarlos en tu propia infraestructura.",
    strengths: [
      "Los modelos abiertos se pueden autoalojar si el dato no puede salir",
      "Empresa europea: encaja mejor con exigencias del RGPD",
      "Muy buena relación calidad-precio en la franja media",
      "Fuerte en francés y español, no solo en inglés",
    ],
    tradeoffs: [
      "El catálogo cambia de nombres con frecuencia",
      "Ecosistema de herramientas más chico que el de OpenAI",
    ],
    region: "Europa · API pública y despliegue propio",
    billing: "Pago por token, o licencia para autoalojar",
    docsUrl: "https://docs.mistral.ai/",
    pricingUrl: "https://mistral.ai/pricing",
    rates: [
      {
        model: "Mistral Large",
        modality: "texto",
        inputPerMTok: 2,
        outputPerMTok: 6,
        perAudioMinute: null,
        note: "Salida más barata que sus competidores directos",
      },
      {
        model: "Mistral Small",
        modality: "texto",
        inputPerMTok: 0.2,
        outputPerMTok: 0.6,
        perAudioMinute: null,
        note: "Filtrado y clasificación con licencia abierta",
      },
      {
        model: "Mistral Embed",
        modality: "embeddings",
        inputPerMTok: 0.1,
        outputPerMTok: null,
        perAudioMinute: null,
        note: "Vectorización con datos alojados en Europa",
      },
    ],
  },
  {
    id: "cohere",
    name: "Cohere",
    vendor: "Cohere",
    category: "directo",
    modalities: ["texto", "embeddings"],
    summary:
      "Orientada a empresa, con el mejor reordenador de resultados del mercado y embeddings multilingües sólidos.",
    strengths: [
      "Rerank mejora la precisión de un buscador sin cambiar el modelo",
      "Embeddings multilingües entrenados para más de cien idiomas",
      "Despliegue privado dentro de la nube del cliente",
    ],
    tradeoffs: [
      "Menos competitiva en generación libre que en recuperación",
      "Rerank se cobra aparte y suele olvidarse al presupuestar",
    ],
    region: "Global · API pública y despliegue privado",
    billing: "Pago por token; Rerank por búsqueda",
    docsUrl: "https://docs.cohere.com/",
    pricingUrl: "https://cohere.com/pricing",
    rates: [
      {
        model: "Command R+",
        modality: "texto",
        inputPerMTok: 2.5,
        outputPerMTok: 10,
        perAudioMinute: null,
        note: "Generación con citas para RAG",
      },
      {
        model: "Command R",
        modality: "texto",
        inputPerMTok: 0.15,
        outputPerMTok: 0.6,
        perAudioMinute: null,
        note: "El caballo de batalla barato para RAG",
      },
      {
        model: "Embed Multilingual v3",
        modality: "embeddings",
        inputPerMTok: 0.1,
        outputPerMTok: null,
        perAudioMinute: null,
        note: "Indexado que cruza idiomas sin traducir",
      },
      {
        model: "Rerank v3",
        modality: "texto",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.002,
        unitLabel: "búsqueda",
        note: "Reordena los resultados antes de generar",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    vendor: "DeepSeek",
    category: "directo",
    modalities: ["texto"],
    summary:
      "Modelos de razonamiento a una fracción del precio del resto, con caché de contexto agresiva y descuento por horario.",
    strengths: [
      "El precio por token más bajo entre los modelos de razonamiento",
      "La caché de contexto abarata muchísimo el prompt repetido",
      "Descuento adicional en las horas de baja demanda",
    ],
    tradeoffs: [
      "Los datos se procesan en China: descarta muchos casos corporativos",
      "Latencia irregular en horas pico",
      "Menos garantías contractuales que un proveedor occidental",
    ],
    region: "China · API pública",
    billing: "Pago por token, con caché y descuento horario",
    docsUrl: "https://api-docs.deepseek.com/",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    rates: [
      {
        model: "DeepSeek Chat",
        modality: "texto",
        inputPerMTok: 0.27,
        outputPerMTok: 1.1,
        perAudioMinute: null,
        note: "Calidad alta a precio de modelo pequeño",
      },
      {
        model: "DeepSeek Chat (cacheado)",
        modality: "texto",
        inputPerMTok: 0.07,
        outputPerMTok: 1.1,
        perAudioMinute: null,
        note: "Lectura de caché a un cuarto del precio",
      },
      {
        model: "DeepSeek Reasoner",
        modality: "texto",
        inputPerMTok: 0.55,
        outputPerMTok: 2.19,
        perAudioMinute: null,
        note: "Razonamiento largo; cuidado con los tokens de pensamiento",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI Grok",
    vendor: "xAI",
    category: "directo",
    modalities: ["texto", "vision"],
    summary:
      "Modelos con acceso en vivo al flujo de X, útiles cuando lo que importa es lo que se está diciendo ahora.",
    strengths: [
      "Contexto de actualidad sin montar tu propio raspado",
      "Ventana de contexto amplia para análisis de hilos largos",
    ],
    tradeoffs: [
      "Precio de salida alto frente a la competencia",
      "El sesgo de la fuente se hereda: X no es una muestra neutral",
      "Ecosistema de integraciones todavía delgado",
    ],
    region: "Global · API pública",
    billing: "Pago por token",
    docsUrl: "https://docs.x.ai/",
    pricingUrl: "https://x.ai/api",
    rates: [
      {
        model: "Grok (estándar)",
        modality: "texto",
        inputPerMTok: 3,
        outputPerMTok: 15,
        perAudioMinute: null,
        note: "Análisis con contexto de actualidad",
      },
      {
        model: "Grok mini",
        modality: "texto",
        inputPerMTok: 0.3,
        outputPerMTok: 0.5,
        perAudioMinute: null,
        note: "Clasificación de menciones en volumen",
      },
    ],
  },
  {
    id: "cloudflare-ai",
    name: "Workers AI",
    vendor: "Cloudflare",
    category: "borde",
    modalities: ["texto", "voz", "imagen", "embeddings"],
    summary:
      "Inferencia ejecutada en el borde de la red, en la misma función que sirve tu aplicación, sin servidor que administrar.",
    strengths: [
      "Corre junto al código de la app: cero latencia de red interna",
      "Se factura por neurona, con una capa gratuita diaria real",
      "Vectorize y R2 en el mismo entorno, sin salir de la plataforma",
      "Es la nube donde ya está desplegado este observatorio",
    ],
    tradeoffs: [
      "Catálogo limitado a modelos abiertos de tamaño medio",
      "No hay modelos frontera: para eso hay que salir a otro proveedor",
      "El límite de tiempo de ejecución acota las tareas largas",
    ],
    region: "Global · 300+ ciudades en el borde",
    billing: "Por neuronas consumidas, con capa gratuita diaria",
    docsUrl: "https://developers.cloudflare.com/workers-ai/",
    pricingUrl:
      "https://developers.cloudflare.com/workers-ai/platform/pricing/",
    rates: [
      {
        model: "Llama 3.1 8B (Workers AI)",
        modality: "texto",
        inputPerMTok: 0.28,
        outputPerMTok: 0.83,
        perAudioMinute: null,
        note: "Inferencia pegada a la aplicación",
      },
      {
        model: "Whisper (Workers AI)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0005,
        note: "Transcripción en el borde, muy barata",
      },
      {
        model: "BGE base (embeddings)",
        modality: "embeddings",
        inputPerMTok: 0.02,
        outputPerMTok: null,
        perAudioMinute: null,
        note: "Vectorización para Vectorize",
      },
    ],
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    vendor: "AssemblyAI",
    category: "especialista",
    modalities: ["voz"],
    summary:
      "Transcripción con una capa de análisis encima: temas, sentimiento, resumen y detección de datos sensibles.",
    strengths: [
      "El resumen y los temas vienen resueltos, sin un segundo modelo",
      "Redacción automática de datos personales dentro del audio",
      "Precisión alta en llamadas con ruido de fondo",
    ],
    tradeoffs: [
      "Cada capa de análisis se cobra por separado y suma rápido",
      "Menos control sobre el prompt que armando el pipeline a mano",
    ],
    region: "Global · API pública",
    billing: "Por hora de audio, más extras por cada análisis",
    docsUrl: "https://www.assemblyai.com/docs",
    pricingUrl: "https://www.assemblyai.com/pricing",
    rates: [
      {
        model: "Universal (STT)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0062,
        note: "≈ USD 0.37 por hora transcrita",
      },
      {
        model: "Streaming (STT en vivo)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0075,
        note: "Transcripción en tiempo real",
      },
    ],
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    vendor: "Fireworks",
    category: "agregador",
    modalities: ["texto", "imagen", "embeddings"],
    summary:
      "Inferencia rápida sobre modelos abiertos, con ajuste fino que se cobra solo cuando el modelo está sirviendo.",
    strengths: [
      "Ajuste fino sin costo fijo por tener el modelo desplegado",
      "Salida estructurada garantizada contra un esquema JSON",
      "Buen desempeño en los modelos abiertos grandes",
    ],
    tradeoffs: [
      "La calidad depende del modelo abierto que elijas",
      "Sin los controles de cumplimiento de una nube corporativa",
    ],
    region: "Global · API pública",
    billing: "Pago por token; imágenes por unidad generada",
    docsUrl: "https://docs.fireworks.ai/",
    pricingUrl: "https://fireworks.ai/pricing",
    rates: [
      {
        model: "Llama 70B (Fireworks)",
        modality: "texto",
        inputPerMTok: 0.9,
        outputPerMTok: 0.9,
        perAudioMinute: null,
        note: "Precio simétrico, salida estructurada incluida",
      },
      {
        model: "Mixtral 8x7B",
        modality: "texto",
        inputPerMTok: 0.5,
        outputPerMTok: 0.5,
        perAudioMinute: null,
        note: "Mezcla de expertos a costo contenido",
      },
      {
        model: "FLUX schnell",
        modality: "imagen",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.0014,
        unitLabel: "imagen",
        note: "Generación de imagen a costo casi nulo",
      },
    ],
  },
  {
    id: "replicate",
    name: "Replicate",
    vendor: "Replicate",
    category: "agregador",
    modalities: ["imagen", "video", "voz", "texto"],
    summary:
      "Miles de modelos de la comunidad detrás de una API común, facturados por segundo de cómputo real.",
    strengths: [
      "Acceso inmediato a modelos de imagen y video recién salidos",
      "Se paga por segundo de ejecución, sin servidor encendido de más",
      "Se puede publicar un modelo propio con la misma interfaz",
    ],
    tradeoffs: [
      "Arranque en frío de varios segundos en modelos poco usados",
      "La calidad y el mantenimiento varían mucho entre modelos",
      "Costos difíciles de predecir hasta medir la ejecución real",
    ],
    region: "Global · API pública",
    billing: "Por segundo de GPU, o por unidad en modelos con precio fijo",
    docsUrl: "https://replicate.com/docs",
    pricingUrl: "https://replicate.com/pricing",
    rates: [
      {
        model: "FLUX dev (imagen)",
        modality: "imagen",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.025,
        unitLabel: "imagen",
        note: "Calidad alta para catálogo y marketing",
      },
      {
        model: "Modelo de video",
        modality: "video",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.09,
        unitLabel: "segundo de video",
        note: "≈ USD 5.40 por minuto generado",
      },
      {
        model: "Whisper (Replicate)",
        modality: "voz",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: 0.0027,
        note: "Transcripción por segundo de cómputo",
      },
    ],
  },
  {
    id: "stability",
    name: "Stability AI",
    vendor: "Stability",
    category: "especialista",
    modalities: ["imagen", "video"],
    summary:
      "Generación y edición de imagen con licencia clara para uso comercial, y pesos descargables en varios modelos.",
    strengths: [
      "Licencia comercial explícita, algo que no todos ofrecen",
      "Edición dirigida: relleno, borrado y cambio de fondo",
      "Los pesos abiertos permiten autoalojar si el volumen lo justifica",
    ],
    tradeoffs: [
      "Calidad por debajo de los modelos de imagen más nuevos",
      "El sistema de créditos oscurece el costo real por imagen",
    ],
    region: "Global · API pública y pesos descargables",
    billing: "Por créditos consumidos, equivalentes a imágenes",
    docsUrl: "https://platform.stability.ai/docs",
    pricingUrl: "https://platform.stability.ai/pricing",
    rates: [
      {
        model: "Stable Image Core",
        modality: "imagen",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.03,
        unitLabel: "imagen",
        note: "Generación estándar para producción",
      },
      {
        model: "Edición dirigida",
        modality: "imagen",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.04,
        unitLabel: "operación",
        note: "Relleno, borrado y cambio de fondo",
      },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity API",
    vendor: "Perplexity",
    category: "especialista",
    modalities: ["texto"],
    summary:
      "Modelos que buscan en la web antes de responder y devuelven las fuentes citadas junto al texto.",
    strengths: [
      "Respuestas con cita verificable, sin montar tu propio buscador",
      "Índice actualizado: sirve para preguntas sobre lo que pasó hoy",
      "Reemplaza un pipeline entero de búsqueda más resumen",
    ],
    tradeoffs: [
      "Se cobra la búsqueda además de los tokens",
      "No controlas qué fuentes entran al índice",
      "Poco útil si la pregunta es sobre datos internos",
    ],
    region: "Global · API pública",
    billing: "Pago por token más un cargo por búsqueda",
    docsUrl: "https://docs.perplexity.ai/",
    pricingUrl: "https://docs.perplexity.ai/guides/pricing",
    rates: [
      {
        model: "Sonar",
        modality: "texto",
        inputPerMTok: 1,
        outputPerMTok: 1,
        perAudioMinute: null,
        note: "Búsqueda con citas, precio simétrico",
      },
      {
        model: "Sonar Pro",
        modality: "texto",
        inputPerMTok: 3,
        outputPerMTok: 15,
        perAudioMinute: null,
        note: "Investigación con varias rondas de búsqueda",
      },
      {
        model: "Cargo por búsqueda",
        modality: "texto",
        inputPerMTok: null,
        outputPerMTok: null,
        perAudioMinute: null,
        perUnit: 0.005,
        unitLabel: "búsqueda",
        note: "Se suma a los tokens en cada consulta",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Proyectos construibles sobre el catálogo                                  */
/* -------------------------------------------------------------------------- */

export type ProjectKind = "voz" | "texto" | "imagen" | "mixto";
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
  {
    id: "tickets-soporte",
    title: "Clasificador y enrutador de tickets de soporte",
    kind: "texto",
    effort: "semanas",
    pitch:
      "Lee cada ticket entrante, le pone categoría, urgencia e idioma, y lo manda a la cola correcta sin que nadie lo triage a mano.",
    pipeline: [
      "El ticket entra por webhook desde la mesa de ayuda",
      "Un modelo pequeño devuelve categoría, urgencia y sentimiento en JSON",
      "Los casos con urgencia alta escalan a un modelo mayor para redactar el resumen",
      "El ticket se enruta y se anota con la etiqueta y el resumen",
    ],
    platforms: ["mistral", "groq", "cloudflare-ai"],
    billingUnit: "1.000 tickets clasificados",
    unitCost: 0.45,
    unitPrice: 9,
    marginRisk:
      "Barato salvo que el cliente pida reclasificar el histórico completo cada vez que cambia la taxonomía.",
  },
  {
    id: "facturas-vision",
    title: "Extracción de datos de facturas y comprobantes",
    kind: "mixto",
    effort: "semanas",
    pitch:
      "Toma la foto o el PDF de un comprobante y devuelve emisor, RUC, fecha, detalle y totales listos para contabilidad.",
    pipeline: [
      "Normalización de la imagen y recorte de la zona con datos",
      "Un modelo con visión extrae los campos contra un esquema fijo",
      "Validación aritmética: los ítems deben sumar el total declarado",
      "Lo que no valida se marca para revisión humana, no se inventa",
    ],
    platforms: ["google-vertex", "azure-openai", "mistral"],
    billingUnit: "1.000 comprobantes",
    unitCost: 3.8,
    unitPrice: 30,
    marginRisk:
      "Las fotos malas disparan reintentos; conviene rechazar la imagen antes de gastar la llamada al modelo.",
  },
  {
    id: "analisis-llamadas",
    title: "Análisis y puntuación de llamadas de ventas",
    kind: "voz",
    effort: "semanas",
    pitch:
      "Transcribe cada llamada, mide si el vendedor siguió el guion y devuelve una puntuación con los momentos exactos.",
    pipeline: [
      "Transcripción con separación de hablantes para saber quién dijo qué",
      "Comprobación del guion punto por punto sobre la transcripción",
      "Puntuación con la marca de tiempo que justifica cada nota",
      "Tablero semanal por vendedor y por motivo de pérdida",
    ],
    platforms: ["assemblyai", "deepgram", "anthropic"],
    billingUnit: "1 hora de llamada analizada",
    unitCost: 0.55,
    unitPrice: 6,
    marginRisk:
      "El costo sube si se analiza la llamada entera en vez de los tramos donde hay conversación real.",
  },
  {
    id: "catalogo-imagenes",
    title: "Fotografía de producto generada para catálogo",
    kind: "imagen",
    effort: "semanas",
    pitch:
      "Convierte una foto plana de producto en varias tomas de catálogo con fondo, luz y encuadre consistentes.",
    pipeline: [
      "Recorte del producto y separación del fondo original",
      "Generación de variantes con el mismo prompt de estilo de marca",
      "Filtro automático que descarta las que deforman el producto",
      "Entrega en los tamaños que pide cada canal de venta",
    ],
    platforms: ["fireworks", "replicate", "stability"],
    billingUnit: "100 imágenes entregadas",
    unitCost: 3.75,
    unitPrice: 45,
    marginRisk:
      "Se generan tres o cuatro variantes por cada imagen aceptada: el costo real es el de las descartadas.",
  },
  {
    id: "vigilancia-citas",
    title: "Vigilancia normativa con citas verificables",
    kind: "texto",
    effort: "semanas",
    pitch:
      "Responde preguntas sobre normativa y noticias recientes citando la fuente, sin que nadie tenga que buscar a mano.",
    pipeline: [
      "La pregunta va a un modelo que busca en la web antes de responder",
      "La respuesta llega con las fuentes que la sostienen",
      "Un segundo paso verifica que cada afirmación tenga cita real",
      "Lo verificado se archiva con fecha para poder auditarlo después",
    ],
    platforms: ["perplexity", "anthropic", "xai"],
    billingUnit: "1.000 consultas",
    unitCost: 9.5,
    unitPrice: 55,
    marginRisk:
      "El cargo por búsqueda se paga aunque la respuesta no sirva; conviene cachear las preguntas repetidas.",
  },
  {
    id: "deduplicacion",
    title: "Deduplicación semántica del archivo documental",
    kind: "texto",
    effort: "días",
    pitch:
      "Encuentra los documentos que dicen lo mismo con otras palabras y deja una sola versión buena de cada uno.",
    pipeline: [
      "Vectorización única de todo el archivo con embeddings baratos",
      "Agrupación por cercanía para detectar los casi duplicados",
      "Un modelo decide cuál versión es la vigente y por qué",
      "Informe de espacio recuperado y de conflictos por resolver",
    ],
    platforms: ["cohere", "cloudflare-ai", "openai"],
    billingUnit: "100.000 documentos",
    unitCost: 8.4,
    unitPrice: 60,
    marginRisk:
      "Es un trabajo de una sola vez: el margen bueno no se repite salvo que el cliente contrate el mantenimiento.",
  },
  {
    id: "boletin-a-podcast",
    title: "Boletín convertido en podcast diario",
    kind: "voz",
    effort: "días",
    pitch:
      "Toma las noticias del día ya filtradas y publica un episodio narrado, con la misma voz todas las mañanas.",
    pipeline: [
      "Selección de las notas del día por puntuación de relevancia",
      "Redacción del guion con duración objetivo fija",
      "Narración con voz sintética consistente entre episodios",
      "Publicación del audio y del feed RSS sin intervención",
    ],
    platforms: ["groq", "elevenlabs", "deepgram"],
    billingUnit: "1 episodio de 10 minutos",
    unitCost: 1.05,
    unitPrice: 12,
    marginRisk:
      "La voz de estudio domina el costo; una voz Flash baja el gasto a la mitad sin que casi nadie lo note.",
  },
  {
    id: "moderacion-tiempo-real",
    title: "Moderación de contenido en tiempo real",
    kind: "mixto",
    effort: "meses",
    pitch:
      "Revisa texto e imágenes en el momento de publicarse y bloquea lo que viola las reglas antes de que se vea.",
    pipeline: [
      "Un clasificador en el borde resuelve los casos evidentes en milisegundos",
      "Lo dudoso escala a un modelo con visión para mirar la imagen",
      "Las decisiones límite van a una cola de revisión humana",
      "Cada decisión queda registrada para poder apelarla",
    ],
    platforms: ["cloudflare-ai", "google-vertex", "openai"],
    billingUnit: "100.000 publicaciones revisadas",
    unitCost: 21,
    unitPrice: 120,
    marginRisk:
      "Si el clasificador del borde escala más del 5%, el costo se duplica: hay que vigilar esa tasa a diario.",
  },
  {
    id: "traduccion-lote",
    title: "Traducción de documentación técnica en lote",
    kind: "texto",
    effort: "semanas",
    pitch:
      "Traduce manuales enteros manteniendo el glosario de la empresa y el formato original intacto.",
    pipeline: [
      "Troceado que respeta títulos, tablas y bloques de código",
      "Traducción con el glosario de la empresa inyectado en el prompt",
      "Verificación de que los términos del glosario se respetaron",
      "Reensamblado del documento con el formato original",
    ],
    platforms: ["mistral", "deepseek", "together"],
    billingUnit: "1.000 páginas traducidas",
    unitCost: 2.6,
    unitPrice: 35,
    marginRisk:
      "Traducir de nuevo el documento completo por un cambio menor destruye el margen: conviene traducir solo lo que cambió.",
  },
  {
    id: "asistente-voz-web",
    title: "Asistente de voz embebido en el sitio",
    kind: "voz",
    effort: "meses",
    pitch:
      "Un botón de micrófono en la web que responde hablando, con la latencia baja que exige una conversación real.",
    pipeline: [
      "Captura del audio en el navegador y envío por streaming",
      "Transcripción en el borde para no cruzar medio mundo por cada frase",
      "Respuesta de un modelo rápido con el contexto de la página",
      "Síntesis de voz en streaming: se oye antes de terminar de generar",
    ],
    platforms: ["cloudflare-ai", "groq", "deepgram"],
    billingUnit: "1.000 conversaciones de 3 minutos",
    unitCost: 14.5,
    unitPrice: 90,
    marginRisk:
      "Las conversaciones que se alargan sin resolver nada consumen el margen: hay que cortarlas por tiempo.",
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
      // Solo lo que se cobra por token: Rerank y el cargo por búsqueda son
      // de modalidad texto pero se facturan por unidad, y falsearían el total.
      .filter((rate) => rate.modality === "texto" && rate.inputPerMTok !== null)
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

/** Tarifas que se cobran por unidad (imagen, video, búsqueda), de la más barata. */
export function unitRates(): Array<Rate & { platform: Platform }> {
  return PLATFORMS.flatMap((platform) =>
    platform.rates
      .filter((rate) => rate.perUnit !== undefined)
      .map((rate) => ({ ...rate, platform })),
  ).sort((left, right) => (left.perUnit ?? 0) - (right.perUnit ?? 0));
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
