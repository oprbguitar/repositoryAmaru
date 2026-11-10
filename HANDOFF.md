# Traspaso — AMARU AI Observatory (actualizado 2026-11-09)

Para la IA que continúe. Rama: `feat/integrations-market-realtime` (subida a GitHub).
Lee primero `AGENTS.md`, `DESIGN.md` y `docs/migracion-y-despliegue.md`.
El usuario pide **bajo consumo de tokens, trabajar de uno en uno, sin subagentes en paralelo ni Fable**. Interfaz en español de Perú.

## En línea (2026-11-10)
- Producción: https://amaru.andesnova.solutions y https://ia.amauta.online (Worker `amaru-ai-observatory-production`). Detalles, admin, IA gratuita y redespliegue en `docs/despliegue-produccion.md`.
- Nuevos: tema pastel por defecto, `/prompts` (cadenas, generador, agentes, técnicas, histórico, curso PIT 2026), guía/documentación/privacidad abajo en el menú, `/admin` con login (`worker/admin.ts`) e IA gratuita limitada (`worker/public-ai.ts`).
- Pendiente del usuario: `npx wrangler secret put ADMIN_PASSWORD --env production`.

## Cómo funciona
- **Stack:** React 19 + Vite + Cloudflare Worker (`@cloudflare/vite-plugin`). D1, KV y R2 locales en `.wrangler/state`. pnpm, Biome, Vitest, TanStack Query.
- **Arranque:** `pnpm dev` (127.0.0.1:5174) o `Iniciar-Servidor-Local.cmd`. Para apagar: botón «Apagar servidor» o `Apagar-Servidor.cmd`.
- **Migraciones locales:** `npx wrangler d1 migrations apply DB --local` (la última es `0012_developer_lab_runs.sql`, ya aplicada).
- **Rutas API nuevas:** se registran en `worker/extra-routes.ts` (`ExtraRouter`). Ya hay: github, model-hub, market-forecast y llm-map. El laboratorio está en `worker/developer-lab/router.ts`.
- **Estilos:** un CSS por módulo (`src/features/<x>/<x>.css`) que solo usa los tokens de `src/app/styles/global.css`. Fuentes: Public Sans e IBM Plex Mono.
- **Reglas:**
  - Nunca inventar datos: si falta una fuente, la interfaz dice «no configurado».
  - Los secretos van solo en `.dev.vars` (en gitignore).
  - El hook de pre-push exige que pasen lint y build.
- **Verificación antes de subir:** `npx tsc -b`, `npx vitest run` (196 tests OK), `npx biome check .` y `pnpm build`.

## Hecho
- **Shell:**
  - menú plegable (Ctrl+B), cabecera fija y 4 temas, incluidos los de alto contraste;
  - logo y favicon nuevos, y botón «Apagar servidor» (`scripts/dev-server-control.ts`).
- **Hoy:** tabla de 50 modelos. **Proveedores:** migración `0009` con 18 proveedores (Qwen, Moonshot, Zhipu…). **Precios:** precios en vivo de OpenRouter.
- **Mercado:** proyección Holt rotulada como tal. **Mapa:** origen de los LLM en 4 capas.
- **GitHub:** explorador por tipos y topics, «Aprende sobre mí» y visor interno de README y archivos.
- **Evolución IA:**
  - timeline alternado izquierda/derecha, árbol de ramas y grafo de conceptos;
  - se arregló la barra de eras que se encogía y se dio estilo a los filtros de rama.
- **Modelos** (`/models`, `src/features/models/ModelExplorer.tsx`):
  - explorador por necesidad: el texto libre se convierte en filtros (`parseNeed`);
  - ranking 1–10 con criterio y metodología (`lib/models/ranking.ts`) y panel de procedencia por país;
  - ficha técnica (`ModelSheet.tsx`) con botón a `/open-local?model=`;
  - la vista anterior sigue en el botón «Rankings de APIs».
- **Descarga de modelos** (`/open-local`, `src/features/local-models/`):
  - `LocalModelManager.tsx` es la interfaz: elegir carpeta (File System Access, solo Chrome/Edge), analizar un repositorio de Hugging Face, elegir el paquete GGUF o el modelo completo (safetensors);
  - `glossary.ts`: explicación de GGUF, de la cuantización, de la calidad, del uso recomendado y de la RAM necesaria;
  - `downloadManager.ts`: cola global a nivel de módulo. Permite varias descargas a la vez y siguen aunque cambies de módulo; avisa al cerrar la pestaña;
  - `downloader.ts`, archivos de 128 MB o más: 4 conexiones Range (`fetchParallel`). Cada segmento reintenta con backoff y retoma desde su propio offset; el progreso por segmento se guarda en `amaru-model.json` (`segments`), así que «Reanudar» continúa como un torrent;
  - `downloader.ts`, en general: escrituras en bloques de 8 MB, checkpoint cada 1 GB y SHA-256 en un Web Worker (`hash.worker.ts`);
  - biblioteca con estados, «Reanudar», «Versión» (compara con la última revisión publicada; nunca borra) y «Eliminar» (con confirmación).
- **Laboratorio de APIs:**
  - vista «En vivo» (`LiveConsole.tsx`): streaming SSE, razonamiento y respuesta por separado, máximo de salida configurable (4096 por defecto), métricas y promedio de costo por modelo (`/api/developer-lab/runs/stats`);
  - banco de pruebas: ahora devuelve `reasoningText` y `finishReason`, y avisa si el límite de tokens se gastó razonando.

