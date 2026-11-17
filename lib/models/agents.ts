// Ready-to-use AI agents (coding / general purpose) and how they relate to
// models. Curated by hand from each project's public documentation and
// repository on 2026-11-16. "custody" says where the MODEL runs and who holds
// your prompts: the vendor's cloud, your machine, or either.

export type AgentCustody = "cloud" | "local" | "hybrid";

export type AgentInfo = {
  id: string;
  name: string;
  maker: string;
  license: string;
  openSource: boolean;
  custody: AgentCustody;
  interfaces: string[];
  /** One line: what it is for. */
  summary: string;
  /** What it can do. */
  abilities: string[];
  /** How it plans and coordinates work. */
  orchestration: string;
  /** Which models it talks to. */
  models: string;
  /** Can it run fully offline with a local model, and how. */
  offline: string;
  install: string;
  url: string;
};

export const AGENTS_CURATED_AT = "2026-11-16";

export const CUSTODY_LABELS: Record<AgentCustody, string> = {
  cloud: "Nube del proveedor",
  hybrid: "Nube o local",
  local: "Local / offline",
};

export const CUSTODY_HINTS: Record<AgentCustody, string> = {
  cloud:
    "El programa corre en tu PC, pero el modelo vive en los servidores del proveedor: tu código y tus prompts viajan a su nube (custodia del proveedor).",
  hybrid:
    "Puede usar modelos en la nube o un modelo local (Ollama, LM Studio, llama.cpp). Con un modelo local, nada sale de tu equipo.",
  local:
    "Pensado para trabajar con modelos en tu equipo; funciona sin internet una vez descargado el modelo.",
};

