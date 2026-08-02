// Curated visual wiki of AI history. This is editorial reference content, not
// synchronized observatory data: every milestone cites primary or canonical
// sources so each claim can be checked, and the page-level stats are computed
// from this file rather than typed by hand. Keep additions sourced.

export type EraId = "1950-1980" | "1980-2012" | "2012-2019" | "2020-hoy";

export type MilestoneType =
  | "Concepto"
  | "Evento"
  | "Técnica"
  | "Contexto"
  | "Hito"
  | "Modelo"
  | "Arquitectura"
  | "Paradigma"
  | "Tendencia";

export type MilestoneSource = {
  title: string;
  author: string;
  url: string;
};

export type Milestone = {
  id: string;
  era: EraId;
  /** Display label, e.g. "1965–1975". */
  yearLabel: string;
  /** Numeric year used for ordering. */
  year: number;
  title: string;
  description: string;
  type: MilestoneType;
  tags: string[];
  summary: string;
  impact: string[];
  concepts: string[];
  /** Models or systems this milestone introduced or directly enabled. */
  keyModels: string[];
  whatHappened: string;
  whyItMattered: string;
  simpleExample: string;
  sources: MilestoneSource[];
};

export const ERAS: Array<{ id: EraId; label: string }> = [
  { id: "1950-1980", label: "1950–1980" },
  { id: "1980-2012", label: "1980–2012" },
  { id: "2012-2019", label: "2012–2019" },
  { id: "2020-hoy", label: "2020–hoy" },
];

