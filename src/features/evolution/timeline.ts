// Curated visual wiki of AI history (1943 → 2026-11-09). Editorial reference
// content, not synchronized observatory data: every milestone cites a primary
// or canonical source (paper, arXiv, official announcement) so each claim can
// be checked. Items whose exact date only appears in secondary coverage carry
// `status: "por-verificar"`. Page stats are computed from this file.

export const TIMELINE_VERIFIED_AT = "2026-11-09";

export type BranchId =
  | "arch"
  | "training"
  | "scale"
  | "multimodal"
  | "agents"
  | "open"
  | "policy";

export type EraId =
  | "fundamentos"
  | "inviernos"
  | "estadistico"
  | "deep-learning"
  | "transformer"
  | "generativa"
  | "razonamiento"
  | "frontera-2026";

export type MilestoneSource = { title: string; author: string; url: string };

export type Milestone = {
  id: string;
  era: EraId;
  branch: BranchId;
  /** ISO-like date: "1943", "2022-11" or "2022-11-30". */
  date: string;
  title: string;
  description: string;
  impact: string;
  sources: MilestoneSource[];
  status?: "por-verificar";
};

export type Era = {
  id: EraId;
  name: string;
  start: number;
  end: number;
  summary: string;
};

export type Specialty = { name: string; role: string };

export type Branch = {
  id: BranchId;
  label: string;
  code: string;
  /** CSS token that colours this branch everywhere. */
  tone: string;
  origin: string;
  description: string;
  specialties: Specialty[];
};

export const ERAS: Era[] = [
  {
    id: "fundamentos",
    name: "Fundamentos y primera promesa",
    start: 1943,
    end: 1969,
    summary:
      "Neuronas lógicas, la pregunta de Turing y el nacimiento del campo en Dartmouth. Se prueban dos caminos: símbolos y reglas, o redes que aprenden.",
  },
  {
    id: "inviernos",
    name: "Inviernos y conexionismo",
    start: 1970,
    end: 1993,
    summary:
      "Las promesas superan a la técnica y los fondos caen. En paralelo, la retropropagación y las primeras redes convolucionales preparan el regreso de las redes neuronales.",
  },
  {
    id: "estadistico",
    name: "Aprendizaje estadístico y datos",
    start: 1994,
    end: 2011,
    summary:
      "SVM, LSTM y búsqueda masiva dominan. Aparecen los ingredientes del salto posterior: GPUs programables y grandes conjuntos de datos etiquetados.",
  },
  {
    id: "deep-learning",
    name: "Revolución del deep learning",
    start: 2012,
    end: 2016,
    summary:
      "AlexNet convierte a las GPUs en la infraestructura estándar. Embeddings, GAN, atención y redes residuales; AlphaGo lleva el aprendizaje por refuerzo al gran público.",
  },
  {
    id: "transformer",
    name: "Transformers y modelos fundacionales",
    start: 2017,
    end: 2021,
    summary:
      "La atención reemplaza a la recurrencia. El preentrenamiento a escala y las leyes de escalado crean modelos base que se adaptan a muchas tareas.",
  },
  {
    id: "generativa",
    name: "IA generativa masiva",
    start: 2022,
    end: 2023,
    summary:
      "RLHF convierte modelos base en asistentes; ChatGPT lleva la IA a cientos de millones de personas. Estalla la ola de pesos abiertos y llegan las primeras reglas internacionales.",
  },
  {
    id: "razonamiento",
    name: "Razonamiento, agentes y eficiencia",
    start: 2024,
    end: 2025,
    summary:
      "Contexto de millones de tokens, modelos que piensan antes de responder (test-time compute), MoE baratos de entrenar y agentes que usan herramientas y computadoras.",
  },
  {
    id: "frontera-2026",
    name: "Frontera 2026",
    start: 2026,
    end: 2026,
    summary:
      "Modelos de clase Mythos por encima de Opus, familias 5.x con contexto de 1M y salvaguardas específicas por dominio; la regulación europea ajusta sus plazos.",
  },
];

export const BRANCHES: Branch[] = [
  {
    id: "arch",
    label: "Arquitecturas",
    code: "AR",
    tone: "var(--accent)",
    origin: "1943 · neurona de McCulloch-Pitts",
    description:
      "Cómo se organiza el cómputo dentro del modelo: de la neurona lógica al perceptrón, las redes convolucionales y recurrentes, la atención y el Transformer, y hoy MoE, SSM, MLA e híbridos.",
    specialties: [
      {
        name: "Investigación de arquitecturas",
        role: "Diseña bloques nuevos (atención, SSM, expertos) y los valida a pequeña escala antes de escalar.",
      },
      {
        name: "Modelos eficientes",
        role: "Reduce memoria y latencia con atención comprimida (MLA), dispersión MoE y capas híbridas.",
      },
      {
        name: "Interpretabilidad",
        role: "Estudia qué representan las activaciones internas y cómo fluye la información entre capas.",
      },
      {
        name: "Generación por difusión",
        role: "Explora alternativas a la generación token a token, como la difusión de texto.",
      },
    ],
  },
  {
    id: "training",
    label: "Entrenamiento y alineamiento",
    code: "EN",
    tone: "var(--purple)",
    origin: "1986 · retropropagación",
    description:
      "Cómo aprende el modelo: optimización por gradiente, preentrenamiento autosupervisado y post-entrenamiento con preferencias humanas (RLHF, DPO) o refuerzo verificable para razonar.",
    specialties: [
      {
        name: "Preentrenamiento",
        role: "Define mezcla de datos, objetivo y receta de optimización del modelo base.",
      },
      {
        name: "Post-entrenamiento",
        role: "Ajusta el comportamiento con instrucciones, RLHF, DPO o refuerzo con recompensas verificables.",
      },
      {
        name: "Datos y curaduría",
        role: "Filtra, deduplica y genera datos sintéticos; decide qué aprende el modelo.",
      },
      {
        name: "Evaluación",
        role: "Construye benchmarks y pruebas internas que detectan regresiones y contaminación.",
      },
    ],
  },
  {
    id: "scale",
    label: "Escalamiento y cómputo",
    code: "ES",
    tone: "var(--warn)",
    origin: "1997 · Deep Blue y hardware dedicado",
    description:
      "Datos, hardware y presupuesto: GPUs, leyes de escalado, contexto largo, entrenamiento distribuido y el costo por token que decide qué es viable en producción.",
    specialties: [
      {
        name: "Infraestructura de cómputo",
        role: "Opera clústeres de GPU/TPU, redes de alta velocidad y almacenamiento para entrenar.",
      },
      {
        name: "Entrenamiento distribuido",
        role: "Reparte modelos y datos entre miles de aceleradores (paralelismo de datos, tensores y expertos).",
      },
      {
        name: "Optimización de inferencia",
        role: "Cuantiza, agrupa peticiones y cachea para bajar latencia y costo por token.",
      },
      {
        name: "Economía del cómputo",
        role: "Estima presupuestos de entrenamiento y precio de servicio según leyes de escalado.",
      },
    ],
  },
  {
    id: "multimodal",
    label: "Percepción y multimodalidad",
    code: "MM",
    tone: "var(--info)",
    origin: "1989 · LeNet lee códigos postales",
    description:
      "Ver, oír y generar: visión por computadora, voz, generación de imágenes y video, y modelos que comparten una representación entre texto, imagen y audio.",
    specialties: [
      {
        name: "Visión por computadora",
        role: "Detección, segmentación y comprensión de documentos e imágenes.",
      },
      {
        name: "Voz y audio",
        role: "Reconocimiento y síntesis de voz, conversación en tiempo real.",
      },
      {
        name: "Generación de imagen y video",
        role: "Modelos de difusión y de video entrenados con pares texto-imagen.",
      },
      {
        name: "Modelos visión-lenguaje",
        role: "Alinean texto e imagen en un mismo espacio para razonar sobre lo que se ve.",
      },
    ],
  },
  {
    id: "agents",
    label: "Razonamiento y agentes",
    code: "RA",
    tone: "var(--danger)",
    origin: "1956 · programa simbólico de Dartmouth",
    description:
      "De la búsqueda simbólica y los sistemas expertos al refuerzo profundo, la cadena de pensamiento y los agentes que planifican, usan herramientas y operan computadoras.",
    specialties: [
      {
        name: "Ingeniería de agentes",
        role: "Diseña bucles de planificar-actuar-verificar con memoria y control de errores.",
      },
      {
        name: "Uso de herramientas y MCP",
        role: "Conecta modelos con APIs, archivos y servicios mediante protocolos estándar.",
      },
      {
        name: "Razonamiento y planificación",
        role: "Mejora la resolución de problemas con más cómputo en inferencia y refuerzo.",
      },
      {
        name: "Uso de computadora",
        role: "Permite al modelo ver pantallas y operar interfaces como lo haría una persona.",
      },
    ],
  },
  {
    id: "open",
    label: "Ecosistema abierto",
    code: "EA",
    tone: "var(--accent-2)",
    origin: "2015 · frameworks abiertos (TensorFlow, PyTorch)",
    description:
      "Frameworks, pesos y técnicas al alcance de cualquiera: de TensorFlow y PyTorch a LLaMA, Mistral, Qwen y DeepSeek, más el ajuste fino eficiente que permite ejecutar modelos en local.",
    specialties: [
      {
        name: "Modelos de pesos abiertos",
        role: "Publica pesos y reportes técnicos que la comunidad puede auditar y adaptar.",
      },
      {
        name: "Ajuste fino eficiente",
        role: "Adapta modelos grandes con LoRA/QLoRA en hardware modesto.",
      },
      {
        name: "Despliegue local",
        role: "Cuantiza y empaqueta modelos para correr en laptops, servidores propios o el borde.",
      },
      {
        name: "Comunidad y benchmarks",
        role: "Mantiene tablas abiertas, datasets y herramientas de evaluación reproducibles.",
      },
    ],
  },
  {
    id: "policy",
    label: "Sociedad, regulación y seguridad",
    code: "RS",
    tone: "var(--text-muted)",
    origin: "1950 · la pregunta de Turing",
    description:
      "Cómo se evalúa, gobierna y asegura la IA: desde el test de Turing y los informes que causaron inviernos hasta políticas de escalado responsable, el AI Act europeo y salvaguardas por dominio.",
    specialties: [
      {
        name: "Gobernanza y regulación",
        role: "Traduce riesgos en obligaciones legales, plazos y códigos de práctica.",
      },
      {
        name: "Seguridad de modelos",
        role: "Red teaming, evaluaciones de capacidades peligrosas y clasificadores de salvaguarda.",
      },
      {
        name: "Alineamiento",
        role: "Busca que los modelos sigan intenciones humanas y principios explícitos.",
      },
      {
        name: "Impacto social",
        role: "Estudia efectos en trabajo, ciencia y confianza pública.",
      },
    ],
  },
];

