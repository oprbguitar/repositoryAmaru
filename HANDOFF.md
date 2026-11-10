# Traspaso — rediseño AMARU (2026-11-09)

Instrucciones para la IA que continúe. Rama: `feat/integrations-market-realtime`. Lee primero `AGENTS.md`, `DESIGN.md` y `docs/migracion-y-despliegue.md`.

## Estado verificado al cerrar
- `npx tsc -b` pasa sin errores; `npx vitest run` dio 193 tests OK.
- `npx biome check .` todavía da errores. Hay que corregirlos o excluir `docs/architecture-map.html` en `biome.json`. Los pendientes en código:
  - `src/features/evolution/EvolutionPage.tsx`: `useSemanticElements` y `useExhaustiveDependencies`.
  - `src/features/evolution/BranchTree.tsx`: `noArrayIndexKey`.
  - Avisos `noDescendingSpecificity` en los CSS.
- No se ha abierto nada en el navegador. Hay que arrancar `pnpm dev` (127.0.0.1:5174) y revisar cada módulo a 360, 768, 1280 y 1600 px.
- No se ejecutó la guía de diseño: `node ..\AI-Design-Harness\bin\design-lint.mjs .` ni `design-log.mjs`.

## Hecho
- **Shell:** menú plegable con Ctrl+B, cabecera fija, 4 temas (incluidos los de alto contraste), logo y favicon nuevos, botón «Apagar servidor» (plugin `scripts/dev-server-control.ts`), `Iniciar-Servidor-Local.cmd` y `Apagar-Servidor.cmd`.
- **Tokens:** fuentes Public Sans e IBM Plex Mono; registro de rutas en `worker/extra-routes.ts`.
- **Hoy:** tabla de 50 modelos paginada.
- **Proveedores:** migración `0009` con 18 proveedores nuevos (Qwen, Moonshot, Zhipu…).
- **Precios:** precios en vivo de OpenRouter en el catálogo de APIs.
- **Mercado:** proyección Holt rotulada como tal (`/api/market/forecast`) y proveedores de respaldo.
- **Mapa:** origen de los LLM con 4 capas (`/api/map/llm-origins`).
- **GitHub:** explorador por tipos y topics, «Aprende sobre mí», visor interno de README y árbol (`/api/github/*`).
- **Evolución IA:** timeline alternado tipo Prevenir, árbol de ramas y grafo de conceptos (falta el lint).

## Parcial (agentes detenidos a mitad: revisar el diff y completar)
1. **Modelos** (`ModelsRankingPage.tsx`, `lib/models/hub.ts`, `memory.ts`, `organizations.ts`, quizá `worker/routes/model-hub.ts`): explorador por necesidad, rankings 1–10, procedencia visual y ficha técnica con enlace a `/open-local?model=`.
2. **Modelos locales** (`src/features/local-models/`, `OpenLocalPage.tsx`):
   - descarga a una carpeta (File System Access), reanudable, con SHA-256;
   - inventario y control de versiones;
   - análisis del hardware y pruebas con Ollama;
   - categoría «modificados» con 3 ejes.
3. **Laboratorio de APIs** (`worker/developer-lab/*`, migración `0012`, fixtures en `tests/fixtures/developer-lab/`): streaming SSE en vivo, promedios de costo por modelo, modo comparar y más proveedores.
4. **Noticias, Investigación y Videos** (`lib/external/dates.ts` ya existe):
   - tarjetas compactas y más fuentes RSS;
   - «Actualizar» que refresque todo el scope;
   - ocultar fechas centinela (9999);
   - lector interno de texto completo;
   - arreglar la sincronización de videos y añadir más plataformas.
5. **Biblioteca local** (rediseño tipo mediateca ya escrito; verificar), **Mi laboratorio** (`LaboratoryTimeline.tsx`) e **Integraciones** (más APIs, más compacto).

## Integración pendiente
- Añadir a `.dev.vars.example`: `ALPHA_VANTAGE_API_KEY`, `FMP_API_KEY`, `POLYGON_API_KEY`, `MARKETSTACK_API_KEY`, `TIINGO_API_KEY`.
- CSP en `worker/index.ts`: añadir `https://*.github.io` a `frame-src` para la vista previa de GitHub.
- `docs/index.html` línea 11: cambiar `../public/favicon.svg` (borrado) por `favicon-32.png`.
- Actualizar `README.md` y la memoria del proyecto. Trabajar de uno en uno (el usuario pidió bajo consumo de tokens, sin subagentes en paralelo ni Fable).
