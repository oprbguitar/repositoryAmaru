/**
 * «IA en acción» — profesiones, especialidades y casos prácticos.
 * Cada caso describe una necesidad real (no un modelo) y su tipo de tarea
 * (`kind`), que decide qué herramientas se recomiendan en tools.ts. Los
 * prompts usan [campos] que el visitante completa antes de copiar.
 */
import type { OfficeApp, TaskKind } from "./tools";

export type PracticeCase = {
  id: string;
  title: string;
  kind: TaskKind;
  need: string;
  materials: string;
  output: string;
  prompt: string;
  /** Apps de oficina donde este caso se resuelve. */
  office?: ReadonlyArray<OfficeApp>;
  /** Datos personales o reservados: se recomienda IA local o anonimizar. */
  sensitive?: boolean;
  /** Advertencia profesional específica. */
  caution?: string;
  /** Modelo o recurso local especializado para este caso. */
  local?: string;
  /** Búsquedas de video cortas y puntuales (YouTube). */
  videos?: ReadonlyArray<string>;
};

export type Specialty = {
  id: string;
  label: string;
  cases: ReadonlyArray<PracticeCase>;
};

export type ProfessionGroup =
  | "salud"
  | "ingenieria"
  | "negocios"
  | "derecho"
  | "educacion"
  | "ciencia"
  | "tecnologia";

export type Profession = {
  id: string;
  label: string;
  group: ProfessionGroup;
  icon: string;
  summary: string;
  /** Fuentes oficiales que la IA debe usar como base (Perú). */
  sources: ReadonlyArray<string>;
  specialties: ReadonlyArray<Specialty>;
};

export const GROUPS: ReadonlyArray<{ id: ProfessionGroup; label: string }> = [
  { id: "salud", label: "Salud" },
  { id: "ingenieria", label: "Ingeniería y construcción" },
  { id: "negocios", label: "Negocios y gestión" },
  { id: "derecho", label: "Derecho y sector público" },
  { id: "educacion", label: "Educación y comunicación" },
  { id: "ciencia", label: "Ciencias y agro" },
  { id: "tecnologia", label: "Tecnología" },
];

const NO_DATA =
  "No inventes datos, cifras ni referencias: si algo no está en el material, dilo.";