export const MILESTONES: Milestone[] = [
  {
    id: "turing-test",
    era: "1950-1980",
    yearLabel: "1950",
    year: 1950,
    title: "Test de Turing",
    description:
      "Alan Turing propone un test para evaluar si una máquina puede exhibir comportamiento inteligente.",
    type: "Concepto",
    tags: ["Filosofía", "Evaluación", "Fundacional"],
    summary:
      "En «Computing Machinery and Intelligence», Turing reemplaza la pregunta «¿pueden pensar las máquinas?» por el juego de imitación: si un interrogador no distingue a la máquina de una persona por escrito, la distinción deja de ser operativa.",
    impact: [
      "Dio a la IA su primer criterio operativo de evaluación.",
      "Anticipó objeciones que siguen debatiéndose hoy.",
      "Inspiró benchmarks conversacionales posteriores.",
    ],
    concepts: ["Juego de imitación", "Inteligencia", "Evaluación"],
    keyModels: [],
    whatHappened:
      "Turing publica en la revista Mind un experimento mental: un interrogador conversa por escrito con una máquina y una persona sin saber cuál es cuál.",
    whyItMattered:
      "Convirtió una pregunta filosófica en una prueba práctica, y con ello fundó la discusión moderna sobre inteligencia de máquina.",
    simpleExample:
      "Si chateas con alguien y no puedes decidir si es humano o programa, el programa «pasa» el test.",
    sources: [
      {
        title: "Computing Machinery and Intelligence",
        author: "A. M. Turing, Mind, 1950",
        url: "https://academic.oup.com/mind/article/LIX/236/433/986238",
      },
      {
        title: "The Turing Test",
        author: "Stanford Encyclopedia of Philosophy",
        url: "https://plato.stanford.edu/entries/turing-test/",
      },
    ],
  },
  {
    id: "dartmouth",
    era: "1950-1980",
    yearLabel: "1956",
    year: 1956,
    title: "Conferencia de Dartmouth",
    description:
      "Se acuña el término «Inteligencia Artificial» y nace la disciplina como campo de estudio.",
    type: "Evento",
    tags: ["Historia", "Comunidad", "Fundacional"],
    summary:
      "McCarthy, Minsky, Rochester y Shannon proponen un taller de verano en Dartmouth sobre la conjetura de que todo aspecto del aprendizaje puede describirse con tal precisión que una máquina pueda simularlo.",
    impact: [
      "Bautizó el campo: «artificial intelligence».",
      "Reunió a la primera generación de investigadores del área.",
      "Fijó la agenda inicial: lenguaje, abstracción, autosuperación.",
    ],
    concepts: ["Simulación del aprendizaje", "Programa de investigación"],
    keyModels: [],
    whatHappened:
      "Un grupo de investigadores pasa el verano de 1956 en Dartmouth College explorando si las máquinas pueden usar lenguaje, formar abstracciones y mejorarse a sí mismas.",
    whyItMattered:
      "Sin nombre no hay campo: la propuesta definió el término y la comunidad que organizaría décadas de investigación.",
    simpleExample:
      "Es el momento en que «hacer que las máquinas piensen» pasó de idea suelta a proyecto con nombre propio.",
    sources: [
      {
        title:
          "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence",
        author: "McCarthy, Minsky, Rochester y Shannon, 1955",
        url: "http://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf",
      },
      {
        title: "Artificial Intelligence (AI) Coined at Dartmouth",
        author: "Dartmouth College",
        url: "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
      },
    ],
  },
  {
    id: "expert-systems",
    era: "1950-1980",
    yearLabel: "1965–1975",
    year: 1965,
    title: "Sistemas expertos",
    description:
      "Surgen sistemas que aplican conocimiento humano con reglas para resolver problemas específicos.",
    type: "Técnica",
    tags: ["Reglas", "Conocimiento", "Aplicación"],
    summary:
      "DENDRAL (química) y después MYCIN (diagnóstico médico) muestran que codificar conocimiento experto como reglas si-entonces produce sistemas útiles en dominios estrechos.",
    impact: [
      "Primera vía comercial de la IA (años 80).",
      "Demostró el valor del conocimiento específico de dominio.",
      "Sus límites de mantenimiento motivaron el giro hacia el aprendizaje.",
    ],
    concepts: ["Reglas si-entonces", "Base de conocimiento", "Inferencia"],
    keyModels: ["DENDRAL", "MYCIN"],
    whatHappened:
      "En Stanford, Feigenbaum y colegas construyen programas que capturan el conocimiento de químicos y médicos como reglas explícitas ejecutables.",
    whyItMattered:
      "Probó que la IA podía ser útil sin resolver la inteligencia general, y expuso el cuello de botella de escribir el conocimiento a mano.",
    simpleExample:
      "«Si el organismo es grampositivo y crece en cadenas, entonces probablemente es estreptococo» — miles de reglas así, consultadas por un motor de inferencia.",
    sources: [
      {
        title: "Expert system",
        author: "Encyclopaedia Britannica",
        url: "https://www.britannica.com/technology/expert-system",
      },
      {
        title: "MYCIN: A Knowledge-Based Computer Program",
        author: "E. Shortliffe, Stanford, 1974 (AIM-251)",
        url: "https://exhibits.stanford.edu/feigenbaum/catalog/zw237kb5893",
      },
    ],
  },
  {
    id: "ai-winter",
    era: "1950-1980",
    yearLabel: "1974–1980",
    year: 1974,
    title: "Invierno de la IA",
    description:
      "Limitaciones de hardware y expectativas no cumplidas reducen la financiación y el entusiasmo.",
    type: "Contexto",
    tags: ["Financiación", "Expectativas", "Historia"],
    summary:
      "El informe Lighthill (1973) para el gobierno británico critica el progreso de la IA frente a sus promesas; junto con recortes de DARPA, la financiación cae y el término «IA» se vuelve tóxico durante años.",
    impact: [
      "Enseñó el costo de prometer más de lo que la técnica da.",
      "Redirigió el trabajo hacia objetivos acotados.",
      "Patrón que la industria vigila hasta hoy.",
    ],
    concepts: ["Ciclo de expectativas", "Financiación pública"],
    keyModels: [],
    whatHappened:
      "Tras una década de promesas incumplidas, evaluaciones oficiales concluyen que la IA no escala fuera de problemas de juguete y los fondos se retiran.",
    whyItMattered:
      "El campo aprendió que la credibilidad es un recurso: los inviernos siguientes se citan siempre que el entusiasmo supera a la evidencia.",
    simpleExample:
      "Como una startup que promete demasiado y pierde a sus inversores: la IA tuvo que reconstruir confianza con resultados pequeños y verificables.",
    sources: [
      {
        title: "Artificial Intelligence: A General Survey (informe Lighthill)",
        author: "J. Lighthill, Science Research Council, 1973",
        url: "https://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm",
      },
      {
        title: "AI winter",
        author: "Wikipedia (recopilación con referencias primarias)",
        url: "https://en.wikipedia.org/wiki/AI_winter",
      },
    ],
  },
  {
    id: "backpropagation",
    era: "1980-2012",
    yearLabel: "1986",
    year: 1986,
    title: "Retropropagación",
    description:
      "Rumelhart, Hinton y Williams popularizan el algoritmo que permite entrenar redes neuronales multicapa.",
    type: "Técnica",
    tags: ["Redes neuronales", "Aprendizaje", "Optimización"],
    summary:
      "El artículo «Learning representations by back-propagating errors» muestra cómo ajustar los pesos internos de una red propagando el error hacia atrás, haciendo entrenables las capas ocultas.",
    impact: [
      "Hizo prácticas las redes de más de una capa.",
      "Es el motor de entrenamiento de todo el deep learning actual.",
      "Revivió el conexionismo tras el escepticismo de los 70.",
    ],
    concepts: ["Gradiente", "Capas ocultas", "Representaciones"],
    keyModels: [],
    whatHappened:
      "Se publica en Nature una regla general para calcular, capa por capa, cuánto contribuyó cada peso al error de la red y corregirlo.",
    whyItMattered:
      "Sin retropropagación no hay forma eficiente de entrenar redes profundas: AlexNet, los Transformers y los modelos actuales dependen de ella.",
    simpleExample:
      "Como afinar una orquesta: se escucha el error del conjunto y cada músico recibe una corrección proporcional a su contribución.",
    sources: [
      {
        title: "Learning representations by back-propagating errors",
        author: "Rumelhart, Hinton y Williams, Nature, 1986",
        url: "https://www.nature.com/articles/323533a0",
      },
    ],
  },
  {
    id: "deep-blue",
    era: "1980-2012",
    yearLabel: "1997",
    year: 1997,
    title: "Deep Blue derrota a Kasparov",
    description:
      "IBM Deep Blue vence al campeón mundial de ajedrez, hito para la IA simbólica y búsqueda.",
    type: "Hito",
    tags: ["Búsqueda", "Juegos", "IBM"],
    summary:
      "El 11 de mayo de 1997, Deep Blue gana 3.5–2.5 el match de revancha contra Garry Kasparov: primera vez que una máquina derrota al campeón mundial en condiciones de torneo.",
    impact: [
      "Demostró el poder de la búsqueda masiva con hardware dedicado.",
      "Llevó la IA a la conversación pública global.",
      "Marcó el techo de la vía simbólica pura: el ajedrez sí, la percepción no.",
    ],
    concepts: [
      "Búsqueda alfa-beta",
      "Función de evaluación",
      "Hardware dedicado",
    ],
    keyModels: ["Deep Blue"],
    whatHappened:
      "Un sistema capaz de evaluar unos 200 millones de posiciones por segundo, con conocimiento ajedrecístico afinado por grandes maestros, gana el match de seis partidas.",
    whyItMattered:
      "Probó que en dominios cerrados y formalizables la máquina podía superar al mejor humano — y dejó claro que la inteligencia general era otro problema.",
    simpleExample:
      "Deep Blue no «entendía» ajedrez: exploraba tantísimas jugadas futuras que encontraba la mejor casi por fuerza calculada.",
    sources: [
      {
        title: "Deep Blue",
        author: "IBM Heritage",
        url: "https://www.ibm.com/history/deep-blue",
      },
    ],
  },
  {
    id: "alexnet",
    era: "2012-2019",
    yearLabel: "2012",
    year: 2012,
    title: "AlexNet gana ImageNet",
    description:
      "Las redes neuronales profundas revolucionan la visión por computadora.",
    type: "Modelo",
    tags: ["Visión", "Deep learning", "GPU"],
    summary:
      "AlexNet reduce el error top-5 de ImageNet a 15.3% (el segundo quedó en 26.2%) entrenando una red convolucional profunda en dos GPUs, con ReLU y dropout.",
    impact: [
      "Inició la era del deep learning moderno.",
      "Convirtió a las GPUs en la infraestructura estándar de la IA.",
      "Desplazó las características diseñadas a mano por las aprendidas.",
    ],
    concepts: ["Convoluciones", "GPU", "ReLU", "Dropout"],
    keyModels: ["AlexNet", "ImageNet"],
    whatHappened:
      "Krizhevsky, Sutskever y Hinton ganan el reto ILSVRC 2012 por un margen sin precedentes usando una red convolucional de ocho capas.",
    whyItMattered:
      "El salto fue tan grande que toda la comunidad de visión cambió de método en cuestión de meses; la financiación y el talento siguieron.",
    simpleExample:
      "En vez de programar «un gato tiene orejas puntiagudas», se muestran millones de fotos y la red descubre sola qué rasgos importan.",
    sources: [
      {
        title:
          "ImageNet Classification with Deep Convolutional Neural Networks",
        author: "Krizhevsky, Sutskever y Hinton, NeurIPS 2012",
        url: "https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html",
      },
    ],
  },
  {
    id: "alphago",
    era: "2012-2019",
    yearLabel: "2016",
    year: 2016,
    title: "AlphaGo vence a Lee Sedol",
    description:
      "Aprendizaje profundo por refuerzo supera al campeón mundial de Go, un juego intratable por fuerza bruta.",
    type: "Hito",
    tags: ["Refuerzo", "Juegos", "DeepMind"],
    summary:
      "AlphaGo combina redes profundas de política y valor con búsqueda de árbol Monte Carlo y gana 4–1 a Lee Sedol en Seúl; la jugada 37 de la partida 2 se vuelve símbolo de creatividad de máquina.",
    impact: [
      "Mostró que redes + búsqueda + refuerzo superan dominios «intuitivos».",
      "Aceleró la inversión global en deep learning.",
      "Su sucesor AlphaZero aprendió sin partidas humanas.",
    ],
    concepts: ["Aprendizaje por refuerzo", "MCTS", "Self-play"],
    keyModels: ["AlphaGo", "AlphaZero"],
    whatHappened:
      "DeepMind entrena redes con partidas humanas y luego con juego contra sí misma; en marzo de 2016 derrota al mejor jugador de la década.",
    whyItMattered:
      "El Go tiene más posiciones que átomos en el universo observable: ganó la intuición aprendida, no la enumeración.",
    simpleExample:
      "AlphaGo jugó millones de partidas contra sí mismo hasta desarrollar un «olfato» para las buenas jugadas que ningún programador escribió.",
    sources: [
      {
        title:
          "Mastering the game of Go with deep neural networks and tree search",
        author: "Silver et al., Nature, 2016",
        url: "https://www.nature.com/articles/nature16961",
      },
      {
        title: "AlphaGo",
        author: "Google DeepMind",
        url: "https://deepmind.google/research/breakthroughs/alphago/",
      },
    ],
  },
  {
    id: "transformers",
    era: "2012-2019",
    yearLabel: "2017",
    year: 2017,
    title: "Transformers",
    description:
      "Nueva arquitectura basada en atención que cambia el estado del arte en NLP y más allá.",
    type: "Arquitectura",
    tags: ["NLP", "Arquitectura", "Base de modelos modernos"],
    summary:
      "El artículo «Attention Is All You Need» presenta la arquitectura Transformer, que sustituye las RNN por mecanismos de atención y permite entrenamiento paralelo y dependencias de largo alcance.",
    impact: [
      "Impulsó avances en NLP y visión por computadora.",
      "Base de modelos como BERT, GPT, T5 y muchos más.",
      "Habilitó el escalado eficiente de modelos y datos.",
      "Cambió el paradigma de investigación y aplicación.",
    ],
    concepts: [
      "Atención",
      "Auto-atención",
      "Secuencias",
      "Positional Encoding",
      "Escalado",
      "Transferencia",
    ],
    keyModels: ["Transformer", "BERT", "GPT", "T5"],
    whatHappened:
      "Se introduce el mecanismo de atención que permite procesar secuencias en paralelo y capturar dependencias largas de forma eficiente.",
    whyItMattered:
      "Habilitó modelos más potentes, escalables y versátiles, que impulsaron la mayoría de aplicaciones modernas de la IA generativa y comprensión de lenguaje.",
    simpleExample:
      "En lugar de leer palabra por palabra, el modelo «presta atención» a todas las partes relevantes de la oración al mismo tiempo.",
    sources: [
      {
        title: "Attention Is All You Need",
        author: "Vaswani et al., 2017",
        url: "https://arxiv.org/abs/1706.03762",
      },
      {
        title: "The Annotated Transformer",
        author: "Harvard NLP",
        url: "https://nlp.seas.harvard.edu/annotated-transformer/",
      },
      {
        title: "The Illustrated Transformer",
        author: "Jay Alammar",
        url: "https://jalammar.github.io/illustrated-transformer/",
      },
    ],
  },
  {
    id: "foundation-models",
    era: "2020-hoy",
    yearLabel: "2020",
    year: 2020,
    title: "Modelos fundacionales",
    description:
      "Escalado de modelos y datos da lugar a capacidades generales transferibles.",
    type: "Paradigma",
    tags: ["Escalado", "Few-shot", "Generalidad"],
    summary:
      "GPT-3 (175 000 millones de parámetros) muestra aprendizaje few-shot: resuelve tareas nuevas con solo ejemplos en el prompt. Stanford acuña «foundation models» para esta clase de modelos base adaptables.",
    impact: [
      "Del modelo por tarea al modelo base adaptable a muchas tareas.",
      "El prompting emerge como nueva interfaz de programación.",
      "Concentró la investigación en escalado de datos y cómputo.",
    ],
    concepts: [
      "Leyes de escalado",
      "Few-shot",
      "Prompting",
      "Preentrenamiento",
    ],
    keyModels: ["GPT-3"],
    whatHappened:
      "OpenAI entrena un modelo de lenguaje dos órdenes de magnitud mayor que sus predecesores y observa capacidades que no fueron programadas explícitamente.",
    whyItMattered:
      "Cambió la economía del campo: un preentrenamiento costoso, muchas aplicaciones baratas encima.",
    simpleExample:
      "Le muestras tres ejemplos de traducción en el mensaje y traduce el cuarto sin haber sido entrenado específicamente para traducir.",
    sources: [
      {
        title: "Language Models are Few-Shot Learners",
        author: "Brown et al., 2020",
        url: "https://arxiv.org/abs/2005.14165",
      },
      {
        title: "On the Opportunities and Risks of Foundation Models",
        author: "Bommasani et al., Stanford CRFM, 2021",
        url: "https://arxiv.org/abs/2108.07258",
      },
    ],
  },
  {
    id: "multimodal",
    era: "2020-hoy",
    yearLabel: "2023",
    year: 2023,
    title: "IA multimodal",
    description:
      "Modelos que entienden y generan texto, imagen, audio y vídeo de forma integrada.",
    type: "Tendencia",
    tags: ["Multimodal", "Visión", "Audio"],
    summary:
      "GPT-4 acepta imágenes además de texto; Gemini se entrena multimodal desde el inicio. La frontera deja de ser el lenguaje: los modelos razonan sobre fotos, diagramas, audio y vídeo.",
    impact: [
      "Interfaces naturales: hablar, mostrar, señalar.",
      "Un solo modelo cubre tareas antes repartidas en sistemas separados.",
      "Abrió aplicaciones en accesibilidad, educación y análisis visual.",
    ],
    concepts: [
      "Multimodalidad",
      "Alineación texto-imagen",
      "Tokenización universal",
    ],
    keyModels: ["GPT-4", "Gemini", "DALL·E", "Whisper"],
    whatHappened:
      "Los laboratorios publican modelos que comparten una representación interna entre modalidades, entrenados con pares texto-imagen-audio a gran escala.",
    whyItMattered:
      "El mundo no es solo texto: para ser útil en tareas reales, la IA necesitaba ver y escuchar además de leer.",
    simpleExample:
      "Le tomas foto a una pizarra con ecuaciones y el modelo las explica paso a paso.",
    sources: [
      {
        title: "GPT-4 Technical Report",
        author: "OpenAI, 2023",
        url: "https://arxiv.org/abs/2303.08774",
      },
      {
        title: "Gemini: A Family of Highly Capable Multimodal Models",
        author: "Gemini Team, Google, 2023",
        url: "https://arxiv.org/abs/2312.11805",
      },
    ],
  },
  {
    id: "agents",
    era: "2020-hoy",
    yearLabel: "2024+",
    year: 2024,
    title: "Agentes de IA",
    description:
      "Sistemas que perciben, razonan y actúan para alcanzar objetivos de forma autónoma.",
    type: "Tendencia",
    tags: ["Agentes", "Herramientas", "Autonomía"],
    summary:
      "Los modelos dejan de solo responder: planifican, llaman herramientas, ejecutan código y verifican resultados en bucles de varios pasos. ReAct formalizó el patrón razonar-actuar que popularizó esta línea.",
    impact: [
      "Del chat al trabajo: tareas de varios pasos con herramientas reales.",
      "Nuevos retos de seguridad, evaluación y control.",
      "Motor de los asistentes de programación y automatización actuales.",
    ],
    concepts: ["Uso de herramientas", "Planificación", "Bucle razonar-actuar"],
    keyModels: ["ReAct", "Claude", "AutoGPT"],
    whatHappened:
      "La combinación de modelos capaces, llamadas a funciones y memoria de contexto larga hace viable delegar objetivos, no solo preguntas.",
    whyItMattered:
      "Cambia la unidad de valor: de la respuesta correcta a la tarea completada de extremo a extremo.",
    simpleExample:
      "En lugar de preguntarle cómo renombrar 100 archivos, le pides que los renombre: planifica, ejecuta los comandos y te muestra el resultado.",
    sources: [
      {
        title: "ReAct: Synergizing Reasoning and Acting in Language Models",
        author: "Yao et al., 2022",
        url: "https://arxiv.org/abs/2210.03629",
      },
      {
        title: "Building effective agents",
        author: "Anthropic, 2024",
        url: "https://www.anthropic.com/research/building-effective-agents",
      },
    ],
  },
];