## Favoritos (hecho)
- `src/features/favorites/favorites.ts` es un almacén en localStorage (`amaru.favorites.v1`) de tipos `model`, `repo` y `guide`, con el hook `useFavorites()`. `FavoriteStar.tsx` es el botón de estrella.
- La estrella está en el ranking de Modelos, en el inspector de GitHub (`RepoInspector.tsx`) y en las tarjetas de Open y local.
- La vista `/favorites` («Mis favoritos», en el menú, `FavoritesPage.tsx`) muestra:
  - los guardados, filtrados por tipo;
  - solo los guardados, filtrados por tipo.
- **Mis repositorios** se movió al explorador de GitHub, como primer grupo del menú lateral (`GitHubPage.tsx`, `Source` del tipo `mine`).
  - Endpoint `/api/github/mine?user=oprbguitar` en `worker/routes/github.ts`: con un `GITHUB_TOKEN` del mismo usuario usa `/user/repos?affiliation=owner`, que incluye los privados; sin token, solo los públicos.
  - Hay un filtro Todos / Públicos / Privados y la marca `isPrivate` en `RepoSummary`.
- El CSP de `worker/index.ts` ahora permite `api.github.com` y Hugging Face en `connect-src`.
- **Falta:**
  - mover el usuario de GitHub a Ajustes;
  - opcional: guardar los favoritos en D1.

## Pedido nuevo del usuario: análisis de repositorios y contraste con los suyos
No requiere IA para los datos técnicos: se obtiene todo de forma determinista con la API de GitHub. La IA es opcional, solo para redactar un resumen narrativo, por ejemplo con Workers AI (`env.AI`) o un proveedor del laboratorio, y debe ir rotulada como generada.
1. **Mis repositorios:**
   - **hecho, en básico:** lista de los repositorios de `oprbguitar` en `/favorites`. Falta el campo en Ajustes;
   - endpoint `/api/github/user-repos?user=` (GET `users/{u}/repos?per_page=100&sort=pushed`, con caché en KV);
   - pestaña «Mis repositorios» en `GitHubPage`, con selección múltiple y opción de añadir repositorios propios a mano.
2. **Ficha técnica del repositorio** (`/api/github/analyze?repo=`, en `worker/routes/github.ts`, lógica en `lib/github/analyze.ts`):
   - lenguajes (`/languages`), topics, licencia, `pushed_at`, issues abiertos, estrellas y forks, si está archivado;
   - tecnologías detectadas: leer `package.json`, `pyproject.toml`/`requirements.txt`, `Cargo.toml`, `go.mod`, `Dockerfile`, `vite.config`, `next.config`, `tailwind.config` y `tsconfig`. Mapear dependencias a categorías (framework UI, CSS, build, tests, backend, base de datos, IA);
   - desfase: consultar `https://registry.npmjs.org/<pkg>/latest` para las 10–15 dependencias principales y comparar versión mayor (al día / 1 versión atrás / desfasado), más los meses desde el último push;
   - para repositorios de diseño, detectar design tokens, Storybook, Figma tokens, Tailwind o shadcn, y fuentes;
   - salida en lista: «qué es», «tecnologías», «qué conviene usar», «riesgos y desfase», «cómo ejecutarlo». Cada dato con su fuente (archivo y URL).
3. **Contraste:** al elegir uno o varios repositorios propios, comparar tecnologías comunes y faltantes, versiones (cuál es más nuevo) y prácticas (tests, CI, licencia). Mostrar una tabla lado a lado y recomendaciones deterministas («adoptar X de este repo», «tu repo usa React 18, este React 19»).

## Pendiente
1. **Probar en el navegador** lo último:
   - descarga paralela con reanudación tras un corte de red, y la opción «Eliminar»;
   - Evolución IA, en 360, 768, 1280 y 1600 px.
2. **Modelos locales:**
   - mostrar en la interfaz el análisis de hardware (`hardware.ts`, `compat.ts`);
   - pruebas con Ollama (`ollama.ts`) y estado «ejecutable»;
   - categoría «modificados» con 3 ejes (`alignment.ts`).
   - La lógica ya existe y falta conectarla.
3. **Laboratorio:** modo comparar (dos modelos en paralelo, con `compareGroupId`) y precios para los modelos que muestran «Sin precio».
4. **Noticias, Investigación y Videos:**
   - tarjetas compactas con hover y más fuentes RSS;
   - «Actualizar» que refresque todo;
   - ocultar fechas centinela (`lib/external/dates.ts`);
   - lector interno;
   - arreglar la sincronización de videos y añadir plataformas.
5. **Verificar** Biblioteca local (rediseño como mediateca), Mi laboratorio (`LaboratoryTimeline.tsx`) e Integraciones (más APIs y diseño compacto).
6. **Ajustes menores:**
   - claves de mercado en `.dev.vars.example` (`ALPHA_VANTAGE_API_KEY`, `FMP_API_KEY`, `POLYGON_API_KEY`, `MARKETSTACK_API_KEY`, `TIINGO_API_KEY`);
   - añadir `https://*.github.io` a `frame-src` del CSP en `worker/index.ts`;
   - en `docs/index.html` (línea 11), cambiar el favicon por `favicon-32.png`;
   - precios estáticos de imagen, video y audio;
   - dos avisos `!important` en `evolution.css`;
   - ejecutar `node ..\AI-Design-Harness\bin\design-lint.mjs .` y `design-log.mjs`;
   - actualizar `README.md`.