const ax = (id: string, author: string, title: string): MilestoneSource => ({
  title,
  author,
  url: `https://arxiv.org/abs/${id}`,
});

export const MILESTONES: Milestone[] = [
  // ── Fundamentos 1943–1969 ──────────────────────────────────────────────
  {
    id: "mcculloch-pitts",
    era: "fundamentos",
    branch: "arch",
    date: "1943",
    title: "Neurona lógica de McCulloch y Pitts",
    description:
      "Modelan la neurona como una unidad de umbral binaria y demuestran que redes de estas unidades pueden computar funciones lógicas.",
    impact:
      "Primer puente formal entre neurociencia y computación: origen de toda red neuronal.",
    sources: [
      {
        title: "A logical calculus of the ideas immanent in nervous activity",
        author: "McCulloch y Pitts, Bull. Math. Biophysics, 1943",
        url: "https://doi.org/10.1007/BF02478259",
      },
    ],
  },
  {
    id: "turing-test",
    era: "fundamentos",
    branch: "policy",
    date: "1950",
    title: "Turing propone el juego de imitación",
    description:
      "En «Computing Machinery and Intelligence» reemplaza «¿pueden pensar las máquinas?» por una prueba conversacional verificable.",
    impact:
      "Primer criterio operativo de evaluación y agenda de objeciones que sigue vigente.",
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
    era: "fundamentos",
    branch: "agents",
    date: "1956",
    title: "Taller de Dartmouth: nace la «inteligencia artificial»",
    description:
      "McCarthy, Minsky, Rochester y Shannon convocan un taller de verano bajo la conjetura de que todo aspecto del aprendizaje puede simularse.",
    impact:
      "Bautiza el campo y fija la agenda simbólica: lenguaje, abstracción y búsqueda.",
    sources: [
      {
        title: "A Proposal for the Dartmouth Summer Research Project on AI",
        author: "McCarthy, Minsky, Rochester y Shannon, 1955",
        url: "http://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf",
      },
    ],
  },
  {
    id: "perceptron",
    era: "fundamentos",
    branch: "arch",
    date: "1958",
    title: "Perceptrón de Rosenblatt",
    description:
      "Primera regla de aprendizaje para una neurona artificial: ajusta pesos a partir de ejemplos etiquetados. Se construye en hardware (Mark I).",
    impact:
      "Introduce la idea de que una máquina aprende de datos en vez de programarse.",
    sources: [
      {
        title: "The perceptron: a probabilistic model for information storage",
        author: "F. Rosenblatt, Psychological Review, 1958",
        url: "https://doi.org/10.1037/h0042519",
      },
    ],
  },
  {
    id: "expert-systems",
    era: "fundamentos",
    branch: "agents",
    date: "1965",
    title: "DENDRAL y los sistemas expertos",
    description:
      "En Stanford se codifica conocimiento de químicos como reglas si-entonces; después MYCIN lo aplica al diagnóstico médico.",
    impact:
      "Primera vía comercial de la IA y prueba del valor del conocimiento de dominio.",
    sources: [
      {
        title: "Expert system",
        author: "Encyclopaedia Britannica",
        url: "https://www.britannica.com/technology/expert-system",
      },
    ],
  },
  {
    id: "eliza",
    era: "fundamentos",
    branch: "policy",
    date: "1966",
    title: "ELIZA y el efecto ELIZA",
    description:
      "Weizenbaum crea un programa de patrones que simula un terapeuta; los usuarios le atribuyen comprensión que no tiene.",
    impact:
      "Primera advertencia sobre antropomorfizar sistemas conversacionales.",
    sources: [
      {
        title:
          "ELIZA — a computer program for the study of natural language communication",
        author: "J. Weizenbaum, Communications of the ACM, 1966",
        url: "https://doi.org/10.1145/365153.365168",
      },
    ],
  },
  {
    id: "perceptrons-book",
    era: "fundamentos",
    branch: "arch",
    date: "1969",
    title: "«Perceptrons» de Minsky y Papert",
    description:
      "Demuestran los límites del perceptrón de una capa (no resuelve XOR) y enfrían el interés en redes neuronales por más de una década.",
    impact: "Muestra que hacía falta profundidad y un método para entrenarla.",
    sources: [
      {
        title: "Perceptrons: An Introduction to Computational Geometry",
        author: "Minsky y Papert, MIT Press, 1969",
        url: "https://mitpress.mit.edu/9780262630221/perceptrons/",
      },
    ],
  },
  // ── Inviernos 1970–1993 ────────────────────────────────────────────────
  {
    id: "lighthill",
    era: "inviernos",
    branch: "policy",
    date: "1973",
    title: "Informe Lighthill y primer invierno",
    description:
      "Una evaluación para el gobierno británico concluye que la IA no escala fuera de problemas de juguete; caen los fondos en Reino Unido y EE. UU.",
    impact: "Enseña el costo de prometer más de lo que la técnica entrega.",
    sources: [
      {
        title: "Artificial Intelligence: A General Survey",
        author: "J. Lighthill, Science Research Council, 1973",
        url: "https://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm",
      },
    ],
  },
  {
    id: "hopfield",
    era: "inviernos",
    branch: "arch",
    date: "1982",
    title: "Redes de Hopfield",
    description:
      "Una red recurrente con energía que almacena patrones y los recupera a partir de versiones incompletas: memoria asociativa.",
    impact:
      "Reconecta física estadística y redes neuronales; base del Nobel de Física 2024.",
    sources: [
      {
        title:
          "Neural networks and physical systems with emergent collective computational abilities",
        author: "J. J. Hopfield, PNAS, 1982",
        url: "https://doi.org/10.1073/pnas.79.8.2554",
      },
    ],
  },
  {
    id: "backpropagation",
    era: "inviernos",
    branch: "training",
    date: "1986",
    title: "Retropropagación",
    description:
      "Rumelhart, Hinton y Williams muestran cómo propagar el error hacia atrás para entrenar capas ocultas.",
    impact: "Motor de entrenamiento de todo el deep learning actual.",
    sources: [
      {
        title: "Learning representations by back-propagating errors",
        author: "Rumelhart, Hinton y Williams, Nature, 1986",
        url: "https://www.nature.com/articles/323533a0",
      },
    ],
  },
  {
    id: "second-winter",
    era: "inviernos",
    branch: "policy",
    date: "1987",
    title: "Segundo invierno de la IA",
    description:
      "Colapsa el mercado de máquinas Lisp y los sistemas expertos resultan caros de mantener; la financiación vuelve a caer hasta inicios de los 90.",
    impact: "El campo se refugia en métodos estadísticos acotados y medibles.",
    sources: [
      {
        title: "AI winter (recopilación con referencias primarias)",
        author: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/AI_winter",
      },
    ],
  },
  {
    id: "lenet",
    era: "inviernos",
    branch: "multimodal",
    date: "1989",
    title: "LeNet: convoluciones entrenadas con backprop",
    description:
      "LeCun entrena una red convolucional para leer códigos postales manuscritos; pesos compartidos y campos receptivos locales.",
    impact: "Plantilla de la visión por computadora moderna.",
    sources: [
      {
        title: "Backpropagation Applied to Handwritten Zip Code Recognition",
        author: "LeCun et al., Neural Computation, 1989",
        url: "https://doi.org/10.1162/neco.1989.1.4.541",
      },
    ],
  },
  {
    id: "q-learning",
    era: "inviernos",
    branch: "training",
    date: "1992",
    title: "Q-learning",
    description:
      "Watkins y Dayan prueban la convergencia de un método que aprende el valor de cada acción solo con recompensas.",
    impact:
      "Fundamento del refuerzo profundo (DQN, AlphaGo) y del RL usado hoy para razonar.",
    sources: [
      {
        title: "Q-learning",
        author: "Watkins y Dayan, Machine Learning, 1992",
        url: "https://doi.org/10.1007/BF00992698",
      },
    ],
  },
  // ── Estadístico 1994–2011 ──────────────────────────────────────────────
  {
    id: "svm",
    era: "estadistico",
    branch: "training",
    date: "1995",
    title: "Máquinas de vectores de soporte",
    description:
      "Cortes y Vapnik formalizan clasificadores de margen máximo con kernels; dominan el aprendizaje automático por una década.",
    impact:
      "Consolida la teoría estadística del aprendizaje y la evaluación rigurosa.",
    sources: [
      {
        title: "Support-vector networks",
        author: "Cortes y Vapnik, Machine Learning, 1995",
        url: "https://doi.org/10.1007/BF00994018",
      },
    ],
  },
  {
    id: "lstm",
    era: "estadistico",
    branch: "arch",
    date: "1997",
    title: "LSTM",
    description:
      "Hochreiter y Schmidhuber añaden compuertas y una celda de memoria a las RNN para conservar información a largo plazo.",
    impact:
      "Arquitectura dominante de voz y traducción hasta la llegada del Transformer.",
    sources: [
      {
        title: "Long Short-Term Memory",
        author: "Hochreiter y Schmidhuber, Neural Computation, 1997",
        url: "https://doi.org/10.1162/neco.1997.9.8.1735",
      },
    ],
  },
  {
    id: "deep-blue",
    era: "estadistico",
    branch: "scale",
    date: "1997-05-11",
    title: "Deep Blue derrota a Kasparov",
    description:
      "Hardware dedicado que evalúa ~200 millones de posiciones por segundo gana 3.5–2.5 al campeón mundial de ajedrez.",
    impact: "Prueba el poder de la búsqueda masiva en dominios cerrados.",
    sources: [
      {
        title: "Deep Blue",
        author: "IBM Heritage",
        url: "https://www.ibm.com/history/deep-blue",
      },
    ],
  },
  {
    id: "deep-belief-nets",
    era: "estadistico",
    branch: "training",
    date: "2006",
    title: "Redes de creencia profunda",
    description:
      "Hinton, Osindero y Teh entrenan redes profundas capa por capa con preentrenamiento no supervisado.",
    impact:
      "Reaviva el interés por la profundidad: nace la etiqueta «deep learning».",
    sources: [
      {
        title: "A Fast Learning Algorithm for Deep Belief Nets",
        author: "Hinton, Osindero y Teh, Neural Computation, 2006",
        url: "https://doi.org/10.1162/neco.2006.18.7.1527",
      },
    ],
  },
  {
    id: "gpu-learning",
    era: "estadistico",
    branch: "scale",
    date: "2009",
    title: "GPUs para aprendizaje profundo",
    description:
      "Raina, Madhavan y Ng muestran aceleraciones de hasta 70× entrenando redes en GPUs frente a CPUs.",
    impact: "Abre la puerta al cómputo masivo barato que hizo posible AlexNet.",
    sources: [
      {
        title:
          "Large-scale deep unsupervised learning using graphics processors",
        author: "Raina, Madhavan y Ng, ICML 2009",
        url: "https://doi.org/10.1145/1553374.1553486",
      },
    ],
  },
  {
    id: "imagenet",
    era: "estadistico",
    branch: "scale",
    date: "2009",
    title: "ImageNet",
    description:
      "Deng, Fei-Fei Li y colegas publican millones de imágenes etiquetadas en miles de categorías; desde 2010 se usa como competencia anual.",
    impact:
      "Demuestra que los datos a escala son tan decisivos como los algoritmos.",
    sources: [
      {
        title: "ImageNet: A large-scale hierarchical image database",
        author: "Deng et al., CVPR 2009",
        url: "https://ieeexplore.ieee.org/document/5206848",
      },
    ],
  },
  {
    id: "watson",
    era: "estadistico",
    branch: "agents",
    date: "2011-02",
    title: "IBM Watson gana Jeopardy!",
    description:
      "Un sistema de preguntas y respuestas con cientos de componentes estadísticos vence a campeones humanos en televisión.",
    impact:
      "Muestra el potencial del procesamiento de lenguaje a escala, y sus límites fuera del juego.",
    sources: [
      {
        title: "Building Watson: An Overview of the DeepQA Project",
        author: "Ferrucci et al., AI Magazine, 2010",
        url: "https://doi.org/10.1609/aimag.v31i3.2303",
      },
    ],
  },
  // ── Deep learning 2012–2016 ────────────────────────────────────────────
  {
    id: "alexnet",
    era: "deep-learning",
    branch: "multimodal",
    date: "2012",
    title: "AlexNet gana ImageNet",
    description:
      "Una red convolucional de ocho capas entrenada en dos GPUs baja el error top-5 a 15.3% frente a 26.2% del segundo lugar.",
    impact: "Inicia la era del deep learning y convierte a la GPU en estándar.",
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
    id: "word2vec",
    era: "deep-learning",
    branch: "arch",
    date: "2013-01",
    title: "word2vec: palabras como vectores",
    description:
      "Mikolov y colegas aprenden embeddings densos donde la aritmética captura relaciones (rey − hombre + mujer ≈ reina).",
    impact:
      "Las representaciones aprendidas reemplazan a las características manuales en NLP.",
    sources: [
      ax(
        "1301.3781",
        "Mikolov et al., 2013",
        "Efficient Estimation of Word Representations in Vector Space",
      ),
    ],
  },
  {
    id: "dqn",
    era: "deep-learning",
    branch: "agents",
    date: "2013-12",
    title: "DQN aprende a jugar Atari",
    description:
      "DeepMind combina Q-learning con una red convolucional que ve píxeles y supera a humanos en varios juegos.",
    impact: "Nace el aprendizaje por refuerzo profundo.",
    sources: [
      ax(
        "1312.5602",
        "Mnih et al., 2013",
        "Playing Atari with Deep Reinforcement Learning",
      ),
      {
        title: "Human-level control through deep reinforcement learning",
        author: "Mnih et al., Nature, 2015",
        url: "https://www.nature.com/articles/nature14236",
      },
    ],
  },
  {
    id: "gan",
    era: "deep-learning",
    branch: "multimodal",
    date: "2014-06",
    title: "Redes generativas adversarias (GAN)",
    description:
      "Goodfellow y colegas enfrentan un generador y un discriminador; el juego produce imágenes cada vez más realistas.",
    impact: "Primer salto de la IA generativa visual.",
    sources: [
      ax(
        "1406.2661",
        "Goodfellow et al., 2014",
        "Generative Adversarial Networks",
      ),
    ],
  },
  {
    id: "seq2seq-attention",
    era: "deep-learning",
    branch: "arch",
    date: "2014-09",
    title: "Seq2seq y atención",
    description:
      "Sutskever et al. traducen con codificador-decodificador LSTM; Bahdanau et al. añaden atención para mirar cualquier parte de la entrada.",
    impact: "La atención nace aquí, tres años antes del Transformer.",
    sources: [
      ax(
        "1409.3215",
        "Sutskever, Vinyals y Le, 2014",
        "Sequence to Sequence Learning with Neural Networks",
      ),
      ax(
        "1409.0473",
        "Bahdanau, Cho y Bengio, 2014",
        "Neural Machine Translation by Jointly Learning to Align and Translate",
      ),
    ],
  },
  {
    id: "adam",
    era: "deep-learning",
    branch: "training",
    date: "2014-12",
    title: "Optimizador Adam",
    description:
      "Kingma y Ba combinan momento y tasas de aprendizaje adaptativas por parámetro.",
    impact:
      "Optimizador por defecto de casi todos los modelos grandes (y su variante AdamW).",
    sources: [
      ax(
        "1412.6980",
        "Kingma y Ba, 2014",
        "Adam: A Method for Stochastic Optimization",
      ),
    ],
  },
  {
    id: "distillation",
    era: "deep-learning",
    branch: "training",
    date: "2015-03",
    title: "Destilación de conocimiento",
    description:
      "Hinton, Vinyals y Dean entrenan un modelo pequeño para imitar las probabilidades de uno grande.",
    impact:
      "Base de los modelos pequeños y baratos que heredan capacidades de los grandes.",
    sources: [
      ax(
        "1503.02531",
        "Hinton, Vinyals y Dean, 2015",
        "Distilling the Knowledge in a Neural Network",
      ),
    ],
  },
  {
    id: "frameworks",
    era: "deep-learning",
    branch: "open",
    date: "2015-11",
    title: "TensorFlow y PyTorch abren el deep learning",
    description:
      "Google libera TensorFlow (2015) y Meta publica PyTorch (2016): diferenciación automática y GPU al alcance de cualquiera.",
    impact:
      "Democratiza la investigación y acelera la reproducción de resultados.",
    sources: [
      ax(
        "1603.04467",
        "Abadi et al., 2016",
        "TensorFlow: Large-Scale Machine Learning on Heterogeneous Systems",
      ),
      ax(
        "1912.01703",
        "Paszke et al., 2019",
        "PyTorch: An Imperative Style, High-Performance Deep Learning Library",
      ),
    ],
  },
  {
    id: "resnet",
    era: "deep-learning",
    branch: "arch",
    date: "2015-12",
    title: "ResNet: conexiones residuales",
    description:
      "He et al. entrenan redes de 152 capas sumando la entrada de cada bloque a su salida.",
    impact:
      "Las conexiones residuales están en cada capa de los Transformers actuales.",
    sources: [
      ax(
        "1512.03385",
        "He et al., 2015",
        "Deep Residual Learning for Image Recognition",
      ),
    ],
  },
  {
    id: "alphago",
    era: "deep-learning",
    branch: "agents",
    date: "2016-03",
    title: "AlphaGo vence a Lee Sedol",
    description:
      "Redes de política y valor más búsqueda Monte Carlo ganan 4–1 al campeón de Go; la jugada 37 se vuelve símbolo.",
    impact: "Redes + búsqueda + refuerzo superan un dominio «intuitivo».",
    sources: [
      {
        title:
          "Mastering the game of Go with deep neural networks and tree search",
        author: "Silver et al., Nature, 2016",
        url: "https://www.nature.com/articles/nature16961",
      },
    ],
  },
  // ── Transformer 2017–2021 ─────────────────────────────────────────────
  {
    id: "sparse-moe",
    era: "transformer",
    branch: "arch",
    date: "2017-01",
    title: "Mezcla de expertos dispersa (MoE)",
    description:
      "Shazeer et al. activan solo unos pocos «expertos» por token mediante un enrutador, logrando miles de millones de parámetros con cómputo acotado.",
    impact: "Idea central de Mixtral, DeepSeek-V3 y muchos modelos frontera.",
    sources: [
      ax(
        "1701.06538",
        "Shazeer et al., 2017",
        "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer",
      ),
    ],
  },
  {
    id: "transformer",
    era: "transformer",
    branch: "arch",
    date: "2017-06",
    title: "Transformer: «Attention Is All You Need»",
    description:
      "Vaswani et al. eliminan la recurrencia: autoatención multi-cabeza y codificación posicional permiten entrenar en paralelo.",
    impact:
      "Base de BERT, GPT, Claude, Gemini, Llama y casi todo modelo moderno.",
    sources: [
      ax("1706.03762", "Vaswani et al., 2017", "Attention Is All You Need"),
      {
        title: "The Annotated Transformer",
        author: "Harvard NLP",
        url: "https://nlp.seas.harvard.edu/annotated-transformer/",
      },
    ],
  },
  {
    id: "rl-human-preferences",
    era: "transformer",
    branch: "training",
    date: "2017-06",
    title: "Refuerzo desde preferencias humanas",
    description:
      "Christiano et al. entrenan un modelo de recompensa con comparaciones humanas y optimizan una política contra él.",
    impact: "Semilla del RLHF que luego convirtió modelos base en asistentes.",
    sources: [
      ax(
        "1706.03741",
        "Christiano et al., 2017",
        "Deep Reinforcement Learning from Human Preferences",
      ),
    ],
  },
  {
    id: "gpt-1",
    era: "transformer",
    branch: "training",
    date: "2018-06",
    title: "GPT: preentrenamiento generativo",
    description:
      "OpenAI preentrena un Transformer decodificador prediciendo la siguiente palabra y luego lo ajusta a tareas.",
    impact:
      "Establece la receta preentrenar-y-ajustar con modelos autoregresivos.",
    sources: [
      {
        title: "Improving Language Understanding by Generative Pre-Training",
        author: "Radford et al., OpenAI, 2018",
        url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
      },
    ],
  },
  {
    id: "bert",
    era: "transformer",
    branch: "open",
    date: "2018-10",
    title: "BERT",
    description:
      "Google preentrena un codificador bidireccional enmascarando palabras y publica código y pesos.",
    impact:
      "Domina NLP durante años y populariza los pesos abiertos reutilizables.",
    sources: [
      ax(
        "1810.04805",
        "Devlin et al., 2018",
        "BERT: Pre-training of Deep Bidirectional Transformers",
      ),
    ],
  },
  {
    id: "gpt-2",
    era: "transformer",
    branch: "policy",
    date: "2019-02",
    title: "GPT-2 y la publicación escalonada",
    description:
      "Un modelo de 1.5 mil millones de parámetros genera texto coherente; OpenAI lo publica por etapas citando riesgos de uso indebido.",
    impact: "Primer gran debate sobre publicación responsable de modelos.",
    sources: [
      {
        title: "Language Models are Unsupervised Multitask Learners",
        author: "Radford et al., OpenAI, 2019",
        url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
      },
    ],
  },
  {
    id: "scaling-laws",
    era: "transformer",
    branch: "scale",
    date: "2020-01",
    title: "Leyes de escalado",
    description:
      "Kaplan et al. muestran que la pérdida cae como ley de potencia con parámetros, datos y cómputo.",
    impact: "Convierte el escalado en estrategia predecible de inversión.",
    sources: [
      ax(
        "2001.08361",
        "Kaplan et al., 2020",
        "Scaling Laws for Neural Language Models",
      ),
    ],
  },
  {
    id: "gpt-3",
    era: "transformer",
    branch: "scale",
    date: "2020-05",
    title: "GPT-3 y el aprendizaje few-shot",
    description:
      "175 mil millones de parámetros: resuelve tareas nuevas con unos pocos ejemplos en el prompt.",
    impact: "El prompting emerge como nueva interfaz de programación.",
    sources: [
      ax(
        "2005.14165",
        "Brown et al., 2020",
        "Language Models are Few-Shot Learners",
      ),
    ],
  },
  {
    id: "ddpm",
    era: "transformer",
    branch: "multimodal",
    date: "2020-06",
    title: "Modelos de difusión (DDPM)",
    description:
      "Ho, Jain y Abbeel generan imágenes aprendiendo a quitar ruido paso a paso.",
    impact:
      "Desplaza a las GAN y fundamenta DALL·E 2, Stable Diffusion y los modelos de video.",
    sources: [
      ax(
        "2006.11239",
        "Ho, Jain y Abbeel, 2020",
        "Denoising Diffusion Probabilistic Models",
      ),
    ],
  },
  {
    id: "switch-transformer",
    era: "transformer",
    branch: "scale",
    date: "2021-01",
    title: "Switch Transformer",
    description:
      "Google lleva el MoE a más de un billón de parámetros enrutando cada token a un solo experto.",
    impact:
      "Prueba que la dispersión escala el tamaño sin escalar el costo por token.",
    sources: [
      ax(
        "2101.03961",
        "Fedus, Zoph y Shazeer, 2021",
        "Switch Transformers: Scaling to Trillion Parameter Models",
      ),
    ],
  },
  {
    id: "clip-dalle",
    era: "transformer",
    branch: "multimodal",
    date: "2021-01",
    title: "CLIP y DALL·E",
    description:
      "OpenAI alinea imágenes y texto con aprendizaje contrastivo (CLIP) y genera imágenes desde texto (DALL·E).",
    impact:
      "Texto e imagen comparten espacio: base de los modelos visión-lenguaje.",
    sources: [
      ax(
        "2103.00020",
        "Radford et al., 2021",
        "Learning Transferable Visual Models From Natural Language Supervision",
      ),
      ax(
        "2102.12092",
        "Ramesh et al., 2021",
        "Zero-Shot Text-to-Image Generation",
      ),
    ],
  },
  {
    id: "rope",
    era: "transformer",
    branch: "arch",
    date: "2021-04",
    title: "RoPE: posiciones rotatorias",
    description:
      "Su et al. codifican la posición rotando vectores de consulta y clave, lo que generaliza mejor a secuencias largas.",
    impact:
      "Estándar en Llama, Qwen y DeepSeek; base de las extensiones de contexto largo.",
    sources: [
      ax(
        "2104.09864",
        "Su et al., 2021",
        "RoFormer: Enhanced Transformer with Rotary Position Embedding",
      ),
    ],
  },
  {
    id: "lora",
    era: "transformer",
    branch: "open",
    date: "2021-06",
    title: "LoRA: ajuste fino de bajo rango",
    description:
      "Hu et al. congelan el modelo y entrenan matrices pequeñas añadidas: miles de veces menos parámetros entrenables.",
    impact: "Permite a la comunidad adaptar modelos grandes en una sola GPU.",
    sources: [
      ax(
        "2106.09685",
        "Hu et al., 2021",
        "LoRA: Low-Rank Adaptation of Large Language Models",
      ),
    ],
  },
  {
    id: "codex",
    era: "transformer",
    branch: "agents",
    date: "2021-07",
    title: "Codex y la programación asistida",
    description:
      "OpenAI ajusta GPT con código público; impulsa GitHub Copilot y crea el benchmark HumanEval.",
    impact:
      "El código se vuelve el primer gran caso de uso profesional de los LLM.",
    sources: [
      ax(
        "2107.03374",
        "Chen et al., 2021",
        "Evaluating Large Language Models Trained on Code",
      ),
    ],
  },
  {
    id: "foundation-models",
    era: "transformer",
    branch: "policy",
    date: "2021-08",
    title: "«Modelos fundacionales»",
    description:
      "Stanford CRFM acuña el término y analiza oportunidades y riesgos de modelos base adaptables.",
    impact: "Da vocabulario común a investigadores y reguladores.",
    sources: [
      ax(
        "2108.07258",
        "Bommasani et al., 2021",
        "On the Opportunities and Risks of Foundation Models",
      ),
    ],
  },
  // ── Generativa 2022–2023 ──────────────────────────────────────────────
  {
    id: "chain-of-thought",
    era: "generativa",
    branch: "agents",
    date: "2022-01",
    title: "Cadena de pensamiento",
    description:
      "Wei et al. muestran que pedir pasos intermedios mejora mucho el razonamiento matemático y lógico.",
    impact: "Antecedente directo de los modelos de razonamiento.",
    sources: [
      ax(
        "2201.11903",
        "Wei et al., 2022",
        "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
      ),
    ],
  },
  {
    id: "instructgpt",
    era: "generativa",
    branch: "training",
    date: "2022-03",
    title: "InstructGPT y RLHF",
    description:
      "Un modelo de 1.3 mil millones ajustado con instrucciones y RLHF es preferido frente a GPT-3 de 175 mil millones.",
    impact: "La receta de post-entrenamiento detrás de ChatGPT.",
    sources: [
      ax(
        "2203.02155",
        "Ouyang et al., 2022",
        "Training language models to follow instructions with human feedback",
      ),
    ],
  },
  {
    id: "chinchilla",
    era: "generativa",
    branch: "scale",
    date: "2022-03",
    title: "Chinchilla: escalado compute-óptimo",
    description:
      "DeepMind muestra que los modelos estaban subentrenados: con el mismo cómputo conviene menos parámetros y más tokens.",
    impact: "Redefine el reparto parámetros/datos de toda la industria.",
    sources: [
      ax(
        "2203.15556",
        "Hoffmann et al., 2022",
        "Training Compute-Optimal Large Language Models",
      ),
    ],
  },
  {
    id: "flashattention",
    era: "generativa",
    branch: "scale",
    date: "2022-05",
    title: "FlashAttention",
    description:
      "Dao et al. reorganizan el cálculo de la atención según la memoria de la GPU: exacta, más rápida y con menos memoria.",
    impact: "Hace viables contextos largos y entrenamiento más barato.",
    sources: [
      ax(
        "2205.14135",
        "Dao et al., 2022",
        "FlashAttention: Fast and Memory-Efficient Exact Attention",
      ),
    ],
  },
  {
    id: "stable-diffusion",
    era: "generativa",
    branch: "open",
    date: "2022-08",
    title: "Stable Diffusion con pesos abiertos",
    description:
      "La difusión latente comprime imágenes antes de difundir y se publica con pesos abiertos; corre en GPUs de consumo.",
    impact: "Explosión de herramientas y comunidad de generación de imágenes.",
    sources: [
      ax(
        "2112.10752",
        "Rombach et al., 2021",
        "High-Resolution Image Synthesis with Latent Diffusion Models",
      ),
      {
        title: "Stable Diffusion Public Release",
        author: "Stability AI, 2022",
        url: "https://stability.ai/news/stable-diffusion-public-release",
      },
    ],
  },
  {
    id: "whisper",
    era: "generativa",
    branch: "multimodal",
    date: "2022-09",
    title: "Whisper",
    description:
      "OpenAI entrena reconocimiento de voz con 680 000 horas de audio débilmente supervisado y publica los pesos.",
    impact: "Transcripción multilingüe robusta al alcance de todos.",
    sources: [
      ax(
        "2212.04356",
        "Radford et al., 2022",
        "Robust Speech Recognition via Large-Scale Weak Supervision",
      ),
    ],
  },
  {
    id: "react",
    era: "generativa",
    branch: "agents",
    date: "2022-10",
    title: "ReAct: razonar y actuar",
    description:
      "Yao et al. intercalan pensamientos y llamadas a herramientas en un mismo bucle.",
    impact: "Patrón base de los agentes con herramientas.",
    sources: [
      ax(
        "2210.03629",
        "Yao et al., 2022",
        "ReAct: Synergizing Reasoning and Acting in Language Models",
      ),
    ],
  },
  {
    id: "chatgpt",
    era: "generativa",
    branch: "training",
    date: "2022-11-30",
    title: "ChatGPT",
    description:
      "OpenAI abre al público un asistente conversacional entrenado con RLHF; alcanza unos 100 millones de usuarios en semanas.",
    impact: "La IA generativa pasa del laboratorio a la vida cotidiana.",
    sources: [
      {
        title: "Introducing ChatGPT",
        author: "OpenAI, 2022",
        url: "https://openai.com/index/chatgpt/",
      },
    ],
  },
  {
    id: "constitutional-ai",
    era: "generativa",
    branch: "policy",
    date: "2022-12",
    title: "IA constitucional",
    description:
      "Anthropic entrena un asistente inofensivo usando principios escritos y retroalimentación de IA (RLAIF).",
    impact: "Alineamiento con reglas explícitas y auditables.",
    sources: [
      ax(
        "2212.08073",
        "Bai et al., 2022",
        "Constitutional AI: Harmlessness from AI Feedback",
      ),
    ],
  },
  {
    id: "llama",
    era: "generativa",
    branch: "open",
    date: "2023-02-24",
    title: "LLaMA y la ola de pesos abiertos",
    description:
      "Meta publica modelos de 7 a 65 mil millones entrenados con datos públicos; sus pesos circulan y nace un ecosistema de derivados.",
    impact: "Inicio de la carrera de modelos abiertos competitivos.",
    sources: [
      ax(
        "2302.13971",
        "Touvron et al., 2023",
        "LLaMA: Open and Efficient Foundation Language Models",
      ),
    ],
  },
  {
    id: "gpt-4",
    era: "generativa",
    branch: "multimodal",
    date: "2023-03-14",
    title: "GPT-4",
    description:
      "Modelo multimodal (texto e imagen de entrada) con desempeño de nivel humano en muchos exámenes profesionales.",
    impact: "Nuevo techo de capacidad y referencia para toda la industria.",
    sources: [ax("2303.08774", "OpenAI, 2023", "GPT-4 Technical Report")],
  },
  {
    id: "dpo-qlora",
    era: "generativa",
    branch: "training",
    date: "2023-05",
    title: "DPO y QLoRA",
    description:
      "DPO alinea con preferencias sin modelo de recompensa ni RL; QLoRA ajusta modelos de 65 mil millones en una GPU con 4 bits.",
    impact: "Alineamiento y ajuste fino baratos para laboratorios pequeños.",
    sources: [
      ax(
        "2305.18290",
        "Rafailov et al., 2023",
        "Direct Preference Optimization",
      ),
      ax(
        "2305.14314",
        "Dettmers et al., 2023",
        "QLoRA: Efficient Finetuning of Quantized LLMs",
      ),
    ],
  },
  {
    id: "claude-2",
    era: "generativa",
    branch: "scale",
    date: "2023-07-11",
    title: "Claude 2 y el contexto de 100K tokens",
    description:
      "Anthropic lanza Claude 2 con ventana de 100 000 tokens, suficiente para leer libros o bases de código completas.",
    impact: "El contexto largo se vuelve criterio de compra.",
    sources: [
      {
        title: "Claude 2",
        author: "Anthropic, 2023",
        url: "https://www.anthropic.com/news/claude-2",
      },
      {
        title: "Introducing 100K Context Windows",
        author: "Anthropic, 2023",
        url: "https://www.anthropic.com/news/100k-context-windows",
      },
    ],
  },
  {
    id: "llama-2",
    era: "generativa",
    branch: "open",
    date: "2023-07-18",
    title: "Llama 2 con licencia comercial",
    description:
      "Meta publica modelos base y chat de hasta 70 mil millones con licencia que permite uso comercial.",
    impact: "Las empresas pueden construir sobre pesos abiertos.",
    sources: [
      ax(
        "2307.09288",
        "Touvron et al., 2023",
        "Llama 2: Open Foundation and Fine-Tuned Chat Models",
      ),
    ],
  },
  {
    id: "rsp",
    era: "generativa",
    branch: "policy",
    date: "2023-09-19",
    title: "Política de escalado responsable",
    description:
      "Anthropic define niveles de seguridad (ASL) que condicionan entrenar y desplegar modelos según sus capacidades.",
    impact:
      "Modelo de compromisos voluntarios adoptado luego por otros laboratorios.",
    sources: [
      {
        title: "Anthropic's Responsible Scaling Policy",
        author: "Anthropic, 2023",
        url: "https://www.anthropic.com/news/anthropics-responsible-scaling-policy",
      },
    ],
  },
  {
    id: "bletchley",
    era: "generativa",
    branch: "policy",
    date: "2023-11-01",
    title: "Declaración de Bletchley",
    description:
      "28 países y la UE firman en la primera cumbre de seguridad de IA un reconocimiento común de riesgos de la IA de frontera.",
    impact: "Primer consenso intergubernamental sobre seguridad de IA.",
    sources: [
      {
        title: "The Bletchley Declaration",
        author: "Gobierno del Reino Unido, 2023",
        url: "https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration",
      },
    ],
  },
  {
    id: "mamba",
    era: "generativa",
    branch: "arch",
    date: "2023-12",
    title: "Mamba: modelos de espacio de estados selectivos",
    description:
      "Gu y Dao proponen un SSM con parámetros dependientes de la entrada: costo lineal en la longitud y sin caché KV creciente.",
    impact: "Alternativa seria a la atención; base de los modelos híbridos.",
    sources: [
      ax(
        "2312.00752",
        "Gu y Dao, 2023",
        "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
      ),
    ],
  },
  {
    id: "gemini",
    era: "generativa",
    branch: "multimodal",
    date: "2023-12-06",
    title: "Gemini: multimodal desde el origen",
    description:
      "Google DeepMind presenta una familia entrenada conjuntamente con texto, imagen, audio y video.",
    impact: "La multimodalidad nativa se vuelve el estándar de frontera.",
    sources: [
      ax(
        "2312.11805",
        "Gemini Team, 2023",
        "Gemini: A Family of Highly Capable Multimodal Models",
      ),
    ],
  },
  {
    id: "mixtral",
    era: "generativa",
    branch: "open",
    date: "2023-12-11",
    title: "Mixtral 8x7B: MoE abierto",
    description:
      "Mistral AI publica un modelo de mezcla de expertos con ~13 mil millones de parámetros activos por token y licencia Apache 2.0.",
    impact: "Lleva el MoE al ecosistema abierto.",
    sources: [
      {
        title: "Mixtral of experts",
        author: "Mistral AI, 2023",
        url: "https://mistral.ai/news/mixtral-of-experts",
      },
      ax("2401.04088", "Jiang et al., 2024", "Mixtral of Experts"),
    ],
  },
  // ── Razonamiento 2024–2025 ────────────────────────────────────────────
  {
    id: "gemini-1-5",
    era: "razonamiento",
    branch: "scale",
    date: "2024-02",
    title: "Gemini 1.5 y el millón de tokens",
    description:
      "Google muestra recuperación casi perfecta en contextos de hasta 1 millón de tokens (10M en investigación) con arquitectura MoE.",
    impact: "Horas de video o bases de código enteras caben en un prompt.",
    sources: [
      ax(
        "2403.05530",
        "Gemini Team, 2024",
        "Gemini 1.5: Unlocking multimodal understanding across millions of tokens",
      ),
    ],
  },
  {
    id: "claude-3",
    era: "razonamiento",
    branch: "multimodal",
    date: "2024-03-04",
    title: "Familia Claude 3",
    description:
      "Anthropic lanza Haiku, Sonnet y Opus con visión y 200K de contexto; Opus lidera varios benchmarks del momento.",
    impact: "Consolida la estructura de familias por tamaño y precio.",
    sources: [
      {
        title: "Introducing the next generation of Claude",
        author: "Anthropic, 2024",
        url: "https://www.anthropic.com/news/claude-3-family",
      },
    ],
  },
  {
    id: "jamba",
    era: "razonamiento",
    branch: "arch",
    date: "2024-03",
    title: "Jamba: híbrido Transformer-Mamba-MoE",
    description:
      "AI21 intercala capas de atención y Mamba con expertos, logrando 256K de contexto con poca memoria.",
    impact: "Primer híbrido SSM-atención de escala productiva.",
    sources: [
      ax(
        "2403.19887",
        "Lieber et al., 2024",
        "Jamba: A Hybrid Transformer-Mamba Language Model",
      ),
    ],
  },
  {
    id: "llama-3",
    era: "razonamiento",
    branch: "open",
    date: "2024-04-18",
    title: "Llama 3",
    description:
      "Meta entrena con unos 15 billones de tokens; en julio llega Llama 3.1 405B, el mayor modelo abierto de su momento.",
    impact: "Lo abierto se acerca a la frontera cerrada.",
    sources: [
      {
        title: "Introducing Meta Llama 3",
        author: "Meta AI, 2024",
        url: "https://ai.meta.com/blog/meta-llama-3/",
      },
    ],
  },
  {
    id: "gpt-4o",
    era: "razonamiento",
    branch: "multimodal",
    date: "2024-05-13",
    title: "GPT-4o: voz en tiempo real",
    description:
      "Un solo modelo procesa texto, audio e imagen de extremo a extremo con latencia conversacional.",
    impact: "Conversación por voz natural con un modelo de frontera.",
    sources: [
      {
        title: "Hello GPT-4o",
        author: "OpenAI, 2024",
        url: "https://openai.com/index/hello-gpt-4o/",
      },
    ],
  },
  {
    id: "deepseek-v2",
    era: "razonamiento",
    branch: "arch",
    date: "2024-05",
    title: "DeepSeek-V2: atención latente multi-cabeza (MLA)",
    description:
      "DeepSeek comprime claves y valores en un vector latente, reduciendo la caché KV ~93% respecto a su modelo anterior, junto con DeepSeekMoE.",
    impact:
      "Inferencia de contexto largo mucho más barata; se adopta ampliamente.",
    sources: [
      ax(
        "2405.04434",
        "DeepSeek-AI, 2024",
        "DeepSeek-V2: A Strong, Economical, and Efficient MoE Language Model",
      ),
    ],
  },
  {
    id: "claude-3-5-sonnet",
    era: "razonamiento",
    branch: "agents",
    date: "2024-06-20",
    title: "Claude 3.5 Sonnet",
    description:
      "Un modelo de tamaño medio supera a Opus en programación y estrena Artifacts para crear código y documentos en vivo.",
    impact: "Punto de partida de los asistentes de programación agénticos.",
    sources: [
      {
        title: "Claude 3.5 Sonnet",
        author: "Anthropic, 2024",
        url: "https://www.anthropic.com/news/claude-3-5-sonnet",
      },
    ],
  },
  {
    id: "eu-ai-act",
    era: "razonamiento",
    branch: "policy",
    date: "2024-08-01",
    title: "Entra en vigor el AI Act europeo",
    description:
      "Primera ley integral de IA basada en riesgo: prohibiciones, obligaciones para alto riesgo y reglas para modelos de propósito general, con aplicación escalonada.",
    impact: "Marco regulatorio de referencia mundial.",
    sources: [
      {
        title: "Reglamento (UE) 2024/1689",
        author: "EUR-Lex",
        url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      },
    ],
  },
  {
    id: "test-time-compute",
    era: "razonamiento",
    branch: "scale",
    date: "2024-08",
    title: "Escalar el cómputo en inferencia",
    description:
      "Snell et al. muestran que asignar más cómputo al responder puede rendir más que escalar parámetros.",
    impact: "Nuevo eje de escalado: pensar más tiempo por pregunta.",
    sources: [
      ax(
        "2408.03314",
        "Snell et al., 2024",
        "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters",
      ),
    ],
  },
  {
    id: "o1",
    era: "razonamiento",
    branch: "agents",
    date: "2024-09-12",
    title: "OpenAI o1: modelos que razonan",
    description:
      "Entrenado con refuerzo para producir una cadena de pensamiento larga antes de responder; salto en matemáticas y programación competitiva.",
    impact: "Inaugura la categoría de modelos de razonamiento.",
    sources: [
      {
        title: "Learning to Reason with LLMs",
        author: "OpenAI, 2024",
        url: "https://openai.com/index/learning-to-reason-with-llms/",
      },
    ],
  },
  {
    id: "qwen-2-5",
    era: "razonamiento",
    branch: "open",
    date: "2024-09-19",
    title: "Qwen2.5",
    description:
      "Alibaba publica una familia abierta de 0.5 a 72 mil millones, más variantes de código y matemáticas.",
    impact: "China se vuelve líder del ecosistema de pesos abiertos.",
    sources: [
      {
        title: "Qwen2.5: A Party of Foundation Models",
        author: "Qwen Team, 2024",
        url: "https://qwenlm.github.io/blog/qwen2.5/",
      },
    ],
  },
  {
    id: "nobel-2024",
    era: "razonamiento",
    branch: "policy",
    date: "2024-10",
    title: "Nobel de Física y Química para la IA",
    description:
      "Física: Hopfield y Hinton por las redes neuronales. Química: Hassabis y Jumper (AlphaFold) junto a Baker por el diseño de proteínas.",
    impact: "Reconocimiento científico máximo del aprendizaje profundo.",
    sources: [
      {
        title: "Nobel Prize in Physics 2024",
        author: "NobelPrize.org",
        url: "https://www.nobelprize.org/prizes/physics/2024/summary/",
      },
      {
        title: "Nobel Prize in Chemistry 2024",
        author: "NobelPrize.org",
        url: "https://www.nobelprize.org/prizes/chemistry/2024/summary/",
      },
    ],
  },
  {
    id: "computer-use",
    era: "razonamiento",
    branch: "agents",
    date: "2024-10-22",
    title: "Uso de computadora",
    description:
      "Claude 3.5 Sonnet actualizado puede ver capturas de pantalla, mover el cursor y escribir para operar interfaces.",
    impact: "Los agentes pasan de APIs a cualquier software con pantalla.",
    sources: [
      {
        title:
          "Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku",
        author: "Anthropic, 2024",
        url: "https://www.anthropic.com/news/3-5-models-and-computer-use",
      },
    ],
  },
  {
    id: "mcp",
    era: "razonamiento",
    branch: "agents",
    date: "2024-11-25",
    title: "Model Context Protocol (MCP)",
    description:
      "Anthropic publica un protocolo abierto para conectar modelos con herramientas, datos y servicios de forma estándar.",
    impact: "Se adopta en toda la industria como «USB-C» de los agentes.",
    sources: [
      {
        title: "Introducing the Model Context Protocol",
        author: "Anthropic, 2024",
        url: "https://www.anthropic.com/news/model-context-protocol",
      },
      {
        title: "Model Context Protocol",
        author: "modelcontextprotocol.io",
        url: "https://modelcontextprotocol.io/",
      },
    ],
  },
  {
    id: "deepseek-v3",
    era: "razonamiento",
    branch: "scale",
    date: "2024-12",
    title: "DeepSeek-V3: frontera con presupuesto acotado",
    description:
      "MoE de 671 mil millones (37 mil millones activos) con MLA, entrenamiento FP8 y predicción multi-token; reporta ~2.8 millones de horas H800.",
    impact: "Cuestiona cuánto cómputo hace falta para llegar a la frontera.",
    sources: [
      ax("2412.19437", "DeepSeek-AI, 2024", "DeepSeek-V3 Technical Report"),
    ],
  },
  {
    id: "deepseek-r1",
    era: "razonamiento",
    branch: "training",
    date: "2025-01-20",
    title: "DeepSeek-R1: razonamiento por refuerzo, abierto",
    description:
      "Razonamiento emergente con RL a gran escala (GRPO) y recompensas verificables; pesos abiertos con licencia MIT y modelos destilados.",
    impact: "Democratiza los modelos de razonamiento y sacude a los mercados.",
    sources: [
      ax(
        "2501.12948",
        "DeepSeek-AI, 2025",
        "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL",
      ),
    ],
  },
  {
    id: "llada",
    era: "razonamiento",
    branch: "arch",
    date: "2025-02",
    title: "Difusión de texto a escala (LLaDA)",
    description:
      "Un modelo de lenguaje de 8 mil millones genera desenmascarando tokens en paralelo en vez de izquierda a derecha.",
    impact: "Abre la vía de LLM por difusión, más rápidos en generación.",
    sources: [
      ax("2502.09992", "Nie et al., 2025", "Large Language Diffusion Models"),
    ],
  },
  {
    id: "gemini-2-5",
    era: "razonamiento",
    branch: "agents",
    date: "2025-03-25",
    title: "Gemini 2.5: modelos que piensan",
    description:
      "Google integra el razonamiento en su modelo principal con contexto de 1M tokens.",
    impact: "El «thinking» se vuelve parte del modelo por defecto.",
    sources: [
      {
        title: "Gemini 2.5: Our most intelligent AI model",
        author: "Google, 2025",
        url: "https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/",
      },
    ],
  },
  {
    id: "llama-4",
    era: "razonamiento",
    branch: "open",
    date: "2025-04-05",
    title: "Llama 4: MoE multimodal abierto",
    description:
      "Meta publica Scout y Maverick, sus primeros modelos MoE nativamente multimodales.",
    impact: "Los grandes abiertos adoptan MoE como norma.",
    sources: [
      {
        title: "The Llama 4 herd",
        author: "Meta AI, 2025",
        url: "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
      },
    ],
  },
  {
    id: "o3",
    era: "razonamiento",
    branch: "agents",
    date: "2025-04-16",
    title: "o3 y o4-mini: razonar con herramientas",
    description:
      "Los modelos de razonamiento usan búsqueda, Python e imágenes dentro de su cadena de pensamiento.",
    impact: "Razonamiento y acción se funden en un mismo bucle.",
    sources: [
      {
        title: "Introducing OpenAI o3 and o4-mini",
        author: "OpenAI, 2025",
        url: "https://openai.com/index/introducing-o3-and-o4-mini/",
      },
    ],
  },
  {
    id: "qwen3",
    era: "razonamiento",
    branch: "open",
    date: "2025-04-29",
    title: "Qwen3: pensamiento híbrido",
    description:
      "Familia abierta densa y MoE con modo de pensamiento activable por petición.",
    impact: "Razonamiento controlable en modelos abiertos.",
    sources: [
      {
        title: "Qwen3: Think Deeper, Act Faster",
        author: "Qwen Team, 2025",
        url: "https://qwenlm.github.io/blog/qwen3/",
      },
      ax("2505.09388", "Qwen Team, 2025", "Qwen3 Technical Report"),
    ],
  },
  {
    id: "claude-4",
    era: "razonamiento",
    branch: "agents",
    date: "2025-05-22",
    title: "Claude 4 (Opus 4 y Sonnet 4)",
    description:
      "Modelos orientados a tareas agénticas largas y programación; Claude Code llega a disponibilidad general.",
    impact: "Agentes de código que trabajan durante horas.",
    sources: [
      {
        title: "Introducing Claude 4",
        author: "Anthropic, 2025",
        url: "https://www.anthropic.com/news/claude-4",
      },
    ],
  },
  {
    id: "kimi-k2",
    era: "razonamiento",
    branch: "open",
    date: "2025-07-11",
    title: "Kimi K2",
    description:
      "Moonshot AI publica un MoE abierto de 1 billón de parámetros (32 mil millones activos) orientado a agentes.",
    impact: "Modelos abiertos de escala billón para uso agéntico.",
    sources: [
      {
        title: "Kimi K2: Open Agentic Intelligence",
        author: "Moonshot AI, 2025",
        url: "https://moonshotai.github.io/Kimi-K2/",
      },
    ],
  },
  {
    id: "gpai-obligations",
    era: "razonamiento",
    branch: "policy",
    date: "2025-08-02",
    title: "Obligaciones del AI Act para modelos de propósito general",
    description:
      "Empiezan a aplicarse transparencia, documentación técnica y derechos de autor para proveedores de modelos GPAI.",
    impact:
      "Los modelos de frontera quedan sujetos a obligaciones legales en la UE.",
    sources: [
      {
        title: "Reglamento (UE) 2024/1689, art. 113",
        author: "EUR-Lex",
        url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      },
    ],
  },
  {
    id: "gpt-oss",
    era: "razonamiento",
    branch: "open",
    date: "2025-08-05",
    title: "gpt-oss: OpenAI vuelve a los pesos abiertos",
    description:
      "Modelos de razonamiento MoE de 120 y 20 mil millones con licencia Apache 2.0.",
    impact: "Primeros pesos abiertos de OpenAI desde GPT-2.",
    sources: [
      {
        title: "Introducing gpt-oss",
        author: "OpenAI, 2025",
        url: "https://openai.com/index/introducing-gpt-oss/",
      },
    ],
  },
  {
    id: "gpt-5",
    era: "razonamiento",
    branch: "agents",
    date: "2025-08-07",
    title: "GPT-5",
    description:
      "Sistema unificado que decide cuándo responder rápido y cuándo razonar a fondo.",
    impact:
      "El enrutamiento entre modos se vuelve transparente para el usuario.",
    sources: [
      {
        title: "Introducing GPT-5",
        author: "OpenAI, 2025",
        url: "https://openai.com/index/introducing-gpt-5/",
      },
    ],
  },
  {
    id: "claude-sonnet-4-5",
    era: "razonamiento",
    branch: "agents",
    date: "2025-09-29",
    title: "Claude Sonnet 4.5",
    description:
      "Modelo centrado en programación y uso de computadora, con el Claude Agent SDK para construir agentes propios.",
    impact: "Herramientas de agente de producción para desarrolladores.",
    sources: [
      {
        title: "Introducing Claude Sonnet 4.5",
        author: "Anthropic, 2025",
        url: "https://www.anthropic.com/news/claude-sonnet-4-5",
      },
    ],
  },
  {
    id: "gemini-3",
    era: "razonamiento",
    branch: "multimodal",
    date: "2025-11-18",
    title: "Gemini 3",
    description:
      "Google lanza Gemini 3 Pro en vista previa, integrado desde el primer día en la app, AI Studio y el modo IA de la Búsqueda.",
    impact: "Fuerte avance en razonamiento multimodal y agentes.",
    sources: [
      {
        title: "Gemini 3",
        author: "Google, 2025",
        url: "https://blog.google/products/gemini/gemini-3/",
      },
    ],
  },
  {
    id: "claude-opus-4-5",
    era: "razonamiento",
    branch: "agents",
    date: "2025-11-24",
    title: "Claude Opus 4.5",
    description:
      "Opus más capaz en programación, agentes y uso de computadora, con precio por token mucho menor.",
    impact: "La gama alta se abarata para tareas agénticas.",
    sources: [
      {
        title: "Introducing Claude Opus 4.5",
        author: "Anthropic, 2025",
        url: "https://www.anthropic.com/news/claude-opus-4-5",
      },
    ],
  },
  // ── Frontera 2026 ─────────────────────────────────────────────────────
  {
    id: "claude-opus-4-6",
    era: "frontera-2026",
    branch: "agents",
    date: "2026-02-05",
    title: "Claude Opus 4.6",
    description:
      "Primer Opus con ventana de 1M tokens (beta) y equipos de agentes en paralelo dentro de Claude Code.",
    impact: "Trabajo agéntico coordinado entre varios agentes.",
    sources: [
      {
        title: "Introducing Claude Opus 4.6",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-opus-4-6",
      },
    ],
  },
  {
    id: "mythos-preview",
    era: "frontera-2026",
    branch: "policy",
    date: "2026-04",
    title: "Claude Mythos Preview (Project Glasswing)",
    description:
      "Primer modelo de clase Mythos, por encima de Opus, liberado de forma restringida a socios de ciberdefensa.",
    impact:
      "Despliegue controlado de capacidades sensibles antes de su disponibilidad general.",
    status: "por-verificar",
    sources: [
      {
        title:
          "Claude Fable 5 and Claude Mythos 5 (menciona Mythos Preview, abril)",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-fable-5-mythos-5",
      },
    ],
  },
  {
    id: "gpt-5-5",
    era: "frontera-2026",
    branch: "agents",
    date: "2026-04-23",
    title: "GPT-5.5",
    description:
      "OpenAI presenta un modelo base reentrenado orientado a programación agéntica, con 1M de contexto en la API.",
    impact: "Sigue la cadencia de versiones 5.x en menos de un año.",
    sources: [
      {
        title: "Introducing GPT-5.5",
        author: "OpenAI, 2026",
        url: "https://openai.com/index/introducing-gpt-5-5/",
      },
    ],
  },
  {
    id: "deepseek-v4",
    era: "frontera-2026",
    branch: "open",
    date: "2026-04-24",
    title: "DeepSeek-V4 (preview)",
    description:
      "Pesos abiertos de V4-Pro y V4-Flash, ambos MoE con contexto de 1M tokens.",
    impact: "El contexto de millón de tokens llega al ecosistema abierto.",
    sources: [
      {
        title: "DeepSeek-V4 Preview Release",
        author: "DeepSeek API Docs, 2026",
        url: "https://api-docs.deepseek.com/news/news260424",
      },
      {
        title: "DeepSeek-V4-Pro",
        author: "Hugging Face",
        url: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro",
      },
    ],
  },
  {
    id: "fable-5",
    era: "frontera-2026",
    branch: "scale",
    date: "2026-06-09",
    title: "Claude Fable 5 y Claude Mythos 5",
    description:
      "Un mismo modelo de clase Mythos en dos empaques: Fable 5 con salvaguardas para disponibilidad general y Mythos 5 para socios verificados de ciberdefensa.",
    impact:
      "Nueva gama por encima de Opus y salvaguardas diferenciadas por audiencia.",
    sources: [
      {
        title: "Claude Fable 5 and Claude Mythos 5",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-fable-5-mythos-5",
      },
    ],
  },
  {
    id: "sonnet-5",
    era: "frontera-2026",
    branch: "agents",
    date: "2026-06-30",
    title: "Claude Sonnet 5",
    description:
      "Nueva generación de la gama media que reduce la distancia con Opus.",
    impact: "Capacidad cercana a la gama alta a precio medio.",
    sources: [
      {
        title: "Introducing Claude Sonnet 5",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-sonnet-5",
      },
    ],
  },
  {
    id: "opus-5",
    era: "frontera-2026",
    branch: "agents",
    date: "2026-07-24",
    title: "Claude Opus 5",
    description:
      "Se acerca a la inteligencia de Fable 5 a la mitad del precio, según Anthropic.",
    impact: "La capacidad de frontera baja de precio en meses.",
    sources: [
      {
        title: "Introducing Claude Opus 5",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-opus-5",
      },
    ],
  },
  {
    id: "ai-omnibus",
    era: "frontera-2026",
    branch: "policy",
    date: "2026-07",
    title: "Ómnibus digital: el AI Act ajusta plazos",
    description:
      "La UE aprueba un paquete que aplaza obligaciones de sistemas de alto riesgo (Anexo III hacia dic-2027, según análisis legales); las reglas GPAI se mantienen.",
    impact:
      "Más tiempo para cumplir en alto riesgo; detalles por confirmar en el Diario Oficial.",
    status: "por-verificar",
    sources: [
      {
        title:
          "EU AI Act: key amendments adopted under Digital Omnibus package",
        author: "Loyens & Loeff, 2026",
        url: "https://www.loyensloeff.com/insights/news--events/news/eu-ai-act-key-amendments-adopted-under-digital-omnibus-package/",
      },
    ],
  },
  {
    id: "fable-5-1",
    era: "frontera-2026",
    branch: "scale",
    date: "2026-09",
    title: "Claude Fable 5.1 y Mythos 5.1",
    description:
      "Versión más barata y con menos falsos positivos de salvaguarda; Mythos 5.1 se limita a programas verificados de ciberseguridad y ciencias de la vida.",
    impact: "Salvaguardas más precisas sin perder capacidad.",
    sources: [
      {
        title: "Introducing Claude Fable 5.1 and Claude Mythos 5.1",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/claude-fable-and-mythos-5-1",
      },
    ],
  },
  {
    id: "opus-5-5",
    era: "frontera-2026",
    branch: "agents",
    date: "2026-09-22",
    title: "Claude Opus 5.5",
    description:
      "Primer modelo de la familia 5.5: rinde al nivel de Fable 5.1 en la mayoría de tareas a menor costo que Opus 5.",
    impact: "Lidera programación agéntica y trabajo de conocimiento.",
    sources: [
      {
        title: "Introducing Claude Opus 5.5",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-opus-5-5",
      },
    ],
  },
  {
    id: "sonnet-5-5",
    era: "frontera-2026",
    branch: "agents",
    date: "2026-09-28",
    title: "Claude Sonnet 5.5",
    description: "Mejora clara sobre Sonnet 5 en la gama media.",
    impact: "Gama media más rápida y barata por tarea.",
    sources: [
      {
        title: "Introducing Claude Sonnet 5.5",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-sonnet-5-5",
      },
    ],
  },
  {
    id: "haiku-5-5",
    era: "frontera-2026",
    branch: "scale",
    date: "2026-10-07",
    title: "Claude Haiku 5.5",
    description:
      "El modelo pequeño más rápido y capaz de Anthropic, pensado para alto volumen.",
    impact: "Baja el costo de tareas masivas y sub-agentes.",
    sources: [
      {
        title: "Introducing Claude Haiku 5.5",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/news/claude-haiku-5-5",
      },
    ],
  },
  {
    id: "fable-5-2",
    era: "frontera-2026",
    branch: "scale",
    date: "2026-11-09",
    title: "Claude Fable 5.2 y Mythos 5.2",
    description:
      "Mejoras en programación, razonamiento y visión, con salida más rápida y precios menores; Fable para todos con salvaguardas, Mythos para organizaciones verificadas.",
    impact: "Estado del arte de Anthropic a la fecha de esta cronología.",
    sources: [
      {
        title: "Introducing Claude Fable 5.2 and Claude Mythos 5.2",
        author: "Anthropic, 2026",
        url: "https://www.anthropic.com/claude-fable-and-mythos-5-2",
      },
    ],
  },
];

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "set",
  "oct",
  "nov",
  "dic",
];

