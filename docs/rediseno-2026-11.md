# Rediseño de interfaz — noviembre 2026

## Qué se hizo
- **Menú reorganizado por intención** (Descubrir / Entender / Construir / Mi espacio / Administración) en lugar de 17 entradas planas.
- **Herramientas de administrador ocultas para visitantes:** Proveedores, Laboratorio de APIs, Biblioteca local y Mi laboratorio. Además de ocultarse en el menú y en el buscador, sus rutas muestran la pantalla de acceso restringido (`AdminOnly`) si alguien entra por URL.
- **Capa de aprendizaje** en todas las secciones: una barra superior con «qué es esto», pasos para leer la pantalla y un concepto clave (token, contexto, cuantización, API…). Se abre sola la primera vez que entras a cada sección y luego queda plegada en una línea.
- **Paneles laterales sin espacios vacíos:** antes de seleccionar algo muestran una mini-guía de la sección.
- **Modelos:** la ficha técnica del modelo es la protagonista en el panel derecho (más ancho, animación al cambiar de modelo, fila seleccionada resaltada).
- **Hoy:** pantalla concisa — pulso del día con cifras reales indexadas, cuatro rutas de aprendizaje (Entiende → Elige → Practica → Ejecuta), precios, lo nuevo y modelos por país. La salud de fuentes solo la ve el administrador.
- **9 temas de color** con selector visual (Observatorio por defecto, Menta, Atardecer, Pastel, Obsidiana, Noche, Claro y dos de alto contraste). Se mantienen el cambio de idioma ES/EN y las visualizaciones.
- **Animaciones** con propósito (transición entre secciones, entradas escalonadas, elevación al pasar el cursor) que se desactivan con `prefers-reduced-motion`.
- **Favoritos** siguen guardándose solo en el navegador (localStorage, sin cuenta); la sección lo explica.

## Tecnologías
React 19 + Vite + Cloudflare Workers; CSS con tokens (`src/app/styles/redesign.css` sobre `global.css`); fuentes autohospedadas `@fontsource-variable/plus-jakarta-sans` e IBM Plex Mono; iconos `lucide-react`.

## Cómo se usa
- Cambiar tema: botón **Visualización** en la barra superior.
- Cambiar idioma: botón **ES/EN**.
- Ver de nuevo la explicación de una sección: botón **Cómo leerlo** de la barra superior de la sección.
- Administrador: **Acceso administrador** al pie del menú; con sesión aparecen el grupo *Administración* y la configuración de fuentes.

## Contexto de desarrollo
- Para añadir/editar la explicación de una sección: `src/components/layout/sectionIntros.ts` (español e inglés).
- Para mover una sección de grupo o hacerla solo-admin: `src/components/layout/navigation.ts` (`group`, `adminOnly`) y envolver la ruta con `AdminOnly` en `src/app/App.tsx`.
- Para una paleta nueva: añadirla en `APP_THEMES`/`THEME_BASE` (`theme.ts`), en `THEME_OPTIONS` (`AppShell.tsx`) y sus tokens en `redesign.css` bajo `html[data-palette="…"]`.
- La carpeta `design/` contiene las referencias visuales entregadas; está excluida del linter.

## Iteración 2 (2026-11-16)
- **Menú lateral con más aire:** ítems de 38 px y más separación entre grupos para que la selección se note.
- **La barra de guía ya no ocupa espacio:** ahora es la nota **«¿Qué es esto?»** junto a «Visualización». Al pasar el mouse (o con foco de teclado) aparece la explicación de la sección y al alejarlo desaparece; en móvil se abre con un toque. La primera vez que visitas una sección, la nota da unos saltitos para llamar la atención. Componente: `src/components/layout/SectionHint.tsx`.
- **Carga más rápida:** el código de cada sección se precarga al pasar el mouse o tocar el enlace del menú y, en segundo plano, en tiempo ocioso tras abrir la app (el mapa, que es el más pesado, va al final; se omite con «ahorro de datos» o 2G). La transición entre secciones bajó a 200 ms. Archivo: `src/app/routeLoaders.ts`.
- **Prompts y agentes más avanzados:**
  - Cada cadena tiene un **Prompt maestro · todo en uno**: un prompt extenso con rol, contexto, tareas por fases, formato de salida y autoverificación, al lado de un **ejemplo simulado del resultado**. Se copia con un clic y trae accesos a ChatGPT, Claude, Gemini y Copilot. En pantallas angostas se alterna entre «Prompt» y «Resultado».
  - Debajo sigue la versión **paso a paso**, que indica que la salida de cada paso es la entrada del siguiente.
  - Cada agente incluye el **system prompt del orquestador**, que se genera de sus fases: bucle pensar → actuar → observar → verificar, contrato de traspaso en JSON, barandas, presupuesto de tokens y manejo de errores.
  - En «Técnicas» hay una sección nueva de **Eficiencia de tokens** con la etiqueta «Ahorra tokens»: caché de prompt, Chain of Draft, salida acotada, TOON/CSV, instrucciones en viñetas, RAG, resumir y reiniciar, API por lotes, enrutamiento y presupuesto de razonamiento. Las mismas etiquetas aparecen en cada prompt maestro.
  - Contenido en `src/features/prompts/masters.ts`; prueba en `tests/prompt-masters.test.ts`.
