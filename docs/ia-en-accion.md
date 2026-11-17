# IA en acción — de la teoría a la práctica profesional

Módulo agregado el 2026-11-16 en la ruta `/in-action` (menú **Construir → IA en acción**). Lo pueden usar los visitantes, no solo el administrador.

## Qué hace

La persona no empieza eligiendo un modelo, sino **lo que necesita resolver en su profesión**:

1. **Buscador natural** («Quiero analizar planos», «Necesito investigar jurisprudencia») o **rejilla de 29 profesiones** agrupadas en 7 familias: salud, ingeniería y construcción, negocios y gestión, derecho y sector público, educación y comunicación, ciencias y agro, tecnología.
2. **Profesión → especialidad → caso práctico** (69 casos). La URL guarda la selección (`?p=contabilidad&c=conciliacion-bancaria`), así que cualquier caso se puede compartir.
3. **Ficha del caso**:
   - Qué necesitas, qué material usar y qué resultado esperar.
   - Escalera de 4 niveles: **Consultar → Investigar → Automatizar → Crear**. Cada nivel cambia las instrucciones de las dos rutas.
   - **Ruta comercial** (nube): asistentes recomendados para ese tipo de tarea, con el porqué, el primer plan de pago en US$ y **en soles con IGV**, y su estilo y precauciones (p. ej. cómo no agotar el uso de Claude).
   - **Ruta local** (privada): programa, modelos de ejemplo, modelo especializado cuando existe (MedGemma, Whisper…) y lo que soporta *tu* PC si ya la detectaste en Modelos.
   - **Oficina** (si el caso usa Excel, Word, PowerPoint u Outlook): cuándo conviene Copilot, Gemini, ChatGPT o Claude, y 2–3 enlaces de video puntuales.
   - **Prompt listo** con campos editables `[tema]`, botón Copiar y fuentes oficiales peruanas de la profesión.
   - Aviso de datos sensibles (Ley 29733) y advertencias profesionales.
4. Pestañas transversales:
   - **Planes en soles**: 11 asistentes (ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok, Meta AI/Muse, DeepSeek, Qwen, Kimi, Le Chat) con todos sus planes, alcance y advertencias. Explica la diferencia entre suscripción, API y ejecución local.
   - **Oficina con IA**: comparación de dónde trabaja cada asistente, guía «¿Copilot, ChatGPT o Claude para Excel?» y tareas por app.
   - **IA local y tu PC**: detección de hardware (la misma de Modelos, guardada solo en el navegador), escalones de RAM/VRAM, programas (Ollama, LM Studio, Jan, AnythingLLM, Open WebUI).
   - **Documentos y tokens**: formatos (MD, TXT, CSV, JSON, PDF, DOCX/XLSX), estimador didáctico de tokens y explicación de RAG.

## Datos y honestidad

- **Precios**: consultados el 2026-11-16 en páginas oficiales (claude.com/pricing, blog de Google) y coberturas secundarias cuando la página oficial no muestra cifras legibles (ChatGPT, Microsoft 365). Cada plan enlaza a su página oficial. Si un precio cambia por país (Gemini AI Plus, SuperGrok), se muestra «varía por país» en lugar de una cifra.
- **Soles**: precio de lista × tipo de cambio × 1,18 (IGV a servicios digitales de no domiciliados). El tipo de cambio es la **última observación numérica de BCRPData** (serie PD04640PD) que el observatorio ya sincroniza; el visitante puede corregirlo. Sin dato, la interfaz lo dice.
- **Videos**: son **búsquedas de YouTube** (`youtube.com/results?search_query=…`), no IDs de videos inventados; siempre funcionan y muestran material reciente.
- **Modelos locales**: ejemplos conocidos con su etiqueta de Ollama; el catálogo vivo y la verificación por PC están en **Modelos**.

## Archivos

| Archivo | Rol |
| --- | --- |
| `src/features/in-action/professions.ts` | Profesiones, especialidades, casos, prompts y buscador (pondera palabras raras). |
| `src/features/in-action/tools.ts` | Asistentes y planes, matriz «tipo de tarea → herramienta», runtimes locales, escalones de hardware, comparación de oficina. |
| `src/features/in-action/useFx.ts` | Tipo de cambio BCRP desde `/api/records`. |
| `src/features/in-action/InActionPage.tsx` | Pestañas, buscador, rejilla y vista de profesión. |
| `src/features/in-action/CaseSheet.tsx` | Ficha del caso. |
| `src/features/in-action/Guides.tsx` | Planes, oficina, IA local, documentos. |
| `src/features/in-action/in-action.css` | Estilos con prefijo `ia-`, solo tokens. |
| `tests/in-action.test.ts` | Integridad del catálogo, buscador, IGV, BCRP y escalones. |

## Cómo ampliar

- **Nuevo caso**: agrega un objeto en la especialidad correspondiente de `professions.ts`. Elige `kind` (research, sheets, writing, slides, visual, code, study, data): eso decide qué herramientas se recomiendan. `office`, `sensitive`, `caution`, `local` y `videos` son opcionales.
- **Nuevo asistente o cambio de precio**: edita `ASSISTANTS` en `tools.ts` y actualiza `PRICES_CHECKED_AT`.
- **Nueva profesión**: agrega el objeto con su `group` e `icon` (nombre de un ícono importado en `shared.tsx`).

## Verificación

`pnpm typecheck`, `pnpm lint`, `pnpm test` y `design-lint` (0/20) aprobados; revisado en el navegador a 360, 1024 y 1280 px sin desborde horizontal.