export function milestoneYear(milestone: Pick<Milestone, "date">): number {
  return Number(milestone.date.slice(0, 4));
}

/** "2022-11-30" → "30 nov 2022"; "2022-11" → "nov 2022"; "1943" → "1943". */
export function formatMilestoneDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!month) return year;
  const label = MONTHS[Number(month) - 1] ?? month;
  return day ? `${Number(day)} ${label} ${year}` : `${label} ${year}`;
}

export function branchById(id: BranchId): Branch {
  const branch = BRANCHES.find((entry) => entry.id === id);
  if (!branch) throw new Error(`Unknown branch ${id}`);
  return branch;
}

/** Chronological order; ties keep authoring order. */
export function sortedMilestones(list: Milestone[] = MILESTONES): Milestone[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}

export function filterMilestones(
  list: Milestone[],
  branch: BranchId | "all",
  query: string,
): Milestone[] {
  const needle = query.trim().toLocaleLowerCase("es");
  return list.filter(
    (m) =>
      (branch === "all" || m.branch === branch) &&
      (!needle ||
        `${m.title} ${m.description} ${m.impact} ${m.date}`
          .toLocaleLowerCase("es")
          .includes(needle)),
  );
}

/** Page stats derived from the dataset — never typed by hand. */
export function timelineStats() {
  return {
    milestones: MILESTONES.length,
    eras: ERAS.length,
    branches: BRANCHES.length,
    specialties: BRANCHES.reduce((n, b) => n + b.specialties.length, 0),
    sources: MILESTONES.reduce((n, m) => n + m.sources.length, 0),
  };
}
