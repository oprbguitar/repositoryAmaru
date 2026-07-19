# Auditoría de integración de datos reales

Auditoría inicial realizada el 19 de julio de 2026. La interfaz conservaba el diseño aprobado, pero solo la Biblioteca local tenía un flujo completo hacia D1/R2. Todas las demás rutas utilizaban `PlaceholderWorkspace`; no existían colecciones de demostración ni precios ficticios en el código ejecutable.

| Módulo | Fuente actual al iniciar la auditoría | Estado | API o fuente requerida | Adaptador | Credencial faltante | Implementación |
|---|---|---|---|---|---|---|
| Hoy | Agregados de Biblioteca local | Real, incompleto | Agregados D1 de todas las fuentes | Dashboard D1 | Ninguna | Funcional con agregados D1 |
| Proveedores | Pantalla vacía explícita | Sin datos | Registro D1 y enlaces oficiales | Registro + catálogo | Algunas APIs privadas | Funcional; 17 proveedores registrados |
| Modelos | Pantalla vacía explícita | Sin datos | OpenRouter, Hugging Face y APIs configuradas | `models` | Claves opcionales | Funcional con OpenRouter/Hub y cuatro APIs configurables |
| Open y local | Pantalla vacía explícita | Sin datos | GitHub y Hugging Face | `github`, `hugging-face` | Token GitHub opcional | Funcional con datos recuperados |
| Noticias | Pantalla vacía explícita | Sin datos | RSS/Atom y changelogs oficiales | `official-feed` | Ninguna para feeds públicos | Funcional para OpenAI RSS; ampliar feeds |
| Investigación | Pantalla vacía explícita | Sin datos | arXiv, OpenAlex y Crossref | `arxiv`, `openalex`, `crossref` | Semantic Scholar opcional | Funcional con 160 registros iniciales |
| GitHub | Pantalla vacía explícita | Sin datos | GitHub REST Search | `github` | `GITHUB_TOKEN` opcional | Funcional; snapshots diarios activos |
| Videos | Pantalla vacía explícita | Sin datos | YouTube Data API | `youtube` | `YOUTUBE_API_KEY` | Pendiente de credencial |
| Mapa / Perú / LATAM | Pantalla vacía explícita | Sin datos | Agregados geográficos de OpenAlex/GitHub/noticias | Agregación D1 | Ninguna | Pendiente de cobertura suficiente |
| Mercado IA | Pantalla vacía explícita | Sin datos | Twelve Data, FMP, SEC y BCRPData | `sec-edgar`, `bcrp`, APIs de cotización | Claves de cotización | SEC/BCRP funcionales; cotizaciones pendientes de clave |
| Biblioteca local | Importador local, D1, R2 y FTS | Real | Directorio autorizado | `local-library` | Ninguna | Funcional |
| Mi laboratorio | Pantalla vacía explícita | Sin datos | Registros reales relacionados | Por definir | Por definir | Pendiente |
| Administración | Pantalla vacía explícita | Sin datos | Registro, ejecuciones y salud D1 | Orquestador de sincronización | Depende de fuente | Funcional con nueve acciones y salud real |
| Franja en vivo | Último escaneo local | Real, limitada | Eventos de cambios persistidos | `live_events` | Ninguna | Funcional con eventos persistidos |

## Hallazgos transversales

- El encabezado contenía la identidad ficticia `Ana P. / Investigador / AP`.
- No había adaptadores externos: la cola registraba `adapter_not_configured` y confirmaba el trabajo sin sincronizar.
- `source_registry` solo contenía Biblioteca local y no reunía toda la telemetría requerida.
- Los contadores existentes procedían de consultas D1 de la Biblioteca local. El gráfico de actividad de Hoy era decorativo y no una serie histórica real.
- Las rutas externas no mostraban estadísticas ficticias: mostraban un estado honesto de fuente no configurada.
- Las claves permanecen exclusivamente en `.dev.vars`; ninguna solicitud autenticada sale del navegador.

## Criterio de cierre

Una fuente se marca como conectada únicamente después de una respuesta HTTP satisfactoria persistida en `source_registry`. Los adaptadores sin credencial quedan en `not_configured`; un fallo conserva los últimos registros y los marca como caché potencialmente desactualizada.
