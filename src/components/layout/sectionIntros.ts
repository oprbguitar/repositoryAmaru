import type { Language } from "../../i18n/dictionary";
import type { NavGroupId } from "./navigation";

/**
 * The "learning layer": one short card per section that answers, in plain
 * words, what the visitor is looking at, why it matters and how to read it.
 * Three bullets maximum — this is orientation, not documentation.
 */
export type SectionIntro = {
  /** One sentence: what this section is. */
  what: string;
  /** Up to three "how to read it" hints. */
  tips: ReadonlyArray<string>;
  /** A single key concept explained, for newcomers. */
  concept?: { term: string; meaning: string };
};

export const GROUP_LABELS: Record<
  Language,
  Record<NavGroupId, { label: string; hint: string }>
> = {
  es: {
    discover: { label: "Descubrir", hint: "Qué pasó hoy en la IA" },
    understand: { label: "Entender", hint: "Cómo está organizado el campo" },
    build: { label: "Construir", hint: "Ponlo a trabajar" },
    mine: { label: "Mi espacio", hint: "Guardado en este navegador" },
    admin: { label: "Administración", hint: "Solo administrador" },
  },
  en: {
    discover: { label: "Discover", hint: "What happened in AI today" },
    understand: { label: "Understand", hint: "How the field is organised" },
    build: { label: "Build", hint: "Put it to work" },
    mine: { label: "My space", hint: "Saved in this browser" },
    admin: { label: "Administration", hint: "Administrator only" },
  },
};

