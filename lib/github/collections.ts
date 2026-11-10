import type { QuerySpec } from "./types";

/**
 * Curated repository types. Every entry is a real GitHub search specification
 * (topics plus qualifiers); nothing here is a fabricated ranking.
 * Query semantics were checked against the live search API on this date.
 */
export const COLLECTIONS_VERIFIED_ON = "2026-11-09";

export type RepoType = {
  id: string;
  label: string;
  hint: string;
  spec: QuerySpec;
};

export type RepoGroup = {
  id: string;
  label: string;
  types: RepoType[];
};

function type(
  id: string,
  label: string,
  hint: string,
  anyTopics: string[],
  minStars = 50,
): RepoType {
  return { id, label, hint, spec: { anyTopics, minStars } };
}

export const REPO_GROUPS: RepoGroup[] = [
  {
    id: "design",
    label: "Diseño",
    types: [
      type(
        "design-systems",
        "Design systems y tokens",
        "Sistemas de diseño y design tokens.",
        ["design-system", "design-systems", "design-tokens"],
      ),
      type(
        "ui-kits",
        "UI kits y componentes",
        "Bibliotecas de componentes de interfaz.",
        ["ui-kit", "component-library", "ui-components", "react-components"],
      ),
      type("icons", "Iconos", "Librerías y sets de iconos SVG.", [
        "icons",
        "svg-icons",
        "icon-library",
        "icon-set",
        "icon-pack",
      ]),
      type(
        "typography",
        "Tipografía y fuentes",
        "Fuentes abiertas y herramientas tipográficas.",
        ["fonts", "typography", "font", "typeface"],
        20,
      ),
      type(
        "templates",
        "Plantillas web",
        "Landing pages y dashboards de administración.",
        [
          "website-template",
          "landing-page",
          "admin-template",
          "dashboard-template",
        ],
      ),
      type(
        "figma",
        "Figma y diseño a código",
        "Plugins de Figma y conversión de diseño a código.",
        ["figma", "figma-plugin", "design-to-code", "figma-to-code"],
        30,
      ),
      type(
        "css-frameworks",
        "Frameworks CSS",
        "Frameworks y utilidades de CSS.",
        ["css-framework", "tailwindcss", "css-library", "sass"],
      ),
      type(
        "motion",
        "Animación y motion",
        "Animaciones, transiciones y Lottie.",
        ["animation", "lottie", "motion", "framer-motion"],
      ),
    ],
  },
  {
    id: "science",
    label: "Información científica",
    types: [
      type(
        "datasets",
        "Datasets y datos abiertos",
        "Conjuntos de datos públicos.",
        ["dataset", "datasets", "open-data", "public-datasets"],
      ),
      type(
        "notebooks",
        "Notebooks",
        "Cuadernos Jupyter y análisis reproducibles.",
        ["jupyter-notebook", "jupyter", "notebooks", "colab"],
      ),
      type(
        "simulation",
        "Simulación y cómputo científico",
        "Simulación numérica y software científico.",
        [
          "simulation",
          "scientific-computing",
          "computational-science",
          "numerical-methods",
        ],
      ),
      type(
        "bioinformatics",
        "Bioinformática",
        "Genómica y biología computacional.",
        ["bioinformatics", "genomics", "computational-biology", "proteomics"],
        20,
      ),
      type(
        "climate",
        "Clima y ambiente",
        "Modelos y datos climáticos.",
        ["climate", "climate-change", "climate-data", "weather"],
        20,
      ),
      type(
        "geospatial",
        "Geoespacial y GIS",
        "Mapas, teledetección y análisis espacial.",
        ["gis", "geospatial", "remote-sensing", "openstreetmap"],
      ),
      type(
        "physics-astro",
        "Física y astronomía",
        "Física, astronomía y astrofísica.",
        ["physics", "astronomy", "astrophysics", "quantum-computing"],
        20,
      ),
    ],
  },
  {
    id: "data-ml",
    label: "Datos y ML",
    types: [
      type(
        "ml",
        "Machine learning y deep learning",
        "Frameworks y proyectos de ML.",
        [
          "machine-learning",
          "deep-learning",
          "neural-network",
          "pytorch",
          "tensorflow",
        ],
        500,
      ),
      type("mlops", "MLOps", "Despliegue y seguimiento de modelos.", [
        "mlops",
        "model-serving",
        "experiment-tracking",
        "feature-store",
      ]),
      type(
        "data-eng",
        "Ingeniería de datos",
        "ETL, orquestación y almacenes de datos.",
        ["data-engineering", "etl", "dbt", "data-pipeline", "airflow"],
      ),
      type(
        "dataviz",
        "Visualización de datos",
        "Gráficos, dashboards y mapas.",
        ["data-visualization", "charts", "dataviz", "visualization"],
      ),
      type(
        "vector",
        "Vectores y embeddings",
        "Bases vectoriales y búsqueda semántica.",
        ["vector-database", "embeddings", "semantic-search", "vector-search"],
      ),
    ],
  },
  {
    id: "agents",
    label: "Agentes y LLM",
    types: [
      type("agents", "Agentes de IA", "Frameworks y agentes autónomos.", [
        "ai-agents",
        "llm-agent",
        "agentic-ai",
        "agent-framework",
        "autonomous-agents",
      ]),
      type("rag", "RAG", "Generación aumentada por recuperación.", [
        "rag",
        "retrieval-augmented-generation",
        "knowledge-base",
        "document-qa",
      ]),
      type(
        "mcp",
        "MCP (Model Context Protocol)",
        "Servidores y clientes MCP.",
        ["mcp", "model-context-protocol", "mcp-server", "mcp-client"],
        20,
      ),
      type(
        "local-llm",
        "LLM locales",
        "Inferencia local de modelos abiertos.",
        ["ollama", "llama-cpp", "local-llm", "gguf", "llm-inference"],
      ),
      type("prompts", "Prompts y skills", "Ingeniería de prompts y skills.", [
        "prompt-engineering",
        "prompts",
        "agent-skills",
        "system-prompts",
      ]),
      type("llm-eval", "Evaluación de LLM", "Evals, trazas y monitoreo.", [
        "llm-evaluation",
        "llmops",
        "llm-observability",
        "evals",
      ]),
    ],
  },
  {
    id: "devtools",
    label: "Herramientas dev",
    types: [
      type(
        "cli",
        "CLI y terminal",
        "Herramientas de línea de comandos.",
        ["cli", "command-line", "terminal", "tui"],
        200,
      ),
      type("testing", "Pruebas", "Frameworks de pruebas y E2E.", [
        "testing",
        "e2e-testing",
        "test-automation",
        "unit-testing",
      ]),
      type("cicd", "CI/CD y DevOps", "Integración y despliegue continuos.", [
        "cicd",
        "devops",
        "github-actions",
        "continuous-integration",
      ]),
      type(
        "iac",
        "Infraestructura como código",
        "Terraform, Pulumi y afines.",
        ["infrastructure-as-code", "terraform", "pulumi", "kubernetes"],
      ),
      type(
        "linters",
        "Linters y formateadores",
        "Calidad y estilo de código.",
        ["linter", "formatter", "code-quality", "static-analysis"],
      ),
      type("observability", "Observabilidad", "Métricas, logs y trazas.", [
        "observability",
        "monitoring",
        "opentelemetry",
        "tracing",
      ]),
    ],
  },
  {
    id: "security",
    label: "Seguridad",
    types: [
      type(
        "security-tools",
        "Herramientas de seguridad",
        "Seguridad de aplicaciones e infraestructura.",
        ["security", "infosec", "cybersecurity", "security-tools"],
      ),
      type("pentest", "Pentesting y red team", "Seguridad ofensiva.", [
        "penetration-testing",
        "pentest",
        "red-team",
        "hacking",
      ]),
      type(
        "vuln",
        "Escáneres de vulnerabilidades",
        "SAST, SCA y dependencias.",
        [
          "vulnerability-scanner",
          "sast",
          "devsecops",
          "vulnerability-detection",
        ],
        20,
      ),
      type(
        "crypto-privacy",
        "Criptografía y privacidad",
        "Cifrado y gestión de secretos.",
        ["cryptography", "encryption", "privacy", "secrets-management"],
      ),
    ],
  },
  {
    id: "education",
    label: "Educación",
    types: [
      type(
        "learning",
        "Aprender a programar",
        "Tutoriales y recursos.",
        ["education", "learning", "tutorial", "learn-to-code"],
        500,
      ),
      type(
        "awesome",
        "Listas awesome",
        "Listas curadas de recursos.",
        ["awesome", "awesome-list"],
        500,
      ),
      type(
        "courses",
        "Cursos y currículos",
        "Cursos abiertos y planes de estudio.",
        ["course", "curriculum", "bootcamp", "lecture-notes"],
      ),
      type("interview", "Entrevistas técnicas", "Algoritmos y preparación.", [
        "interview-preparation",
        "interview-questions",
        "algorithms",
        "data-structures",
      ]),
    ],
  },
  {
    id: "apps",
    label: "Web y aplicaciones",
    types: [
      type(
        "frontend",
        "Frameworks frontend",
        "React, Vue, Svelte y similares.",
        ["frontend", "react", "vue", "svelte"],
        500,
      ),
      type(
        "backend",
        "Backend y APIs",
        "Frameworks de servidor y APIs.",
        ["backend", "rest-api", "graphql", "web-framework"],
        500,
      ),
      type(
        "starters",
        "Starters y boilerplates",
        "Plantillas iniciales de proyectos.",
        [
          "starter-template",
          "boilerplate",
          "starter-kit",
          "template-repository",
        ],
      ),
      type(
        "self-hosted",
        "Autoalojado",
        "Apps que puedes alojar tú mismo.",
        ["self-hosted", "selfhosted"],
        200,
      ),
    ],
  },
];

export function findRepoType(id: string): RepoType | null {
  for (const group of REPO_GROUPS)
    for (const item of group.types) if (item.id === id) return item;
  return null;
}

/**
 * Widely used GitHub topics (curated from github.com/topics; the order is
 * editorial, not a measured ranking). Each one is searchable as `topic:<name>`.
 */
export const INTERNATIONAL_TOPICS: string[] = [
  "javascript",
  "python",
  "react",
  "typescript",
  "nodejs",
  "java",
  "go",
  "rust",
  "docker",
  "kubernetes",
  "linux",
  "android",
  "ios",
  "flutter",
  "vue",
  "nextjs",
  "tailwindcss",
  "django",
  "api",
  "machine-learning",
  "deep-learning",
  "llm",
  "chatgpt",
  "openai",
  "awesome",
  "cli",
  "security",
  "database",
  "css",
  "automation",
  "data-science",
  "devops",
  "self-hosted",
  "nlp",
  "pytorch",
  "ollama",
  "rag",
  "mcp",
];