export const PROFESSIONS: ReadonlyArray<Profession> = [
  /* ----------------------------- Salud ---------------------------------- */
  {
    id: "medicina",
    label: "Medicina",
    group: "salud",
    icon: "Stethoscope",
    summary:
      "Investigación clínica, salud pública, gestión y formación médica.",
    sources: [
      "PubMed / Europe PMC",
      "Guías de práctica clínica del Minsa",
      "CDC Perú",
      "Cochrane",
    ],
    specialties: [
      {
        id: "investigacion",
        label: "Investigación médica",
        cases: [
          {
            id: "matriz-evidencia",
            title: "Matriz de evidencia a partir de artículos",
            kind: "research",
            need: "Comparar estudios sobre un tema clínico sin leerlos todos de corrido.",
            materials: "Artículos en PDF (PubMed, Europe PMC, SciELO).",
            output:
              "Matriz: objetivo, diseño, población, hallazgos, limitaciones y cita.",
            prompt: `Actúa como asistente de investigación científica. Analiza los artículos que adjunto sobre [tema]. Para cada uno identifica objetivo, diseño, población, hallazgos principales y limitaciones. Presenta una matriz comparativa en tabla con la cita de cada estudio. Distingue la evidencia de tus inferencias. ${NO_DATA}`,
            caution:
              "La IA resume, no evalúa la calidad metodológica por ti: revisa con una herramienta como GRADE.",
            local:
              "MedGemma (Google) para investigación; requiere validación, no toma decisiones clínicas.",
          },
        ],
      },
      {
        id: "salud-publica",
        label: "Epidemiología y salud pública",
        cases: [
          {
            id: "boletin",
            title: "Boletín epidemiológico desde una base de casos",
            kind: "data",
            need: "Convertir una tabla de casos en indicadores y gráficos semanales.",
            materials: "CSV o Excel de notificaciones (sin nombres ni DNI).",
            output:
              "Tasas por distrito, curva epidémica y texto interpretativo.",
            prompt: `Tengo un archivo con casos de [enfermedad] por semana epidemiológica y distrito de [región]. Calcula casos por semana, tasa por 100 000 habitantes usando la población que te indico: [población]. Grafica la curva epidémica y redacta un párrafo de interpretación prudente. ${NO_DATA}`,
            office: ["excel"],
            sensitive: true,
            caution:
              "Anonimiza antes de subir: borra nombres, DNI y direcciones.",
          },
        ],
      },
      {
        id: "gestion",
        label: "Gestión hospitalaria",
        cases: [
          {
            id: "indicadores-hosp",
            title: "Tablero de ocupación y tiempos de espera",
            kind: "sheets",
            need: "Ver cada semana ocupación de camas, estancia media y espera en emergencia.",
            materials: "Exportes del sistema de admisión en Excel.",
            output: "Libro con tabla dinámica, indicadores y gráfico.",
            prompt: `En este Excel tengo ingresos y altas del hospital con columnas [columnas]. Crea fórmulas para ocupación de camas, estancia media y tiempo de espera en emergencia por servicio. Sugiere una tabla dinámica y un gráfico semanal.`,
            office: ["excel", "powerpoint"],
            videos: [
              "Copilot en Excel tabla dinámica en español",
              "Copilot Excel análisis de datos tutorial",
            ],
          },
        ],
      },
      {
        id: "formacion",
        label: "Formación médica",
        cases: [
          {
            id: "casos-simulados",
            title: "Casos clínicos simulados para estudiar",
            kind: "study",
            need: "Practicar razonamiento clínico con casos y preguntas.",
            materials: "Apuntes, capítulos de libro, guías docentes.",
            output:
              "Casos con preguntas, respuestas razonadas y referencias del material.",
            prompt: `Usa solo el material adjunto sobre [tema]. Crea [número] casos clínicos de dificultad [nivel] para estudiantes de medicina. Cada caso: presentación, preguntas de diagnóstico y manejo, respuesta razonada y la página del material que la respalda.`,
          },
        ],
      },
    ],
  },
  {
    id: "enfermeria",
    label: "Enfermería",
    group: "salud",
    icon: "HeartPulse",
    summary: "Planes de cuidado, educación al paciente y gestión de turnos.",
    sources: [
      "NANDA-NIC-NOC",
      "Normas técnicas del Minsa",
      "Colegio de Enfermeros del Perú",
    ],
    specialties: [
      {
        id: "cuidado",
        label: "Cuidado y procesos",
        cases: [
          {
            id: "pae",
            title: "Borrador de Proceso de Atención de Enfermería (PAE)",
            kind: "writing",
            need: "Estructurar un PAE de estudio con diagnósticos, objetivos e intervenciones.",
            materials: "Caso clínico anonimizado y taxonomía NANDA-NIC-NOC.",
            output:
              "PAE en tabla lista para revisar con el docente o jefe de servicio.",
            prompt: `A partir de este caso anonimizado: [caso], propone un PAE con valoración por dominios, diagnósticos NANDA, resultados NOC e intervenciones NIC. Indica los códigos y marca lo que debo verificar en la taxonomía oficial.`,
            office: ["word"],
            sensitive: true,
            caution:
              "Los códigos NANDA/NIC/NOC deben verificarse en la fuente oficial.",
          },
        ],
      },
      {
        id: "educacion-paciente",
        label: "Educación al paciente",
        cases: [
          {
            id: "folleto",
            title: "Folleto en lenguaje sencillo (o en quechua)",
            kind: "writing",
            need: "Explicar cuidados en casa con palabras simples.",
            materials: "Indicaciones médicas o norma técnica.",
            output:
              "Folleto de una página, también traducido a quechua para revisión.",
            prompt: `Convierte estas indicaciones: [indicaciones] en un folleto de una página para pacientes, con lenguaje de 6.º grado, viñetas y señales de alarma. Luego ofrece una versión en quechua [variante] marcada para revisión por un hablante nativo.`,
            office: ["word", "powerpoint"],
          },
        ],
      },
      {
        id: "gestion-turnos",
        label: "Gestión de servicio",
        cases: [
          {
            id: "rol-turnos",
            title: "Rol de turnos en Excel",
            kind: "sheets",
            need: "Armar el rol mensual respetando descansos y cobertura mínima.",
            materials: "Lista del personal, reglas del servicio.",
            output: "Plantilla de rol con validaciones y conteo de horas.",
            prompt: `Crea en Excel un rol de turnos para [número] enfermeras en [mes], turnos M/T/N, cobertura mínima de [n] por turno y descanso tras cada noche. Agrega fórmulas que cuenten horas por persona y marquen incumplimientos.`,
            office: ["excel"],
            videos: ["Copilot Excel crear horario de turnos"],
          },
        ],
      },
    ],
  },
  {
    id: "odontologia",
    label: "Odontología",
    group: "salud",
    icon: "Smile",
    summary: "Consulta, educación en salud bucal y gestión del consultorio.",
    sources: ["Colegio Odontológico del Perú", "PubMed"],
    specialties: [
      {
        id: "consultorio",
        label: "Gestión del consultorio",
        cases: [
          {
            id: "presupuestos",
            title: "Presupuestos y seguimiento de pacientes",
            kind: "sheets",
            need: "Llevar presupuestos de tratamiento, pagos parciales y citas de control.",
            materials: "Lista de tratamientos y precios.",
            output: "Libro Excel con presupuestos, saldos y recordatorios.",
            prompt: `Diseña un Excel para mi consultorio con hojas: Tratamientos (precio), Pacientes (código, no nombre completo), Presupuestos y Pagos. Calcula saldos pendientes y marca controles vencidos según [frecuencia].`,
            office: ["excel"],
            sensitive: true,
          },
        ],
      },
      {
        id: "salud-bucal",
        label: "Educación en salud bucal",
        cases: [
          {
            id: "charla-escolar",
            title: "Charla escolar de prevención",
            kind: "slides",
            need: "Preparar una presentación amigable para niños.",
            materials: "Guía de prevención y edad del público.",
            output: "10 diapositivas con notas del orador y una dinámica.",
            prompt: `Crea una presentación de 10 diapositivas sobre [tema] para niños de [edad] años, con lenguaje lúdico, una dinámica participativa y notas del orador.`,
            office: ["powerpoint"],
            videos: ["Copilot PowerPoint crear presentación desde cero"],
          },
        ],
      },
    ],
  },
  {
    id: "psicologia",
    label: "Psicología",
    group: "salud",
    icon: "Brain",
    summary: "Investigación, evaluación, intervención y psicoeducación.",
    sources: ["APA", "Colegio de Psicólogos del Perú", "SciELO"],
    specialties: [
      {
        id: "investigacion-psi",
        label: "Investigación y tesis",
        cases: [
          {
            id: "marco-teorico",
            title: "Mapa del marco teórico",
            kind: "research",
            need: "Ordenar teorías y antecedentes de una tesis.",
            materials: "Artículos, tesis de ALICIA/RENATI.",
            output: "Esquema de teorías, autores, variables y vacíos.",
            prompt: `Con las fuentes adjuntas sobre [variable], elabora un mapa del marco teórico: teorías, autores, año, dimensiones de la variable e instrumentos usados. Señala vacíos de investigación en el contexto peruano. Cita en APA 7. ${NO_DATA}`,
            office: ["word"],
          },
        ],
      },
      {
        id: "psicoeducacion",
        label: "Psicoeducación",
        cases: [
          {
            id: "taller",
            title: "Guion de taller psicoeducativo",
            kind: "writing",
            need: "Diseñar un taller con objetivos, dinámicas y evaluación.",
            materials: "Tema, público y duración.",
            output: "Guion por sesiones con materiales y evaluación.",
            prompt: `Diseña un taller de [número] sesiones sobre [tema] para [público]. Cada sesión: objetivo, dinámica de inicio, contenido, actividad y cierre. Incluye una evaluación pre/post sencilla.`,
            sensitive: true,
            caution:
              "Nunca subas historias clínicas o notas de sesión a un chat comercial: usa IA local o anonimiza.",
          },
        ],
      },
    ],
  },
  {
    id: "nutricion",
    label: "Nutrición",
    group: "salud",
    icon: "Apple",
    summary: "Planes alimentarios, educación nutricional y análisis de dietas.",
    sources: ["Tablas peruanas de composición de alimentos (CENAN/INS)", "OMS"],
    specialties: [
      {
        id: "planes",
        label: "Planes alimentarios",
        cases: [
          {
            id: "menu-semanal",
            title: "Menú semanal con alimentos locales",
            kind: "sheets",
            need: "Armar menús con calorías y macronutrientes usando alimentos peruanos.",
            materials:
              "Requerimiento calórico y tabla de composición del CENAN.",
            output: "Menú por días con cálculo de kcal y macros en Excel.",
            prompt: `Elabora un menú de 7 días de [kcal] kcal para [perfil], con alimentos accesibles en [región del Perú]. Usa la tabla de composición que adjunto para calcular kcal, proteínas, grasas y carbohidratos en Excel. ${NO_DATA}`,
            office: ["excel"],
          },
        ],
      },
    ],
  },
  {
    id: "farmacia",
    label: "Farmacia y bioquímica",
    group: "salud",
    icon: "Pill",
    summary:
      "Farmacovigilancia, interacciones, regulación sanitaria e inventario.",
    sources: [
      "DIGEMID",
      "Petitorio Nacional Único de Medicamentos",
      "EMA / FDA",
    ],
    specialties: [
      {
        id: "regulatorio",
        label: "Asuntos regulatorios",
        cases: [
          {
            id: "expediente-registro",
            title: "Lista de verificación de expediente de registro sanitario",
            kind: "research",
            need: "Saber qué documentos pide DIGEMID para un producto.",
            materials: "Normativa vigente de DIGEMID en PDF.",
            output: "Checklist con base normativa de cada requisito.",
            prompt: `A partir de la normativa adjunta de DIGEMID, elabora una lista de verificación para el registro sanitario de [tipo de producto]. Para cada requisito indica el artículo que lo exige. ${NO_DATA}`,
            caution:
              "Las normas cambian: confirma la versión vigente en el portal de DIGEMID.",
          },
        ],
      },
      {
        id: "inventario",
        label: "Gestión de botica",
        cases: [
          {
            id: "vencimientos",
            title: "Control de lotes y vencimientos",
            kind: "sheets",
            need: "Alertar productos próximos a vencer y rotación FEFO.",
            materials: "Inventario con lote y fecha de vencimiento.",
            output: "Excel con semáforo de vencimiento y reporte mensual.",
            prompt: `En mi inventario con columnas [columnas], crea formato condicional que marque en rojo lo que vence en menos de [días] días, una tabla de rotación FEFO y un resumen por laboratorio.`,
            office: ["excel"],
            videos: ["Copilot Excel formato condicional fechas"],
          },
        ],
      },
    ],
  },
  {
    id: "veterinaria",
    label: "Medicina veterinaria",
    group: "salud",
    icon: "PawPrint",
    summary:
      "Clínica de animales menores, producción pecuaria y sanidad animal.",
    sources: ["SENASA", "WOAH (OMSA)", "PubMed / CAB"],
    specialties: [
      {
        id: "pecuaria",
        label: "Producción pecuaria",
        cases: [
          {
            id: "registro-productivo",
            title: "Registro productivo de un hato",
            kind: "data",
            need: "Seguir producción de leche, partos y sanidad por animal.",
            materials: "Registros de campo en Excel.",
            output:
              "Indicadores de producción, intervalo entre partos y alertas sanitarias.",
            prompt: `Con este registro de [especie] con columnas [columnas], calcula producción promedio por animal, intervalo entre partos y vacunaciones pendientes según el calendario de SENASA que adjunto. Grafica la tendencia mensual.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "clinica",
        label: "Clínica de animales menores",
        cases: [
          {
            id: "indicaciones-dueno",
            title: "Indicaciones claras para el dueño",
            kind: "writing",
            need: "Explicar tratamiento y cuidados posoperatorios sin tecnicismos.",
            materials: "Receta y notas de la consulta.",
            output:
              "Hoja de indicaciones con horario de dosis y señales de alarma.",
            prompt: `Convierte esta receta: [receta] en una hoja para el dueño de [especie/nombre de mascota], con tabla de horarios de dosis, cuidados en casa y cuándo volver de urgencia.`,
            caution:
              "Verifica dosis y especie: la IA puede confundir posologías entre especies.",
          },
        ],
      },
    ],
  },

  /* ------------------------ Ingeniería y construcción --------------------- */
  {
    id: "civil",
    label: "Ingeniería civil",
    group: "ingenieria",
    icon: "HardHat",
    summary: "Metrados, presupuestos, normativa y control de obra.",
    sources: [
      "Reglamento Nacional de Edificaciones (RNE)",
      "Invierte.pe",
      "SEACE",
    ],
    specialties: [
      {
        id: "presupuestos-obra",
        label: "Presupuestos y metrados",
        cases: [
          {
            id: "metrados",
            title: "Hoja de metrados con fórmulas",
            kind: "sheets",
            need: "Ordenar metrados por partida y vincularlos al presupuesto.",
            materials: "Planilla de metrados y lista de partidas.",
            output:
              "Excel con metrados, análisis de precios unitarios y totales.",
            prompt: `Estructura en Excel los metrados de [obra] por partida (código, descripción, unidad, cantidad, largo, ancho, alto) con fórmulas de parcial y total, y una hoja de presupuesto que tome esos totales y [precios unitarios].`,
            office: ["excel"],
            videos: [
              "Copilot Excel ingeniería civil metrados",
              "Excel macros VBA con IA presupuesto de obra",
            ],
          },
        ],
      },
      {
        id: "normativa",
        label: "Normativa técnica",
        cases: [
          {
            id: "rne",
            title: "Consultar el RNE con citas",
            kind: "research",
            need: "Encontrar qué dice la norma sobre un requisito concreto.",
            materials: "Normas del RNE en PDF (E.020, E.030, E.060…).",
            output: "Respuesta con artículo y numeral citados.",
            prompt: `Usando solo las normas adjuntas del RNE, responde: [pregunta]. Cita la norma, artículo y numeral exactos y transcribe la parte relevante. Si no está en el material, dilo.`,
            caution:
              "La IA no reemplaza el cálculo estructural ni la firma del ingeniero responsable.",
          },
        ],
      },
      {
        id: "obra",
        label: "Supervisión de obra",
        cases: [
          {
            id: "informe-mensual",
            title: "Informe mensual de supervisión",
            kind: "writing",
            need: "Redactar el informe a partir de cuaderno de obra y fotos.",
            materials: "Asientos del cuaderno, valorización, fotos.",
            output:
              "Informe en Word con avance, incidencias y recomendaciones.",
            prompt: `Redacta el informe mensual de supervisión de [obra] para [mes] con: avance físico y financiero ([datos]), incidencias del cuaderno de obra ([asientos]), panel fotográfico descrito y recomendaciones.`,
            office: ["word", "powerpoint"],
            videos: ["Copilot en Word redactar informe técnico"],
          },
        ],
      },
    ],
  },
  {
    id: "industrial",
    label: "Ingeniería industrial",
    group: "ingenieria",
    icon: "Factory",
    summary:
      "Procesos, productividad, calidad y seguridad y salud en el trabajo.",
    sources: [
      "Ley 29783 de SST y su reglamento",
      "ISO 9001 / 45001",
      "INACAL (NTP)",
    ],
    specialties: [
      {
        id: "procesos",
        label: "Procesos y productividad",
        cases: [
          {
            id: "flujograma",
            title: "Flujograma y diagnóstico de un proceso",
            kind: "visual",
            need: "Dibujar el proceso actual y detectar cuellos de botella.",
            materials: "Descripción del proceso, tiempos tomados.",
            output: "Diagrama (Mermaid/Visio), tabla de tiempos y propuestas.",
            prompt: `Con esta descripción del proceso [proceso] y tiempos [tiempos], dibuja el flujograma en Mermaid, calcula el tiempo de ciclo, identifica el cuello de botella y propone 3 mejoras con su impacto estimado.`,
          },
        ],
      },
      {
        id: "calidad",
        label: "Calidad",
        cases: [
          {
            id: "pareto",
            title: "Pareto e Ishikawa de defectos",
            kind: "data",
            need: "Priorizar causas de defectos con datos.",
            materials: "Registro de defectos en Excel.",
            output: "Diagrama de Pareto, Ishikawa y plan PHVA.",
            prompt: `Con el registro de defectos adjunto, construye un diagrama de Pareto, un Ishikawa con las 6M y un plan PHVA para las causas que explican el 80 %.`,
            office: ["excel", "powerpoint"],
            videos: ["Copilot Excel diagrama de Pareto"],
          },
        ],
      },
      {
        id: "sst",
        label: "Seguridad y salud en el trabajo",
        cases: [
          {
            id: "iperc",
            title: "Borrador de matriz IPERC",
            kind: "sheets",
            need: "Identificar peligros y evaluar riesgos de un puesto.",
            materials: "Descripción de tareas y normativa de SST.",
            output: "Matriz IPERC en Excel con controles propuestos.",
            prompt: `Elabora un borrador de matriz IPERC para el puesto [puesto] con tareas [tareas]. Columnas: peligro, riesgo, probabilidad, severidad, nivel de riesgo, controles según jerarquía. Basado en la Ley 29783 y su reglamento.`,
            office: ["excel"],
            caution:
              "La matriz IPERC debe validarla el comité de SST con participación de los trabajadores.",
          },
        ],
      },
    ],
  },
  {
    id: "minas",
    label: "Ingeniería de minas y geología",
    group: "ingenieria",
    icon: "Mountain",
    summary:
      "Planeamiento, geología, seguridad minera y reportes regulatorios.",
    sources: [
      "MINEM",
      "INGEMMET (GEOCATMIN)",
      "OSINERGMIN",
      "D.S. 024-2016-EM",
    ],
    specialties: [
      {
        id: "geologia",
        label: "Geología",
        cases: [
          {
            id: "logueo",
            title: "Resumen de logueo de sondajes",
            kind: "data",
            need: "Sintetizar logueos y leyes por intervalo.",
            materials: "Base de logueo y ensayes en CSV.",
            output: "Resumen por litología, intervalos con ley y gráficos.",
            prompt: `Con esta base de sondajes (columnas [columnas]), resume por litología, calcula leyes ponderadas por longitud de intervalo y lista intervalos sobre [ley de corte]. Grafica ley vs profundidad.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "seguridad-minera",
        label: "Seguridad minera",
        cases: [
          {
            id: "pets",
            title: "Borrador de PETS",
            kind: "writing",
            need: "Redactar un Procedimiento Escrito de Trabajo Seguro.",
            materials: "Tarea, equipos y reglamento de seguridad minera.",
            output: "PETS con pasos, peligros, controles y responsables.",
            prompt: `Redacta un PETS para [tarea] en [tipo de mina], conforme al formato del reglamento de seguridad minera adjunto: personal, EPP, equipos, procedimiento paso a paso, restricciones y responsables.`,
            office: ["word"],
            caution:
              "El PETS debe validarse en campo con los trabajadores y la supervisión.",
          },
        ],
      },
    ],
  },
  {
    id: "ambiental",
    label: "Ingeniería ambiental",
    group: "ingenieria",
    icon: "Leaf",
    summary: "Monitoreo, estudios ambientales y gestión de residuos.",
    sources: ["OEFA", "SENACE", "MINAM (ECA y LMP)", "ANA"],
    specialties: [
      {
        id: "monitoreo",
        label: "Monitoreo ambiental",
        cases: [
          {
            id: "eca",
            title: "Comparar resultados con los ECA",
            kind: "data",
            need: "Saber qué parámetros superan los Estándares de Calidad Ambiental.",
            materials: "Resultados de laboratorio y D.S. de ECA vigente.",
            output: "Tabla con excedencias resaltadas y gráfico por estación.",
            prompt: `Compara estos resultados de monitoreo de [agua/aire/suelo] (estaciones [estaciones]) con los ECA del D.S. que adjunto para la categoría [categoría]. Resalta excedencias, grafica por estación y redacta conclusiones prudentes.`,
            office: ["excel", "word"],
          },
        ],
      },
      {
        id: "estudios",
        label: "Instrumentos de gestión ambiental",
        cases: [
          {
            id: "linea-base",
            title: "Índice y estructura de línea base",
            kind: "research",
            need: "Organizar el contenido mínimo de un instrumento ambiental.",
            materials: "Términos de referencia de SENACE o del sector.",
            output: "Índice detallado con la norma que exige cada capítulo.",
            prompt: `A partir de los términos de referencia adjuntos para [tipo de estudio], arma el índice detallado de la línea base física, biológica y social, indicando qué norma o TdR exige cada sección. ${NO_DATA}`,
          },
        ],
      },
    ],
  },
  {
    id: "mecanica-electrica",
    label: "Ingeniería mecánica, eléctrica y electrónica",
    group: "ingenieria",
    icon: "Cog",
    summary: "Mantenimiento, cálculos, instalaciones y automatización.",
    sources: [
      "Código Nacional de Electricidad",
      "Manuales de fabricante",
      "OSINERGMIN",
    ],
    specialties: [
      {
        id: "mantenimiento",
        label: "Mantenimiento",
        cases: [
          {
            id: "plan-preventivo",
            title: "Plan de mantenimiento preventivo",
            kind: "sheets",
            need: "Programar mantenimientos por horas de uso y criticidad.",
            materials: "Lista de equipos, horómetros, manuales del fabricante.",
            output: "Cronograma anual en Excel con alertas y KPI (MTBF, MTTR).",
            prompt: `Con la lista de equipos [equipos] y frecuencias del fabricante, crea un plan preventivo anual en Excel, con fechas según horómetro, alertas de vencimiento y cálculo de MTBF y MTTR desde el historial de fallas.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "automatizacion",
        label: "Automatización",
        cases: [
          {
            id: "plc",
            title: "Lógica de PLC o script de Arduino",
            kind: "code",
            need: "Escribir y explicar la lógica de control de una secuencia.",
            materials: "Descripción de entradas, salidas y secuencia.",
            output:
              "Código comentado (ladder en texto, ST o Arduino) y pruebas.",
            prompt: `Escribe en [lenguaje: Texto Estructurado / Arduino] la lógica para [secuencia], con entradas [entradas] y salidas [salidas]. Comenta cada bloque e incluye una tabla de pruebas.`,
            caution: "Prueba en simulador antes de cargar a un equipo real.",
          },
        ],
      },
    ],
  },
  {
    id: "arquitectura",
    label: "Arquitectura",
    group: "ingenieria",
    icon: "Ruler",
    summary: "Diseño, urbanismo, normativa y comunicación de proyectos.",
    sources: ["RNE (A.010, A.120…)", "Parámetros urbanos municipales"],
    specialties: [
      {
        id: "diseno",
        label: "Diseño y visualización",
        cases: [
          {
            id: "render-concepto",
            title: "Imágenes conceptuales de un proyecto",
            kind: "visual",
            need: "Explorar ambientes y materiales antes de modelar.",
            materials: "Boceto, foto del terreno o referencia.",
            output:
              "Variantes de imágenes conceptuales para la presentación inicial.",
            prompt: `Genera una imagen conceptual de [espacio] en [ciudad], estilo [estilo], con materiales [materiales], luz de [hora]. Mantén la volumetría del boceto adjunto.`,
            caution:
              "Una imagen generada no es un plano: no reemplaza CAD/BIM ni la revisión normativa.",
          },
        ],
      },
      {
        id: "normativa-arq",
        label: "Normativa y parámetros",
        cases: [
          {
            id: "parametros",
            title: "Verificar parámetros urbanísticos",
            kind: "research",
            need: "Cruzar el certificado de parámetros con el anteproyecto.",
            materials:
              "Certificado de parámetros, cuadro de áreas, normas del RNE.",
            output: "Tabla de cumplimiento: requerido vs propuesto.",
            prompt: `Compara el certificado de parámetros adjunto con este cuadro de áreas [cuadro]: altura, retiros, área libre, coeficiente de edificación y estacionamientos. Tabla requerido vs propuesto y observaciones.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "bim",
        label: "BIM y coordinación",
        cases: [
          {
            id: "dynamo",
            title: "Automatizar tareas en Revit",
            kind: "code",
            need: "Renombrar vistas, numerar ambientes o exportar tablas en lote.",
            materials: "Descripción de la tarea repetitiva.",
            output: "Script Dynamo/Python o pyRevit explicado.",
            prompt: `Escribe un script en Python para pyRevit que [tarea] en el modelo abierto, con comentarios y una advertencia para probarlo en una copia del archivo.`,
          },
        ],
      },
    ],
  },

  /* --------------------------- Negocios y gestión ------------------------- */
  {
    id: "administracion",
    label: "Administración",
    group: "negocios",
    icon: "Briefcase",
    summary: "Planeamiento, procesos, informes de gestión y presentaciones.",
    sources: ["INEI", "PRODUCE", "Normas ISO"],
    specialties: [
      {
        id: "planeamiento",
        label: "Planeamiento",
        cases: [
          {
            id: "foda",
            title: "FODA y plan operativo",
            kind: "writing",
            need: "Pasar de un diagnóstico a objetivos, metas e indicadores.",
            materials: "Diagnóstico, datos de ventas, entrevistas.",
            output: "FODA cruzado, objetivos SMART y POA en tabla.",
            prompt: `Con este diagnóstico de [empresa/área]: [diagnóstico], elabora un FODA cruzado, 5 objetivos SMART y un plan operativo anual con actividades, responsables, metas e indicadores.`,
            office: ["word", "excel"],
          },
        ],
      },
      {
        id: "gerencia",
        label: "Informes a gerencia",
        cases: [
          {
            id: "informe-ejecutivo",
            title: "De Excel a presentación ejecutiva",
            kind: "slides",
            need: "Presentar resultados del mes en 6 diapositivas claras.",
            materials: "Libro Excel de resultados.",
            output: "PPT con hallazgos, gráficos y recomendaciones.",
            prompt: `Con los resultados adjuntos de [mes], arma una presentación de 6 diapositivas para gerencia: resumen ejecutivo, 3 hallazgos con gráfico, riesgos y próximos pasos.`,
            office: ["excel", "powerpoint", "outlook"],
            videos: [
              "Copilot PowerPoint crear presentación desde un archivo Word",
              "Copilot Outlook resumir correos",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    group: "negocios",
    icon: "Calculator",
    summary:
      "Registros, conciliaciones, tributación SUNAT y estados financieros.",
    sources: ["SUNAT (PLE, SIRE)", "PCGE", "NIIF"],
    specialties: [
      {
        id: "conciliacion",
        label: "Conciliaciones",
        cases: [
          {
            id: "conciliacion-bancaria",
            title: "Conciliación bancaria automática",
            kind: "sheets",
            need: "Cruzar el extracto bancario con el libro bancos.",
            materials: "Extracto en Excel/CSV y libro bancos.",
            output:
              "Partidas conciliadas, pendientes y diferencias explicadas.",
            prompt: `Tengo dos hojas: Extracto (fecha, descripción, monto) y LibroBancos (fecha, glosa, debe, haber). Crea fórmulas con BUSCARX para conciliar por monto y fecha ±[días] días, marca las partidas pendientes y resume las diferencias.`,
            office: ["excel"],
            videos: [
              "Copilot en Excel para contadores",
              "conciliación bancaria en Excel con IA",
              "macros VBA Excel con ChatGPT contabilidad",
            ],
          },
        ],
      },
      {
        id: "tributacion",
        label: "Tributación",
        cases: [
          {
            id: "sire",
            title: "Revisar compras antes del SIRE",
            kind: "sheets",
            need: "Detectar comprobantes duplicados, RUC no habidos o fechas fuera de periodo.",
            materials: "Registro de compras exportado.",
            output: "Lista de observaciones antes de declarar.",
            prompt: `En este registro de compras (columnas [columnas]), marca duplicados por serie y número, comprobantes fuera del periodo [periodo], diferencias entre base, IGV (18 %) y total, y arma un resumen de observaciones.`,
            office: ["excel"],
            sensitive: true,
            caution:
              "Confirma criterios tributarios en la normativa de SUNAT vigente; la IA puede citar normas desactualizadas.",
          },
        ],
      },
      {
        id: "eeff",
        label: "Estados financieros",
        cases: [
          {
            id: "ratios",
            title: "Ratios y notas a los estados financieros",
            kind: "data",
            need: "Calcular ratios y redactar el análisis para el directorio.",
            materials: "Balance y estado de resultados de dos periodos.",
            output:
              "Ratios de liquidez, rentabilidad y endeudamiento con interpretación.",
            prompt: `Con los estados financieros adjuntos de [periodos], calcula análisis vertical, horizontal y ratios de liquidez, endeudamiento y rentabilidad. Explica cada variación importante en lenguaje para directorio.`,
            office: ["excel", "word", "powerpoint"],
          },
        ],
      },
    ],
  },
  {
    id: "economia",
    label: "Economía y finanzas",
    group: "negocios",
    icon: "TrendingUp",
    summary:
      "Series económicas, proyecciones, evaluación de proyectos y reportes.",
    sources: ["BCRP (BCRPData)", "INEI", "MEF", "SBS / SMV"],
    specialties: [
      {
        id: "macro",
        label: "Análisis macroeconómico",
        cases: [
          {
            id: "series-bcrp",
            title: "Reporte de coyuntura con series del BCRP",
            kind: "data",
            need: "Describir inflación, tipo de cambio y tasas del mes.",
            materials: "Series descargadas de BCRPData en Excel/CSV.",
            output: "Gráficos, variaciones y texto de coyuntura.",
            prompt: `Con las series adjuntas del BCRP ([series]), calcula variaciones mensuales y anuales, grafica los últimos 24 meses y redacta un párrafo de coyuntura por indicador. ${NO_DATA}`,
            office: ["excel", "word"],
          },
        ],
      },
      {
        id: "proyectos",
        label: "Evaluación de proyectos",
        cases: [
          {
            id: "van-tir",
            title: "Flujo de caja, VAN y TIR con sensibilidad",
            kind: "sheets",
            need: "Evaluar si un proyecto es rentable y qué tan sensible es.",
            materials: "Supuestos de inversión, ingresos y costos.",
            output:
              "Modelo Excel con VAN, TIR, periodo de recuperación y escenarios.",
            prompt: `Arma un modelo en Excel para [proyecto] con inversión [monto], horizonte [años], tasa de descuento [tasa]. Calcula VAN, TIR y payback, y una tabla de sensibilidad del precio y el volumen ±20 %.`,
            office: ["excel"],
            videos: ["Copilot Excel VAN TIR flujo de caja"],
          },
        ],
      },
      {
        id: "econometria",
        label: "Econometría",
        cases: [
          {
            id: "regresion",
            title: "Regresión con interpretación",
            kind: "code",
            need: "Estimar un modelo y explicar los resultados.",
            materials: "Base de datos en CSV.",
            output: "Script en Python/R, tabla de resultados y diagnóstico.",
            prompt: `Escribe un script en [Python/R] que estime [modelo] con la base adjunta, pruebe heterocedasticidad y autocorrelación, y explique coeficientes y significancia en lenguaje claro.`,
          },
        ],
      },
    ],
  },
  {
    id: "logistica",
    label: "Logística y cadena de suministro",
    group: "negocios",
    icon: "Truck",
    summary: "Inventarios, compras, rutas, almacenes y comercio exterior.",
    sources: ["SUNAT Aduanas", "Arancel de Aduanas", "VUCE"],
    specialties: [
      {
        id: "inventarios",
        label: "Inventarios",
        cases: [
          {
            id: "abc",
            title: "Clasificación ABC y punto de reposición",
            kind: "sheets",
            need: "Saber qué productos controlar más y cuándo pedir.",
            materials: "Ventas por SKU y tiempos de entrega.",
            output: "Excel con ABC, stock de seguridad y punto de pedido.",
            prompt: `Con ventas mensuales por SKU (columnas [columnas]) y lead time [días], calcula clasificación ABC, stock de seguridad al [nivel de servicio] y punto de reposición. Marca lo que hay que pedir hoy.`,
            office: ["excel"],
            videos: ["Copilot Excel análisis ABC inventario"],
          },
        ],
      },
      {
        id: "comex",
        label: "Comercio exterior",
        cases: [
          {
            id: "partida",
            title: "Orientación sobre partida arancelaria",
            kind: "research",
            need: "Ubicar posibles partidas y requisitos de una mercancía.",
            materials: "Ficha técnica del producto y arancel vigente.",
            output:
              "Partidas candidatas con justificación y entidades que intervienen.",
            prompt: `Con la ficha técnica adjunta de [producto], sugiere partidas arancelarias candidatas del Arancel de Aduanas del Perú con la regla de interpretación que aplica y las entidades (VUCE) que podrían exigir permisos. Marca todo como orientativo.`,
            caution:
              "La clasificación oficial la da SUNAT; la IA solo orienta.",
          },
        ],
      },
    ],
  },
  {
    id: "rrhh",
    label: "Recursos humanos",
    group: "negocios",
    icon: "Users",
    summary: "Selección, planillas, clima laboral y capacitación.",
    sources: ["SUNAFIL", "MTPE", "Régimen laboral (D.L. 728)"],
    specialties: [
      {
        id: "seleccion",
        label: "Selección",
        cases: [
          {
            id: "perfil-puesto",
            title: "Perfil de puesto y entrevista por competencias",
            kind: "writing",
            need: "Definir el perfil y preguntas para evaluar a los candidatos.",
            materials: "Funciones del puesto y competencias de la empresa.",
            output: "Perfil, aviso de empleo y guía de entrevista con rúbrica.",
            prompt: `Con estas funciones [funciones], redacta el perfil de puesto de [puesto], un aviso de empleo inclusivo y una guía de entrevista por competencias con 8 preguntas STAR y rúbrica de 1 a 4.`,
            office: ["word"],
            caution:
              "No pidas a la IA filtrar CV con datos personales en un servicio comercial sin consentimiento; evita sesgos.",
          },
        ],
      },
      {
        id: "planillas",
        label: "Planillas",
        cases: [
          {
            id: "calculo-planilla",
            title: "Verificar cálculos de planilla",
            kind: "sheets",
            need: "Revisar gratificaciones, CTS y vacaciones.",
            materials: "Plantilla de planilla (sin nombres).",
            output: "Fórmulas revisadas y lista de diferencias.",
            prompt: `Revisa esta plantilla de planilla del régimen [régimen] y explica las fórmulas de gratificación, CTS, vacaciones y aportes. Señala celdas donde el cálculo no coincide con la regla.`,
            office: ["excel"],
            sensitive: true,
          },
        ],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing y ventas",
    group: "negocios",
    icon: "Megaphone",
    summary:
      "Contenido, campañas, análisis de clientes y propuestas comerciales.",
    sources: ["INDECOPI (publicidad)", "Datos propios de ventas"],
    specialties: [
      {
        id: "contenido",
        label: "Contenido y redes",
        cases: [
          {
            id: "calendario",
            title: "Calendario de contenidos de un mes",
            kind: "writing",
            need: "Planear publicaciones con piezas y textos listos.",
            materials: "Marca, público, productos y fechas clave.",
            output: "Calendario en tabla con copies, formato e ideas visuales.",
            prompt: `Para [marca] dirigida a [público] en Perú, arma un calendario de 4 semanas para [redes], con fechas clave locales, formato, copy, llamado a la acción e idea visual por publicación.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "ventas",
        label: "Propuestas comerciales",
        cases: [
          {
            id: "propuesta",
            title: "Propuesta comercial y presentación",
            kind: "slides",
            need: "Preparar una propuesta a medida del cliente.",
            materials: "Brief del cliente, catálogo, precios.",
            output: "Propuesta en Word y presentación de 8 diapositivas.",
            prompt: `Con el brief de [cliente] y nuestro catálogo, redacta una propuesta comercial (problema, solución, alcance, cronograma, inversión) y conviértela en 8 diapositivas.`,
            office: ["word", "powerpoint"],
            videos: ["Copilot PowerPoint propuesta comercial"],
          },
        ],
      },
    ],
  },
  {
    id: "turismo",
    label: "Turismo, hotelería y gastronomía",
    group: "negocios",
    icon: "UtensilsCrossed",
    summary:
      "Itinerarios, costeo de recetas, reseñas y atención en varios idiomas.",
    sources: ["MINCETUR", "PromPerú", "DIGESA"],
    specialties: [
      {
        id: "gastronomia",
        label: "Gastronomía",
        cases: [
          {
            id: "costeo",
            title: "Costeo de recetas y carta",
            kind: "sheets",
            need: "Conocer el costo por plato y el precio sugerido.",
            materials: "Recetas estándar y precios de insumos.",
            output: "Fichas técnicas con costo, merma y margen.",
            prompt: `Con estas recetas [recetas] y precios de insumos [precios], crea fichas técnicas en Excel con rendimiento, merma, costo por porción y precio de venta para un food cost de [porcentaje] %.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "turismo-op",
        label: "Operación turística",
        cases: [
          {
            id: "itinerario",
            title: "Itinerario y respuestas en varios idiomas",
            kind: "writing",
            need: "Armar itinerarios y responder consultas de turistas.",
            materials: "Destinos, tiempos de traslado, tarifas.",
            output:
              "Itinerario día a día y plantillas de respuesta en inglés y portugués.",
            prompt: `Diseña un itinerario de [días] días por [destinos] para [perfil de turista], con tiempos realistas de traslado, y escribe plantillas de respuesta a consultas en español, inglés y portugués.`,
            caution:
              "Verifica horarios y accesos con fuentes oficiales (p. ej. aforos de Machu Picchu).",
          },
        ],
      },
    ],
  },

  /* ------------------------ Derecho y sector público ---------------------- */
  {
    id: "derecho",
    label: "Derecho",
    group: "derecho",
    icon: "Scale",
    summary:
      "Investigación jurídica, análisis de expedientes y redacción de escritos.",
    sources: [
      "SPIJ (MINJUS)",
      "Jurisprudencia del Poder Judicial",
      "Tribunal Constitucional",
      "El Peruano",
    ],
    specialties: [
      {
        id: "penal",
        label: "Derecho penal",
        cases: [
          {
            id: "cronologia",
            title: "Cronología y teoría del caso desde un expediente",
            kind: "research",
            need: "Ordenar hechos, pruebas y actuaciones de un expediente largo.",
            materials: "Expediente digitalizado (con OCR) y normas aplicables.",
            output:
              "Cronología con folios, matriz hecho–prueba–norma y puntos débiles.",
            prompt: `Analiza el expediente adjunto. Elabora una cronología de hechos con el folio de cada uno, una matriz hecho–medio probatorio–norma del Código Penal y del Código Procesal Penal, y los puntos débiles de cada teoría del caso. ${NO_DATA}`,
            office: ["word"],
            sensitive: true,
            caution:
              "Expedientes con datos reservados: usa IA local o anonimiza. Verifica cada cita en el SPIJ.",
          },
        ],
      },
      {
        id: "civil-derecho",
        label: "Derecho civil y contratos",
        cases: [
          {
            id: "revision-contrato",
            title: "Revisión de un contrato",
            kind: "writing",
            need: "Detectar cláusulas riesgosas y proponer redacción alternativa.",
            materials: "Contrato en Word y posición del cliente.",
            output:
              "Tabla de cláusulas, riesgo y propuesta, más control de cambios.",
            prompt: `Revisa este contrato de [tipo] desde la posición de [parte]. Tabla: cláusula, riesgo (alto/medio/bajo), fundamento en el Código Civil y redacción alternativa.`,
            office: ["word"],
            videos: [
              "Copilot en Word revisar contrato",
              "Copilot Word resumir documento legal",
            ],
          },
        ],
      },
      {
        id: "laboral",
        label: "Derecho laboral",
        cases: [
          {
            id: "jurisprudencia",
            title: "Búsqueda de jurisprudencia con citas",
            kind: "research",
            need: "Encontrar casaciones y precedentes sobre un tema.",
            materials: "Pregunta jurídica concreta.",
            output:
              "Lista de resoluciones con número, sala, fecha y criterio, verificables.",
            prompt: `Busca jurisprudencia peruana (Corte Suprema y Tribunal Constitucional) sobre [tema laboral]. Para cada resolución da número, sala, fecha, criterio y enlace a la fuente oficial. Si no puedes verificar una, no la incluyas.`,
            caution:
              "Los modelos pueden inventar casaciones: abre cada enlace antes de citar.",
          },
        ],
      },
    ],
  },
  {
    id: "gestion-publica",
    label: "Gestión pública",
    group: "derecho",
    icon: "Landmark",
    summary:
      "Planeamiento, presupuesto, contrataciones y documentos de gestión.",
    sources: ["CEPLAN", "MEF (Consulta Amigable)", "SEACE", "Contraloría"],
    specialties: [
      {
        id: "contrataciones",
        label: "Contrataciones del Estado",
        cases: [
          {
            id: "tdr",
            title: "Términos de referencia sin direccionamiento",
            kind: "writing",
            need: "Redactar TdR claros, medibles y competitivos.",
            materials: "Requerimiento del área usuaria y normativa vigente.",
            output:
              "TdR con objeto, alcance, entregables, plazos y requisitos.",
            prompt: `Redacta términos de referencia para [servicio] con: finalidad pública, objeto, alcance, actividades, entregables con plazos, perfil del proveedor y forma de pago. Señala requisitos que podrían restringir la competencia.`,
            office: ["word"],
          },
        ],
      },
      {
        id: "presupuesto-pub",
        label: "Presupuesto",
        cases: [
          {
            id: "ejecucion",
            title: "Seguimiento de ejecución presupuestal",
            kind: "data",
            need: "Ver avance de ejecución por genérica y meta.",
            materials: "Reporte exportado de Consulta Amigable o SIAF.",
            output: "Tablero con PIM, devengado, avance % y alertas.",
            prompt: `Con este reporte de ejecución (columnas [columnas]), calcula avance de devengado sobre PIM por genérica de gasto y meta, marca las metas bajo [porcentaje] % y prepara un gráfico para el informe.`,
            office: ["excel", "powerpoint"],
          },
        ],
      },
      {
        id: "documentos",
        label: "Documentos de gestión",
        cases: [
          {
            id: "informe-tecnico",
            title: "Informe técnico y oficio",
            kind: "writing",
            need: "Redactar con estructura formal y base legal.",
            materials: "Antecedentes, análisis y normas.",
            output:
              "Informe (antecedentes, análisis, conclusiones, recomendaciones) y oficio de remisión.",
            prompt: `Redacta un informe técnico sobre [asunto] con antecedentes, base legal, análisis, conclusiones y recomendaciones, en estilo administrativo peruano, y el oficio de remisión a [destinatario].`,
            office: ["word", "outlook"],
            videos: ["Copilot en Word redactar documentos formales"],
          },
        ],
      },
    ],
  },

  /* ----------------------- Educación y comunicación ----------------------- */
  {
    id: "educacion",
    label: "Educación",
    group: "educacion",
    icon: "GraduationCap",
    summary:
      "Planificación curricular, materiales, evaluación y acompañamiento.",
    sources: ["Currículo Nacional (MINEDU)", "PerúEduca", "SUNEDU"],
    specialties: [
      {
        id: "planificacion",
        label: "Planificación",
        cases: [
          {
            id: "sesion",
            title: "Sesión de aprendizaje por competencias",
            kind: "writing",
            need: "Planificar una sesión alineada al Currículo Nacional.",
            materials: "Competencia, grado y contexto del aula.",
            output: "Sesión con propósito, criterios, secuencia y evaluación.",
            prompt: `Diseña una sesión de [área] para [grado] alineada a la competencia [competencia] del Currículo Nacional: propósito, criterios de evaluación, inicio-desarrollo-cierre con tiempos, materiales y una lista de cotejo.`,
            office: ["word"],
          },
        ],
      },
      {
        id: "evaluacion",
        label: "Evaluación",
        cases: [
          {
            id: "rubrica",
            title: "Rúbrica y banco de preguntas",
            kind: "study",
            need: "Evaluar con criterios claros y preguntas variadas.",
            materials: "Tema, nivel y material del curso.",
            output: "Rúbrica analítica y preguntas con clave de respuestas.",
            prompt: `Con el material adjunto de [tema], crea una rúbrica analítica de 4 niveles y 15 preguntas (opción múltiple, abiertas y de caso) con clave y nivel de dificultad.`,
            office: ["word", "excel"],
          },
        ],
      },
      {
        id: "material",
        label: "Material didáctico",
        cases: [
          {
            id: "asistente-curso",
            title: "Asistente de estudio con tus libros",
            kind: "study",
            need: "Que los alumnos pregunten sobre el material del curso.",
            materials: "Libros, separatas y presentaciones del curso.",
            output:
              "Cuaderno de NotebookLM o asistente local que responde citando el material.",
            prompt: `Responde solo con el material cargado del curso [curso]. Cita página o diapositiva. Si la pregunta no está en el material, dilo y sugiere qué capítulo revisar.`,
          },
        ],
      },
    ],
  },
  {
    id: "comunicacion",
    label: "Comunicación y periodismo",
    group: "educacion",
    icon: "Mic",
    summary: "Verificación, transcripción, redacción y producción multimedia.",
    sources: [
      "Fuentes primarias",
      "Agencias de verificación",
      "Ley de Transparencia",
    ],
    specialties: [
      {
        id: "verificacion",
        label: "Verificación",
        cases: [
          {
            id: "fact-check",
            title: "Verificar una afirmación viral",
            kind: "research",
            need: "Encontrar el origen y fuentes primarias de un dato.",
            materials: "La afirmación y su contexto.",
            output: "Ficha de verificación con fuentes y veredicto.",
            prompt: `Verifica la afirmación: «[afirmación]». Busca la fuente original, datos oficiales y contexto. Entrega una ficha con fuentes enlazadas, qué se pudo confirmar y qué no.`,
            caution:
              "La IA también se equivoca: el veredicto final es tuyo tras revisar las fuentes.",
          },
        ],
      },
      {
        id: "produccion",
        label: "Producción",
        cases: [
          {
            id: "transcripcion",
            title: "Transcribir y resumir entrevistas",
            kind: "writing",
            need: "Pasar audio a texto y extraer citas.",
            materials: "Audio de la entrevista.",
            output: "Transcripción, citas destacadas y borrador de nota.",
            prompt: `Con esta transcripción de [entrevistado], extrae las 5 citas más relevantes con marca de tiempo y redacta un borrador de nota de [extensión] palabras con pirámide invertida.`,
            local: "Whisper en local transcribe sin subir el audio a la nube.",
            sensitive: true,
          },
        ],
      },
    ],
  },

  /* ------------------------------ Ciencias y agro ------------------------- */
  {
    id: "quimica",
    label: "Química e ingeniería química",
    group: "ciencia",
    icon: "FlaskConical",
    summary: "Laboratorio, control de calidad, procesos y seguridad química.",
    sources: ["INACAL", "Hojas de datos de seguridad (SDS)", "PubChem"],
    specialties: [
      {
        id: "laboratorio",
        label: "Laboratorio y calidad",
        cases: [
          {
            id: "validacion",
            title: "Cálculos de validación de un método",
            kind: "data",
            need: "Calcular linealidad, precisión y límites de detección.",
            materials: "Datos de calibración y réplicas.",
            output: "Tablas, gráficos y criterios de aceptación.",
            prompt: `Con estos datos de calibración [datos], calcula regresión lineal, R², LOD, LOQ, repetibilidad (CV %) y compara con los criterios [criterios]. Explica si el método cumple.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "seguridad-quim",
        label: "Seguridad química",
        cases: [
          {
            id: "sds",
            title: "Resumen de hojas de seguridad (SDS)",
            kind: "research",
            need: "Tener a mano peligros, EPP y compatibilidades de los reactivos.",
            materials: "SDS de los productos en PDF.",
            output:
              "Tabla de peligros GHS, EPP, primeros auxilios e incompatibilidades.",
            prompt: `Resume las SDS adjuntas en una tabla: producto, pictogramas GHS, frases H y P, EPP, primeros auxilios e incompatibilidades de almacenamiento. ${NO_DATA}`,
            office: ["excel", "word"],
          },
        ],
      },
    ],
  },
  {
    id: "biologia",
    label: "Biología y biotecnología",
    group: "ciencia",
    icon: "Dna",
    summary:
      "Análisis de datos biológicos, bioinformática y redacción científica.",
    sources: ["NCBI", "GBIF", "SERFOR", "CONCYTEC"],
    specialties: [
      {
        id: "bioinformatica",
        label: "Bioinformática",
        cases: [
          {
            id: "pipeline",
            title: "Script para analizar secuencias",
            kind: "code",
            need: "Automatizar el análisis de un lote de secuencias.",
            materials: "Archivos FASTA y objetivo del análisis.",
            output: "Script en Python (Biopython) comentado.",
            prompt: `Escribe un script en Python con Biopython que lea los FASTA de una carpeta, calcule [métricas] y exporte un CSV. Comenta cada paso y agrega instrucciones de instalación.`,
          },
        ],
      },
      {
        id: "articulo",
        label: "Redacción científica",
        cases: [
          {
            id: "manuscrito",
            title: "Revisar un manuscrito antes de enviarlo",
            kind: "writing",
            need: "Mejorar claridad y estructura IMRyD.",
            materials: "Borrador del artículo y guía de la revista.",
            output: "Comentarios por sección y versión editada en inglés.",
            prompt: `Revisa este manuscrito según la guía de [revista]: coherencia IMRyD, claridad, consistencia entre resultados y conclusiones. Devuelve comentarios por sección y una versión en inglés académico sin cambiar los datos.`,
            office: ["word"],
          },
        ],
      },
    ],
  },
  {
    id: "agronomia",
    label: "Agronomía e ingeniería agrícola",
    group: "ciencia",
    icon: "Sprout",
    summary:
      "Planes de cultivo, riego, sanidad vegetal y costos de producción.",
    sources: ["SENASA", "SENAMHI", "MIDAGRI", "INIA"],
    specialties: [
      {
        id: "cultivo",
        label: "Manejo de cultivos",
        cases: [
          {
            id: "plaga",
            title: "Identificar una plaga por foto",
            kind: "visual",
            need: "Orientarse sobre una plaga o enfermedad en campo.",
            materials: "Fotos de hojas, frutos o tallos.",
            output: "Posibles causas, cómo confirmarlas y manejo integrado.",
            prompt: `Analiza estas fotos de [cultivo] en [zona]. Indica posibles plagas o enfermedades, qué síntomas confirmarían cada una, y un manejo integrado con productos autorizados por SENASA.`,
            caution:
              "Es orientación: confirma con un laboratorio o especialista antes de aplicar productos.",
          },
        ],
      },
      {
        id: "costos-agro",
        label: "Costos y riego",
        cases: [
          {
            id: "costo-produccion",
            title: "Costo de producción por hectárea",
            kind: "sheets",
            need: "Calcular costos, rendimiento y punto de equilibrio.",
            materials: "Labores, insumos, jornales y precios en chacra.",
            output: "Excel con costos por etapa, rentabilidad y escenarios.",
            prompt: `Arma en Excel el costo de producción por hectárea de [cultivo] en [región]: preparación, siembra, labores, insumos, cosecha y jornales. Calcula rentabilidad con precio [precio] y rendimiento [rendimiento], y punto de equilibrio.`,
            office: ["excel"],
          },
        ],
      },
    ],
  },

  /* ------------------------------- Tecnología ----------------------------- */
  {
    id: "informatica",
    label: "Informática y sistemas",
    group: "tecnologia",
    icon: "Code2",
    summary:
      "Desarrollo, revisión de código, agentes, infraestructura y seguridad.",
    sources: [
      "Documentación oficial",
      "OWASP",
      "Ley 29733 de datos personales",
    ],
    specialties: [
      {
        id: "desarrollo",
        label: "Desarrollo de software",
        cases: [
          {
            id: "app-propia",
            title: "Crear una app con un agente de programación",
            kind: "code",
            need: "Construir un prototipo funcional desde una idea.",
            materials: "Descripción de la app, repositorio vacío.",
            output: "Repositorio con código, pruebas y README.",
            prompt: `Construye un prototipo de [app] con [stack]. Antes de programar, propone la estructura de carpetas y el plan. Escribe pruebas y un README con cómo ejecutarlo.`,
            caution:
              "Revisa cada cambio del agente y no le des acceso a credenciales de producción.",
          },
        ],
      },
      {
        id: "seguridad",
        label: "Ciberseguridad",
        cases: [
          {
            id: "revision-codigo",
            title: "Revisión de seguridad de código",
            kind: "code",
            need: "Detectar vulnerabilidades antes de publicar.",
            materials: "Código del módulo a revisar.",
            output: "Hallazgos por severidad según OWASP con su corrección.",
            prompt: `Revisa este código buscando vulnerabilidades del OWASP Top 10. Para cada hallazgo: severidad, línea, explicación y corrección propuesta. No inventes problemas si no los hay.`,
            sensitive: true,
          },
        ],
      },
      {
        id: "rag",
        label: "Asistentes con datos propios",
        cases: [
          {
            id: "rag-local",
            title: "Asistente privado con documentos de la empresa",
            kind: "code",
            need: "Responder preguntas internas sin enviar datos a la nube.",
            materials: "Manuales, políticas, procedimientos.",
            output: "Asistente web interno con RAG sobre un modelo local.",
            prompt: `Diseña la arquitectura de un asistente interno con RAG: ingesta de PDFs, división en fragmentos, embeddings locales, base vectorial y modelo en Ollama. Entrega el código mínimo y cómo desplegarlo en la red de la empresa.`,
            local: "Ollama + Open WebUI o AnythingLLM: todo dentro de tu red.",
          },
        ],
      },
    ],
  },
  {
    id: "datos",
    label: "Ciencia de datos y estadística",
    group: "tecnologia",
    icon: "BarChart3",
    summary: "Limpieza, modelos, visualización y tableros.",
    sources: ["INEI (microdatos)", "Datos Abiertos Perú"],
    specialties: [
      {
        id: "limpieza",
        label: "Limpieza y exploración",
        cases: [
          {
            id: "eda",
            title: "Análisis exploratorio de una encuesta",
            kind: "data",
            need: "Entender una base antes de modelar.",
            materials: "Microdatos (p. ej. ENAHO) y su diccionario.",
            output: "Informe exploratorio con tablas ponderadas y gráficos.",
            prompt: `Con la base y el diccionario adjuntos de [encuesta], limpia valores faltantes, aplica el factor de expansión [variable] y presenta tablas y gráficos de [variables] por [desagregación]. Explica cada decisión.`,
            office: ["excel"],
          },
        ],
      },
      {
        id: "tableros",
        label: "Tableros",
        cases: [
          {
            id: "dashboard",
            title: "Tablero interactivo desde un Excel",
            kind: "code",
            need: "Publicar indicadores que se actualicen solos.",
            materials: "Excel o CSV con los datos.",
            output: "App en Streamlit o tablero en Power BI con medidas DAX.",
            prompt: `Crea un tablero en [Streamlit/Power BI] con los datos adjuntos: KPI de [indicadores], filtros por [dimensiones] y un gráfico de tendencia. Si es Power BI, escribe las medidas DAX.`,
            videos: ["Copilot Power BI crear informe"],
          },
        ],
      },
    ],
  },
];

export function professionById(id: string | null) {
  return PROFESSIONS.find((profession) => profession.id === id) ?? null;
}

export function countCases(profession: Profession) {
  return profession.specialties.reduce((sum, s) => sum + s.cases.length, 0);
}

/** Campos editables de un prompt: cada [texto] único. */
export function promptFields(prompt: string): string[] {
  return [
    ...new Set([...prompt.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1] ?? "")),
  ];
}

export function fillPrompt(prompt: string, values: Record<string, string>) {
  return prompt.replace(/\[([^\]]+)\]/g, (whole, key: string) =>
    values[key]?.trim() ? values[key].trim() : whole,
  );
}

export type SearchHit = {
  profession: Profession;
  specialty: Specialty;
  item: PracticeCase;
  score: number;
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const STOP = new Set([
  "quiero",
  "necesito",
  "como",
  "para",
  "con",
  "los",
  "las",
  "del",
  "una",
  "uno",
  "mis",
  "que",
  "por",
  "hacer",
  "usar",
  "ia",
  "el",
  "la",
  "de",
  "en",
  "un",
  "y",
  "a",
  "mi",
]);

/** Buscador natural: «quiero analizar planos» → casos con más coincidencias. */
export function searchCases(query: string, limit = 6): SearchHit[] {
  const words = normalize(query)
    .split(/[^a-z0-9ñ]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
  if (words.length === 0) return [];
  const docs: Array<
    Omit<SearchHit, "score"> & { title: string; body: string }
  > = [];
  for (const profession of PROFESSIONS) {
    for (const specialty of profession.specialties) {
      for (const item of specialty.cases) {
        docs.push({
          profession,
          specialty,
          item,
          title: normalize(
            `${item.title} ${specialty.label} ${profession.label}`,
          ),
          body: normalize(`${item.need} ${item.materials} ${item.output}`),
        });
      }
    }
  }
  const stems = words.map((word) =>
    word.length > 5 ? word.slice(0, -2) : word,
  );
  // Rare words weigh more: «jurisprudencia» outranks «investigar».
  const weight = stems.map((stem) => {
    const df = docs.filter(
      (d) => d.title.includes(stem) || d.body.includes(stem),
    ).length;
    return df ? Math.log(1 + docs.length / df) : 0;
  });
  const hits: SearchHit[] = [];
  for (const { title, body, ...doc } of docs) {
    let score = 0;
    stems.forEach((stem, index) => {
      if (title.includes(stem)) score += 3 * (weight[index] ?? 0);
      else if (body.includes(stem)) score += weight[index] ?? 0;
    });
    if (score > 0) hits.push({ ...doc, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