const ES: Record<string, SectionIntro> = {
  "/today": {
    what: "El pulso del día: lo esencial de la IA en una sola pantalla.",
    tips: [
      "Empieza por las rutas de aprendizaje si eres nuevo.",
      "Los precios se expresan por millón de tokens.",
      "Cada cifra trae su fuente y su fecha.",
    ],
    concept: {
      term: "Token",
      meaning:
        "Trozo de texto (≈ ¾ de palabra) con el que un modelo lee y cobra.",
    },
  },
  "/news": {
    what: "Anuncios oficiales de laboratorios y prensa especializada, ordenados por fecha.",
    tips: [
      "Filtra por fuente para separar comunicados de prensa.",
      "El sello «oficial» indica que viene del propio laboratorio.",
    ],
  },
  "/research": {
    what: "Artículos científicos recientes sobre IA, desde índices académicos abiertos.",
    tips: [
      "Usa el filtro de tipo para ver solo preprints o revistas.",
      "Un preprint aún no pasó revisión por pares.",
    ],
    concept: {
      term: "Preprint",
      meaning: "Versión pública de un estudio antes de su revisión formal.",
    },
  },
  "/videos": {
    what: "Videos de canales de IA seleccionados, para aprender viendo.",
    tips: ["Reprodúcelos aquí mismo sin salir del observatorio."],
  },
  "/models": {
    what: "Encuentra el modelo adecuado para tu tarea y consulta su ficha al costado.",
    tips: [
      "Escribe lo que necesitas («código barato con contexto largo»).",
      "Selecciona un modelo: su ficha aparece en el panel derecho.",
      "Marca ★ para guardarlo en tus favoritos.",
    ],
    concept: {
      term: "Contexto",
      meaning:
        "Cuánto texto puede tener en cuenta el modelo a la vez, medido en tokens.",
    },
  },
  "/evolution": {
    what: "La historia de la IA como árbol: de dónde viene cada familia de modelos.",
    tips: [
      "Recorre la línea de tiempo o el árbol de ramas.",
      "Toca un hito para ver por qué fue importante.",
    ],
  },
  "/map": {
    what: "Dónde se crean los modelos: países, organizaciones y su peso global.",
    tips: [
      "Toca un país para ver sus modelos y laboratorios.",
      "El tamaño indica cantidad de modelos publicados.",
    ],
  },
  "/markets": {
    what: "La economía de la IA: acciones, precios de API y series macro.",
    tips: [
      "Las cotizaciones se refrescan cada minuto.",
      "Las proyecciones son referenciales, no consejo de inversión.",
    ],
  },
  "/in-action": {
    what: "La IA aplicada a tu profesión: casos reales, cómo resolverlos con IA comercial o local, planes en soles y qué PC necesitas.",
    tips: [
      "Escribe qué necesitas o elige tu profesión.",
      "Sube de nivel: consultar → investigar → automatizar → crear.",
      "Compara la ruta en la nube con la ruta local y privada.",
    ],
    concept: {
      term: "RAG",
      meaning:
        "La IA busca en tus documentos los fragmentos pertinentes antes de responder.",
    },
  },
  "/prompts": {
    what: "Aprende a pedirle cosas a la IA: cadenas de prompts, agentes y una IA gratuita para practicar.",
    tips: [
      "Elige una categoría y completa las variables.",
      "Prueba un paso con la IA gratuita (cupo diario).",
      "Descarga el resultado como archivo.",
    ],
    concept: {
      term: "Prompt",
      meaning:
        "La instrucción que le das al modelo. Mejor prompt, mejor respuesta.",
    },
  },
  "/open-local": {
    what: "IA abierta y local: modelos que puedes descargar y ejecutar en tu propia computadora, sin nube.",
    tips: [
      "«Open» = los pesos del modelo son públicos.",
      "«Local» = corre en tu equipo; tus datos no salen de él.",
      "Revisa cuánta memoria (VRAM/RAM) necesitas antes de descargar.",
    ],
    concept: {
      term: "Cuantización",
      meaning:
        "Comprimir un modelo (p. ej. Q4) para que entre en menos memoria con poca pérdida.",
    },
  },
  "/api-catalog": {
    what: "Las APIs de IA disponibles y ideas de proyecto para integrarlas en tus apps.",
    tips: [
      "Una API es la puerta para usar un modelo desde tu código.",
      "Filtra por tipo (texto, imagen, voz…) y abre la documentación oficial.",
    ],
    concept: {
      term: "API",
      meaning:
        "Servicio al que tu programa envía una petición y recibe la respuesta del modelo.",
    },
  },
  "/github": {
    what: "Repositorios de IA destacados en GitHub y tus propios proyectos.",
    tips: [
      "Abre un repositorio para leer su README y estructura.",
      "Las estrellas miden popularidad, no calidad.",
    ],
  },
  "/favorites": {
    what: "Lo que marcaste con ★. Se guarda solo en este navegador, sin cuenta.",
    tips: [
      "Si borras los datos del navegador, tus favoritos se pierden.",
      "No se envían a ningún servidor.",
    ],
  },
  "/providers": {
    what: "Directorio de proveedores: quién fabrica y quién hospeda cada modelo.",
    tips: ["Abre una tarjeta para comparar precios entre proveedores."],
  },
  "/developer-lab": {
    what: "Banco de pruebas con las claves del administrador para ejecutar proveedores reales.",
    tips: ["Cada ejecución consume crédito de API: úsalo con criterio."],
  },
  "/local-library": {
    what: "Documentos locales indexados y analizados por IA.",
    tips: ["Los archivos se procesan en el servidor del administrador."],
  },
  "/laboratory": {
    what: "Espacio personal del administrador para proyectos y experimentos.",
    tips: ["Usa «Proyecto aleatorio» para generar una idea en un clic."],
  },
};

