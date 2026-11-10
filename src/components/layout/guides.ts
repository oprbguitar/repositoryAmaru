/**
 * One short explanation per section, used by the guided tour (one card at a
 * time) and by the documentation panel. Plain text, no AI.
 */
export type SectionGuide = {
  path: string;
  title: string;
  purpose: string;
  steps: ReadonlyArray<string>;
};

export const SECTION_GUIDES: ReadonlyArray<SectionGuide> = [
  {
    path: "/today",
    title: "Hoy",
    purpose:
      "Resumen del día: modelos destacados, precios y novedades verificadas.",
    steps: [
      "Revisa la tabla de modelos y sus precios por millón de tokens.",
      "Toca una fila para ver su ficha.",
      "Las cifras vienen de fuentes públicas; si falta una, verás «no configurado».",
    ],
  },
  {
    path: "/providers",
    title: "Proveedores",
    purpose: "Quién fabrica cada modelo: empresas, país y catálogo.",
    steps: [
      "Abre una tarjeta para ver los modelos propios y los que hospeda.",
      "Compara precios por millón de tokens entre proveedores.",
    ],
  },
  {
    path: "/models",
    title: "Modelos",
    purpose: "Encuentra el modelo adecuado según lo que necesitas hacer.",
    steps: [
      "Escribe tu necesidad en lenguaje natural («código barato con contexto largo»).",
      "Filtra por capacidades; cada etiqueta explica de dónde sale.",
      "Marca con ★ los que quieras guardar.",
    ],
  },
  {
    path: "/prompts",
    title: "Prompts y agentes",
    purpose:
      "Cadenas de prompts paso a paso, sistemas agénticos y tu histórico de system prompts.",
    steps: [
      "En «Cadenas» elige una categoría y completa las variables.",
      "«Generador» arma un plan completo para el producto que elijas, sin gastar IA.",
      "Prueba un paso con la IA gratuita (cupo diario) o descárgalo en tu carpeta.",
    ],
  },
  {
    path: "/api-catalog",
    title: "APIs y proyectos",
    purpose: "Catálogo de APIs de IA y proyectos para integrarlas.",
    steps: [
      "Filtra por tipo de API.",
      "Abre la documentación oficial desde cada ficha.",
    ],
  },
  {
    path: "/evolution",
    title: "Evolución IA",
    purpose:
      "Línea de tiempo de la IA: hitos, ramas y conceptos que se conectan.",
    steps: [
      "Desplázate por las eras.",
      "Cambia a vista de árbol o grafo para ver relaciones.",
    ],
  },
  {
    path: "/developer-lab",
    title: "Laboratorio de APIs",
    purpose:
      "Banco de pruebas para comparar modelos con tus propias claves (solo administrador).",
    steps: [
      "El administrador configura las claves de cada proveedor.",
      "Ejecuta una consulta en vivo y compara costo, tiempo y respuesta.",
    ],
  },
  {
    path: "/open-local",
    title: "Open y local",
    purpose: "Modelos abiertos que puedes descargar y ejecutar en tu PC.",
    steps: [
      "Analiza un repositorio de Hugging Face y elige el paquete GGUF.",
      "Pulsa «Elegir carpeta»: tú decides dónde se guarda la descarga (Chrome o Edge).",
      "Las descargas grandes se pueden pausar y reanudar.",
    ],
  },
  {
    path: "/news",
    title: "Noticias",
    purpose: "Prensa y fuentes oficiales sobre IA, filtrables por fuente.",
    steps: [
      "Filtra por fuente o tipo.",
      "Abre la nota original para leerla completa.",
    ],
  },
  {
    path: "/research",
    title: "Investigación",
    purpose:
      "Papers de índices académicos abiertos (Crossref, Europe PMC, DBLP…).",
    steps: [
      "Busca por tema y filtra por tipo de evidencia.",
      "Abre el DOI para la fuente.",
    ],
  },
  {
    path: "/github",
    title: "GitHub",
    purpose: "Explora repositorios de IA por tema y lee sus README sin salir.",
    steps: [
      "Elige un tema en el menú lateral.",
      "Abre un repositorio para ver su ficha y archivos.",
    ],
  },
  {
    path: "/favorites",
    title: "Mis favoritos",
    purpose: "Todo lo que marcaste con ★, guardado en este navegador.",
    steps: ["Filtra por tipo.", "Quita la estrella para eliminarlo."],
  },
  {
    path: "/videos",
    title: "Videos",
    purpose: "Videos recientes sobre IA de canales seleccionados.",
    steps: [
      "Cambia entre plataformas.",
      "Reproduce sin cookies de seguimiento (modo privado de YouTube).",
    ],
  },
  {
    path: "/map",
    title: "Mapa",
    purpose: "Dónde se crean los modelos de lenguaje, por país y capa.",
    steps: ["Activa o desactiva capas.", "Toca un país para ver su panel."],
  },
  {
    path: "/markets",
    title: "Mercado IA",
    purpose: "Cotizaciones de empresas de IA y series macroeconómicas.",
    steps: [
      "Las cotizaciones se actualizan cada minuto si hay clave configurada.",
      "Las proyecciones están rotuladas como tales: no son recomendaciones de inversión.",
    ],
  },
  {
    path: "/local-library",
    title: "Biblioteca local",
    purpose: "Documentos indexados con búsqueda de texto completo.",
    steps: ["Busca por palabra.", "Abre un documento para ver su análisis."],
  },
  {
    path: "/laboratory",
    title: "Mi laboratorio",
    purpose: "Proyectos y recomendaciones de stack según tu idea.",
    steps: [
      "Revisa los proyectos guardados.",
      "Genera un proyecto aleatorio para inspirarte.",
    ],
  },
  {
    path: "/admin",
    title: "Administración",
    purpose:
      "Zona del administrador: claves de API, fuentes y límites de la IA gratuita.",
    steps: [
      "Inicia sesión con el usuario administrador.",
      "Las claves se guardan cifradas en el servidor y nunca se muestran de nuevo.",
      "Ajusta cuántas consultas gratuitas tiene cada visitante al día.",
    ],
  },
];

export function guideFor(pathname: string) {
  return (
    SECTION_GUIDES.find((guide) => pathname.startsWith(guide.path)) ?? null
  );
}
