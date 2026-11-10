// Concept lineage graph for "Evolución por conceptos". Rows are time slots
// (top = oldest), lanes are families of ideas. Each node links back to a
// sourced milestone in timeline.ts so explanations stay checkable.

export type ConceptLane = { id: string; label: string };

export const CONCEPT_LANES: ConceptLane[] = [
  { id: "base", label: "Fundamentos" },
  { id: "vision", label: "Visión" },
  { id: "seq", label: "Secuencia y memoria" },
  { id: "attn", label: "Atención" },
  { id: "eff", label: "Eficiencia" },
  { id: "gen", label: "Generativo" },
  { id: "scale", label: "Escala y alineamiento" },
  { id: "reason", label: "Razonamiento y agentes" },
];

/** Row labels shown in the left gutter (approximate period of each row). */
export const CONCEPT_ROWS = [
  "1943",
  "1958",
  "1986",
  "1989–97",
  "2013–14",
  "2015",
  "2017",
  "2018–20",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
];

export type Concept = {
  id: string;
  label: string;
  year: string;
  lane: number;
  row: number;
  parents: string[];
  what: string;
  solved: string;
  limit: string;
  milestoneId: string;
};

export const CONCEPTS: Concept[] = [
  {
    id: "neuron",
    label: "Neurona lógica",
    year: "1943",
    lane: 0,
    row: 0,
    parents: [],
    what: "Unidad que suma entradas ponderadas y se activa si superan un umbral.",
    solved: "Mostró que redes de unidades simples pueden computar lógica.",
    limit: "Pesos fijos a mano: no aprende.",
    milestoneId: "mcculloch-pitts",
  },
  {
    id: "perceptron",
    label: "Perceptrón",
    year: "1958",
    lane: 0,
    row: 1,
    parents: ["neuron"],
    what: "Neurona con una regla para ajustar pesos a partir de errores en ejemplos.",
    solved: "Primera máquina que aprende de datos.",
    limit: "Una sola capa: no separa problemas no lineales como XOR.",
    milestoneId: "perceptron",
  },
  {
    id: "mlp",
    label: "MLP + backprop",
    year: "1986",
    lane: 0,
    row: 2,
    parents: ["perceptron"],
    what: "Varias capas ocultas entrenadas propagando el gradiente del error hacia atrás.",
    solved: "Aprende funciones no lineales y representaciones internas.",
    limit:
      "Ignora la estructura de imágenes y secuencias; gradientes que se desvanecen en redes profundas.",
    milestoneId: "backpropagation",
  },
  {
    id: "cnn",
    label: "CNN",
    year: "1989",
    lane: 1,
    row: 3,
    parents: ["mlp"],
    what: "Filtros convolucionales con pesos compartidos que recorren la imagen.",
    solved:
      "Invariancia a la posición y muchísimos menos parámetros en visión.",
    limit: "Redes muy profundas se degradaban al entrenar.",
    milestoneId: "lenet",
  },
  {
    id: "lstm",
    label: "RNN / LSTM",
    year: "1997",
    lane: 2,
    row: 3,
    parents: ["mlp"],
    what: "Red recurrente con compuertas y celda de memoria que procesa secuencias paso a paso.",
    solved: "Dependencias de largo plazo en voz y texto.",
    limit: "Secuencial: no se paraleliza y olvida en secuencias muy largas.",
    milestoneId: "lstm",
  },
  {
    id: "embeddings",
    label: "Embeddings",
    year: "2013",
    lane: 0,
    row: 4,
    parents: ["mlp"],
    what: "Vectores densos aprendidos donde la distancia refleja significado.",
    solved: "Representación general de palabras reutilizable entre tareas.",
    limit: "Un vector por palabra, sin contexto.",
    milestoneId: "word2vec",
  },
  {
    id: "attention",
    label: "Seq2seq + atención",
    year: "2014",
    lane: 3,
    row: 4,
    parents: ["lstm", "embeddings"],
    what: "El decodificador pondera dinámicamente cada posición de la entrada.",
    solved: "Elimina el cuello de botella de un único vector de contexto.",
    limit: "Seguía montada sobre RNN secuenciales.",
    milestoneId: "seq2seq-attention",
  },
  {
    id: "gan",
    label: "GAN",
    year: "2014",
    lane: 5,
    row: 4,
    parents: ["mlp"],
    what: "Generador y discriminador entrenados en competencia.",
    solved: "Imágenes sintéticas nítidas por primera vez.",
    limit: "Entrenamiento inestable y colapso de modos.",
    milestoneId: "gan",
  },
  {
    id: "resnet",
    label: "Residuales",
    year: "2015",
    lane: 1,
    row: 5,
    parents: ["cnn"],
    what: "Cada bloque suma su entrada a su salida (atajo residual).",
    solved: "Permite entrenar cientos de capas.",
    limit: "Solución estructural, no de modelado de secuencias.",
    milestoneId: "resnet",
  },
  {
    id: "distill",
    label: "Destilación",
    year: "2015",
    lane: 4,
    row: 5,
    parents: ["mlp"],
    what: "Un modelo pequeño aprende a imitar las salidas de uno grande.",
    solved: "Modelos baratos que conservan gran parte de la capacidad.",
    limit: "El alumno rara vez supera al maestro.",
    milestoneId: "distillation",
  },
  {
    id: "transformer",
    label: "Transformer",
    year: "2017",
    lane: 3,
    row: 6,
    parents: ["attention", "resnet"],
    what: "Solo autoatención y capas densas con conexiones residuales; todas las posiciones en paralelo.",
    solved: "Entrenamiento masivamente paralelo y dependencias largas.",
    limit:
      "Costo cuadrático en la longitud y caché KV que crece con el contexto.",
    milestoneId: "transformer",
  },
  {
    id: "moe",
    label: "MoE",
    year: "2017",
    lane: 4,
    row: 6,
    parents: ["mlp"],
    what: "Un enrutador activa solo algunos expertos por token.",
    solved: "Más parámetros sin más cómputo por token.",
    limit: "Balanceo de carga y comunicación entre aceleradores.",
    milestoneId: "sparse-moe",
  },
  {
    id: "pretraining",
    label: "Preentrenamiento",
    year: "2018",
    lane: 3,
    row: 7,
    parents: ["transformer"],
    what: "Modelo base entrenado con texto masivo (siguiente token o enmascarado) y luego adaptado.",
    solved: "Un solo modelo para muchas tareas.",
    limit: "Sigue sin seguir instrucciones de forma fiable.",
    milestoneId: "gpt-1",
  },
  {
    id: "diffusion",
    label: "Difusión",
    year: "2020",
    lane: 5,
    row: 7,
    parents: ["gan"],
    what: "Aprende a revertir un proceso de ruido paso a paso.",
    solved: "Generación estable y diversa de imágenes y video.",
    limit: "Muchos pasos de muestreo.",
    milestoneId: "ddpm",
  },
  {
    id: "scaling",
    label: "Leyes de escalado",
    year: "2020",
    lane: 6,
    row: 7,
    parents: ["pretraining"],
    what: "La pérdida cae de forma predecible con parámetros, datos y cómputo.",
    solved: "Planificar inversiones en entrenamiento.",
    limit:
      "Solo predice pérdida, no capacidades concretas; Chinchilla corrigió el reparto óptimo.",
    milestoneId: "scaling-laws",
  },
  {
    id: "clip",
    label: "Visión-lenguaje",
    year: "2021",
    lane: 1,
    row: 8,
    parents: ["transformer", "embeddings"],
    what: "Imagen y texto en un mismo espacio mediante aprendizaje contrastivo.",
    solved: "Clasificación sin ejemplos y base de la multimodalidad.",
    limit: "No genera ni razona por sí solo.",
    milestoneId: "clip-dalle",
  },
  {
    id: "long-context",
    label: "RoPE / contexto largo",
    year: "2021",
    lane: 3,
    row: 8,
    parents: ["transformer"],
    what: "Posiciones rotatorias que se extienden a secuencias más largas que las de entrenamiento.",
    solved: "Ventanas de 100K a millones de tokens.",
    limit: "Memoria y costo crecen con la longitud.",
    milestoneId: "rope",
  },
  {
    id: "lora",
    label: "LoRA / PEFT",
    year: "2021",
    lane: 4,
    row: 8,
    parents: ["transformer"],
    what: "Ajuste fino entrenando solo matrices de bajo rango añadidas.",
    solved: "Adaptar modelos grandes con hardware modesto.",
    limit: "Menor capacidad de cambio que un ajuste completo.",
    milestoneId: "lora",
  },
  {
    id: "rlhf",
    label: "RLHF",
    year: "2022",
    lane: 6,
    row: 9,
    parents: ["pretraining"],
    what: "Optimiza el modelo contra un modelo de recompensa entrenado con preferencias humanas.",
    solved: "Asistentes útiles que siguen instrucciones.",
    limit: "Costoso y propenso a complacencia; DPO lo simplificó.",
    milestoneId: "instructgpt",
  },
  {
    id: "cot",
    label: "Cadena de pensamiento",
    year: "2022",
    lane: 7,
    row: 9,
    parents: ["pretraining"],
    what: "El modelo escribe pasos intermedios antes de la respuesta.",
    solved: "Mejoras grandes en matemáticas y lógica.",
    limit: "Dependía del prompt, no del entrenamiento.",
    milestoneId: "chain-of-thought",
  },
  {
    id: "flash",
    label: "FlashAttention",
    year: "2022",
    lane: 4,
    row: 9,
    parents: ["transformer"],
    what: "Atención exacta calculada por bloques en la memoria rápida de la GPU.",
    solved: "Menos memoria y más velocidad en entrenamiento e inferencia.",
    limit: "No cambia la complejidad cuadrática.",
    milestoneId: "flashattention",
  },
  {
    id: "quant",
    label: "Cuantización",
    year: "2022–23",
    lane: 4,
    row: 10,
    parents: ["lora"],
    what: "Pesos en 8, 4 o menos bits en lugar de 16.",
    solved: "Modelos grandes en GPUs de consumo y despliegue local.",
    limit: "Pérdida de calidad a bits muy bajos.",
    milestoneId: "dpo-qlora",
  },
  {
    id: "ssm",
    label: "SSM / Mamba",
    year: "2023",
    lane: 2,
    row: 10,
    parents: ["lstm"],
    what: "Estado recurrente selectivo con costo lineal en la longitud.",
    solved: "Secuencias largas sin caché KV creciente.",
    limit: "Peor recuperación exacta que la atención.",
    milestoneId: "mamba",
  },
  {
    id: "tools",
    label: "Agentes / herramientas",
    year: "2022–23",
    lane: 7,
    row: 10,
    parents: ["cot"],
    what: "Bucle razonar-actuar con llamadas a funciones, código y búsqueda.",
    solved: "Tareas de varios pasos con efectos reales.",
    limit: "Errores que se acumulan y riesgos de seguridad.",
    milestoneId: "react",
  },
  {
    id: "moe-llm",
    label: "LLM MoE",
    year: "2023–24",
    lane: 4,
    row: 11,
    parents: ["moe", "transformer"],
    what: "Transformers con capas de expertos dispersos a gran escala.",
    solved: "Frontera con una fracción del cómputo activo.",
    limit: "Memoria total alta para servir.",
    milestoneId: "mixtral",
  },
  {
    id: "hybrid",
    label: "Híbridos",
    year: "2024",
    lane: 2,
    row: 11,
    parents: ["ssm", "transformer"],
    what: "Intercalan capas de atención con capas SSM (y a veces MoE).",
    solved: "Contexto largo con poca memoria sin perder recuperación.",
    limit: "Ecosistema de kernels y herramientas aún inmaduro.",
    milestoneId: "jamba",
  },
  {
    id: "mla",
    label: "MLA",
    year: "2024",
    lane: 3,
    row: 11,
    parents: ["long-context"],
    what: "Atención latente: comprime claves y valores en un vector pequeño.",
    solved: "Caché KV drásticamente menor y contexto largo barato.",
    limit: "Más compleja de implementar y combinar con RoPE.",
    milestoneId: "deepseek-v2",
  },
  {
    id: "ttc",
    label: "Test-time compute",
    year: "2024",
    lane: 6,
    row: 11,
    parents: ["scaling", "cot"],
    what: "Gastar más cómputo al responder: pensar más, muestrear y verificar.",
    solved: "Nuevo eje de mejora sin reentrenar.",
    limit: "Mayor latencia y costo por pregunta.",
    milestoneId: "test-time-compute",
  },
  {
    id: "reasoning-rl",
    label: "Razonamiento por RL",
    year: "2024–25",
    lane: 7,
    row: 11,
    parents: ["cot", "rlhf"],
    what: "Refuerzo con recompensas verificables que enseña a razonar largo (o1, R1).",
    solved: "Saltos en matemáticas, código y ciencia.",
    limit: "Funciona mejor donde la respuesta es verificable.",
    milestoneId: "deepseek-r1",
  },
  {
    id: "text-diffusion",
    label: "Difusión de texto",
    year: "2025",
    lane: 5,
    row: 12,
    parents: ["diffusion", "transformer"],
    what: "Genera texto desenmascarando muchos tokens en paralelo.",
    solved: "Generación potencialmente mucho más rápida.",
    limit: "Aún por detrás de los autoregresivos en calidad general.",
    milestoneId: "llada",
  },
  {
    id: "mcp",
    label: "MCP",
    year: "2024",
    lane: 7,
    row: 12,
    parents: ["tools"],
    what: "Protocolo abierto para conectar modelos con herramientas y datos.",
    solved: "Integraciones reutilizables entre aplicaciones y modelos.",
    limit: "La seguridad depende de cada servidor conectado.",
    milestoneId: "mcp",
  },
];

export function conceptById(id: string): Concept | undefined {
  return CONCEPTS.find((concept) => concept.id === id);
}

export function childrenOf(id: string): Concept[] {
  return CONCEPTS.filter((concept) => concept.parents.includes(id));
}

/** All ancestors and descendants of a concept (excluding itself). */
export function lineageOf(id: string): Set<string> {
  const lineage = new Set<string>();
  const up = [...(conceptById(id)?.parents ?? [])];
  while (up.length) {
    const next = up.pop() as string;
    if (lineage.has(next)) continue;
    lineage.add(next);
    up.push(...(conceptById(next)?.parents ?? []));
  }
  const down = childrenOf(id).map((c) => c.id);
  while (down.length) {
    const next = down.pop() as string;
    if (lineage.has(next)) continue;
    lineage.add(next);
    down.push(...childrenOf(next).map((c) => c.id));
  }
  return lineage;
}