export const AGENTS: AgentInfo[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    maker: "Anthropic",
    license: "Propietaria",
    openSource: false,
    custody: "cloud",
    interfaces: ["Terminal", "VS Code / JetBrains", "Escritorio", "Web"],
    summary:
      "Agente de programación que lee tu repositorio, edita archivos, ejecuta comandos y abre PRs.",
    abilities: [
      "Edita varios archivos y ejecuta pruebas",
      "Subagentes para tareas en paralelo",
      "Hooks, skills y servidores MCP",
      "Integración con git y GitHub",
    ],
    orchestration:
      "Un agente principal en bucle pensar → usar herramienta → observar; delega en subagentes con contexto propio y pide permiso antes de acciones sensibles.",
    models:
      "Solo modelos Claude (Opus, Sonnet, Haiku) vía cuenta de Anthropic.",
    offline:
      "No. La herramienta es local, pero el modelo se ejecuta en la nube de Anthropic.",
    install: "npm install -g @anthropic-ai/claude-code",
    url: "https://docs.anthropic.com/en/docs/claude-code",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    maker: "Google",
    license: "Apache-2.0",
    openSource: true,
    custody: "cloud",
    interfaces: ["Terminal"],
    summary:
      "Agente de terminal de código abierto para programar, investigar y automatizar tareas.",
    abilities: [
      "Lee y edita el proyecto",
      "Búsqueda web integrada",
      "Servidores MCP",
    ],
    orchestration:
      "Bucle ReAct (razonar y actuar) con herramientas integradas y extensiones MCP.",
    models: "Modelos Gemini mediante cuenta de Google o clave de API.",
    offline:
      "No de forma oficial: el código es abierto, pero el modelo Gemini es de nube.",
    install: "npm install -g @google/gemini-cli",
    url: "https://github.com/google-gemini/gemini-cli",
  },
  {
    id: "codex-cli",
    name: "Codex CLI",
    maker: "OpenAI",
    license: "Apache-2.0",
    openSource: true,
    custody: "hybrid",
    interfaces: ["Terminal", "IDE"],
    summary:
      "Agente de programación de OpenAI, de código abierto, que trabaja en un sandbox local.",
    abilities: [
      "Edita archivos y ejecuta comandos en sandbox",
      "Modos de aprobación (sugerir, editar, autónomo)",
      "Servidores MCP",
    ],
    orchestration:
      "Un agente con herramientas de shell y edición; el sandbox limita red y escritura según el modo de aprobación.",
    models:
      "Modelos de OpenAI por defecto; con la opción --oss usa modelos abiertos servidos localmente (p. ej. gpt-oss con Ollama).",
    offline: "Sí, con «codex --oss» y un modelo local en Ollama o LM Studio.",
    install: "npm install -g @openai/codex",
    url: "https://github.com/openai/codex",
  },
  {
    id: "opencode",
    name: "OpenCode",
    maker: "SST (comunidad)",
    license: "MIT",
    openSource: true,
    custody: "hybrid",
    interfaces: ["Terminal (TUI)", "Escritorio", "IDE"],
    summary:
      "Agente de programación de código abierto que funciona con más de 75 proveedores, incluidos modelos locales.",
    abilities: [
      "Agentes «build» y «plan» intercambiables",
      "Subagentes configurables",
      "LSP para entender el código",
      "Servidores MCP",
    ],
    orchestration:
      "Agente principal con modos (plan solo lee, build edita) y subagentes definidos en archivos de configuración.",
    models:
      "Cualquiera: Claude, GPT, Gemini o modelos locales vía Ollama, LM Studio o un servidor compatible con OpenAI.",
    offline:
      "Sí, apuntando a un modelo local (Qwen Coder, Devstral, gpt-oss…) servido por Ollama o LM Studio.",
    install: "npm install -g opencode-ai",
    url: "https://opencode.ai",
  },
  {
    id: "aider",
    name: "Aider",
    maker: "Paul Gauthier (comunidad)",
    license: "Apache-2.0",
    openSource: true,
    custody: "hybrid",
    interfaces: ["Terminal"],
    summary:
      "Programación en pareja desde la terminal: cada cambio queda como un commit de git.",
    abilities: [
      "Mapa del repositorio para dar contexto",
      "Commits automáticos y deshacer",
      "Modo arquitecto + editor",
    ],
    orchestration:
      "Conversación dirigida por ti; en modo arquitecto un modelo planifica y otro aplica los cambios.",
    models:
      "Cualquiera vía LiteLLM: APIs comerciales u Ollama / LM Studio en local.",
    offline: "Sí, con «aider --model ollama_chat/<modelo>».",
    install: "python -m pip install aider-install && aider-install",
    url: "https://aider.chat",
  },
  {
    id: "goose",
    name: "Goose",
    maker: "Block",
    license: "Apache-2.0",
    openSource: true,
    custody: "hybrid",
    interfaces: ["Escritorio", "Terminal"],
    summary:
      "Agente general de código abierto que automatiza tareas de desarrollo y de escritorio con extensiones.",
    abilities: [
      "Extensiones MCP (archivos, navegador, APIs)",
      "Recetas reutilizables",
      "App de escritorio y CLI",
    ],
    orchestration:
      "Bucle de herramientas donde cada extensión MCP aporta capacidades; las recetas encadenan pasos repetibles.",
    models: "Cualquier proveedor compatible, incluido Ollama en local.",
    offline: "Sí, configurando Ollama como proveedor.",
    install: "Descarga la app desde block.github.io/goose",
    url: "https://block.github.io/goose",
  },
  {
    id: "openhands",
    name: "OpenHands",
    maker: "All Hands AI (comunidad)",
    license: "MIT",
    openSource: true,
    custody: "hybrid",
    interfaces: ["Web local", "Terminal"],
    summary:
      "Desarrollador autónomo que trabaja dentro de un contenedor Docker aislado.",
    abilities: [
      "Ejecuta código y navega en un sandbox",
      "Resuelve issues de punta a punta",
      "Interfaz web local",
    ],
    orchestration:
      "Arquitectura de eventos: el agente emite acciones (editar, ejecutar, navegar) y recibe observaciones del sandbox; admite delegación entre agentes.",
    models:
      "Cualquiera vía LiteLLM; en local necesita modelos grandes (≥ 24–32 B) para buenos resultados.",
    offline: "Sí, con un modelo servido por Ollama, LM Studio o vLLM.",
    install: "Contenedor Docker oficial (docker run … openhands)",
    url: "https://github.com/All-Hands-AI/OpenHands",
  },
  {
    id: "cline",
    name: "Cline",
    maker: "Cline (comunidad)",
    license: "Apache-2.0",
    openSource: true,
    custody: "hybrid",
    interfaces: ["VS Code"],
    summary:
      "Agente dentro de VS Code que planifica, edita y ejecuta con tu aprobación paso a paso.",
    abilities: [
      "Modos Plan y Act",
      "Usa el navegador para probar la app",
      "Servidores MCP",
    ],
    orchestration:
      "Plan propone la estrategia sin tocar archivos; Act ejecuta cada paso pidiendo aprobación.",
    models: "Cualquier proveedor, incluidos Ollama y LM Studio.",
    offline: "Sí, eligiendo Ollama o LM Studio como proveedor.",
    install: "Extensión «Cline» en el marketplace de VS Code",
    url: "https://github.com/cline/cline",
  },
];

/** Agents that can drive a model you run yourself (for a local model sheet). */
export function agentsForLocalModels(): AgentInfo[] {
  return AGENTS.filter((agent) => agent.custody !== "cloud");
}