/** Concept-evolution strip shown under the timeline. */
export const CONCEPT_FLOW: Array<{
  id: string;
  label: string;
  hint: string;
  milestoneId: string;
}> = [
  {
    id: "rules",
    label: "Reglas",
    hint: "Conocimiento explícito",
    milestoneId: "expert-systems",
  },
  {
    id: "data",
    label: "Datos",
    hint: "Ejemplos y patrones",
    milestoneId: "backpropagation",
  },
  {
    id: "neural",
    label: "Redes neuronales",
    hint: "Aprendizaje automático",
    milestoneId: "alexnet",
  },
  {
    id: "transformers",
    label: "Transformers",
    hint: "Atención y contexto",
    milestoneId: "transformers",
  },
  {
    id: "agents",
    label: "Agentes",
    hint: "Razón y acción",
    milestoneId: "agents",
  },
];

/** Page stats derived from the dataset — never typed by hand. */
export function timelineStats() {
  const keyModels = new Set(
    MILESTONES.flatMap((milestone) => milestone.keyModels),
  );
  return {
    milestones: MILESTONES.length,
    eras: ERAS.length,
    keyModels: keyModels.size,
    sources: MILESTONES.reduce(
      (total, milestone) => total + milestone.sources.length,
      0,
    ),
  };
}