const EN: Record<string, SectionIntro> = {
  "/today": {
    what: "Today's pulse: the essentials of AI on a single screen.",
    tips: [
      "New here? Start with the learning paths.",
      "Prices are per million tokens.",
      "Every figure carries its source and date.",
    ],
    concept: {
      term: "Token",
      meaning: "A chunk of text (≈ ¾ of a word) that models read and bill by.",
    },
  },
  "/news": {
    what: "Official lab announcements and specialised press, by date.",
    tips: [
      "Filter by source to separate releases from press.",
      "The “official” badge means it comes from the lab itself.",
    ],
  },
  "/research": {
    what: "Recent AI papers from open academic indexes.",
    tips: [
      "Use the type filter to see only preprints or journals.",
      "A preprint has not been peer reviewed yet.",
    ],
    concept: {
      term: "Preprint",
      meaning: "A public version of a study before formal review.",
    },
  },
  "/videos": {
    what: "Curated AI channels, to learn by watching.",
    tips: ["Play them right here without leaving the observatory."],
  },
  "/models": {
    what: "Find the right model for your task and read its sheet on the side.",
    tips: [
      "Describe what you need (“cheap coding, long context”).",
      "Select a model: its sheet opens in the right panel.",
      "Star ★ to save it to favourites.",
    ],
    concept: {
      term: "Context",
      meaning: "How much text the model can consider at once, in tokens.",
    },
  },
  "/evolution": {
    what: "AI history as a tree: where each model family comes from.",
    tips: [
      "Walk the timeline or the branch tree.",
      "Tap a milestone to see why it mattered.",
    ],
  },
  "/map": {
    what: "Where models are made: countries, organisations and their weight.",
    tips: [
      "Tap a country to see its models and labs.",
      "Size reflects the number of published models.",
    ],
  },
  "/markets": {
    what: "The economics of AI: stocks, API prices and macro series.",
    tips: [
      "Quotes refresh every minute.",
      "Forecasts are indicative, not investment advice.",
    ],
  },
  "/in-action": {
    what: "AI applied to your profession: real cases, how to solve them with commercial or local AI, plan prices in soles and the PC you need.",
    tips: [
      "Describe what you need or pick your profession.",
      "Level up: ask → research → automate → build.",
      "Compare the cloud route with the private local route.",
    ],
    concept: {
      term: "RAG",
      meaning:
        "The AI looks up the relevant passages in your documents before answering.",
    },
  },
  "/prompts": {
    what: "Learn to ask AI for things: prompt chains, agents and a free AI to practise.",
    tips: [
      "Pick a category and fill in the variables.",
      "Try a step with the free AI (daily quota).",
      "Download the result as a file.",
    ],
    concept: {
      term: "Prompt",
      meaning:
        "The instruction you give the model. Better prompt, better answer.",
    },
  },
  "/open-local": {
    what: "Open and local AI: models you can download and run on your own computer, no cloud.",
    tips: [
      "“Open” = the model weights are public.",
      "“Local” = it runs on your machine; your data stays there.",
      "Check the memory (VRAM/RAM) you need before downloading.",
    ],
    concept: {
      term: "Quantisation",
      meaning:
        "Compressing a model (e.g. Q4) so it fits in less memory with little loss.",
    },
  },
  "/api-catalog": {
    what: "Available AI APIs and project ideas to integrate them into your apps.",
    tips: [
      "An API is the door to use a model from your code.",
      "Filter by type (text, image, voice…) and open the official docs.",
    ],
    concept: {
      term: "API",
      meaning:
        "A service your program sends a request to and gets the model's answer back.",
    },
  },
  "/github": {
    what: "Notable AI repositories on GitHub and your own projects.",
    tips: [
      "Open a repository to read its README and structure.",
      "Stars measure popularity, not quality.",
    ],
  },
  "/favorites": {
    what: "What you starred ★. Stored only in this browser, no account.",
    tips: [
      "Clearing browser data removes your favourites.",
      "Nothing is sent to any server.",
    ],
  },
  "/providers": {
    what: "Provider directory: who builds and who hosts each model.",
    tips: ["Open a card to compare prices across providers."],
  },
  "/developer-lab": {
    what: "Testbench using the administrator's keys to run real providers.",
    tips: ["Every run spends API credit: use it wisely."],
  },
  "/local-library": {
    what: "Local documents indexed and analysed by AI.",
    tips: ["Files are processed on the administrator's server."],
  },
  "/laboratory": {
    what: "The administrator's personal space for projects and experiments.",
    tips: ["Use “Random project” to generate an idea in one click."],
  },
};

export function introFor(
  path: string,
  language: Language,
): SectionIntro | null {
  const table = language === "en" ? EN : ES;
  const key = Object.keys(table).find((prefix) => path.startsWith(prefix));
  return key ? (table[key] ?? null) : null;
}
