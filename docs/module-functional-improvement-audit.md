# Auditoría funcional de módulos — fase de mejora

Fecha: 2026-07-18. Auditoría previa a la implementación de la fase de mejora funcional
(mapa global, Perú/LATAM, rankings de modelos, GitHub, videos, laboratorio, densidad).

## Verificación de perfiles ficticios

Se buscó `Ana P.`, `Investigador`, avatar `AP` y menús de perfil ficticios en `src/`:
**no existen**. No se reintroducen.

## Estado por módulo

### /map — Mapa global
- **Ruta actual:** placeholder (`PlaceholderWorkspace` en `App.tsx`).
- **Componentes existentes:** ninguno específico.
- **Fuente de datos actual:** ninguna.
- **Datos hardcodeados:** ninguno (pantalla vacía honesta).
- **Faltante:** librería de mapas, endpoint GeoJSON, agregación por país, panel contextual.
- **Implementación planificada:** MapLibre GL JS + basemap OpenFreeMap (`styles/dark`),
  endpoint `/api/map/global` que genera GeoJSON desde registros D1 reales
  (papers OpenAlex/arXiv con países de autoría, proveedores con país verificado,
  instituciones OpenAlex con coordenadas provistas por la fuente), panel de país
  con conteos enlazados a registros. Centroides de país provienen de una tabla de
  referencia geográfica estática (`lib/geo/countries.ts`), no de datos inventados:
  solo posicionan agregados cuyo valor sale de la base.
- **Estado de pruebas:** sin pruebas → se agregan pruebas de generación GeoJSON y agregación.

### /peru y /latam — Radar regional
- **Ruta actual:** placeholders.
- **Faltante:** mapa regional, sincronización de instituciones LATAM, comparación regional.
- **Implementación planificada:** misma infraestructura MapLibre; nueva fuente
  `openalex-institutions` (API oficial OpenAlex `/institutions` con filtro
  `country_code` LATAM y coordenadas provistas por la fuente); endpoints
  `/api/map/peru` y `/api/map/latam`; comparación regional con advertencias de
  cobertura. SciELO, LA Referencia, ALICIA, PerúCRIS y RENATI quedan registradas en
  `source_registry` como `Fuente registrada — sincronización manual pendiente`
  (no se inventan endpoints).

### /models — Modelos
- **Ruta actual:** `CatalogPage mode="models"`.
- **Fuente real conectada:** OpenRouter (`/api/v1/models`), Hugging Face, APIs de cuenta.
- **Datos hardcodeados:** ninguno; pero sin rankings ni precios por proveedor.
- **Hallazgos verificados contra la API (2026-07-18):**
  - `GET /api/v1/models?order=…` es **ignorado** por la API pública (todas las
    variantes devuelven el mismo orden). Los rankings `most-popular`, `top-weekly`,
    `intelligence-*`, etc. **no están disponibles** vía API pública → se muestra
    `Ranking no disponible` en esas pestañas, sin sustitución silenciosa.
  - `GET /api/v1/models?category=programming` **sí** devuelve modelos ordenados por
    uso real en esa categoría (documentado) → pestañas de uso por categoría.
  - `GET /api/v1/models/:author/:slug/endpoints` devuelve ofertas por proveedor con
    precios, contexto y estado → tabla `model_offerings`.
- **Implementación planificada:** tablas `model_rankings` y `model_offerings`,
  adaptador de rankings (categorías de uso + órdenes deterministas calculados sobre
  el catálogo: precio, contexto, novedad, open/local, gratis, con fórmula visible),
  página con pestañas, comparador de precios por proveedor y panel colapsable.

### /github — Repositorios
- **Ruta actual:** `GitHubPage` con datos reales pero orden por actualización.
- **Problema:** el adaptador usa `sort=updated`; el ranking por estrellas no existe;
  "Crecimiento aún no calculable" está fijado en la celda aunque existan snapshots.
- **Ya existe:** tabla `repository_snapshots` alimentada en cada sincronización.
- **Implementación planificada:** adaptador con `sort=stars&order=desc` y consultas
  temáticas ampliadas; endpoint `/api/github/rankings` con vistas (estrellas,
  crecimiento con ≥2 snapshots, temas RAG/agentes/audio/visión, Perú-LATAM);
  crecimiento honesto calculado desde snapshots.

### /videos — Videos técnicos
- **Ruta actual:** placeholder.
- **Implementación planificada:** tablas `video_sources` y `video_items`; adaptador
  YouTube Data API v3 (clave verificada operativa el 2026-07-18) con grupos de
  consultas configurables (programación, IA local, investigación, español) y registro
  de canales oficiales; sincronización eficiente en cuota. Meta y X quedan como
  integraciones opcionales: sin credenciales se muestra
  `Integración de Meta no configurada` / estado equivalente para X. No se muestran
  videos falsos.

### /laboratory — Mi laboratorio
- **Ruta actual:** placeholder.
- **Implementación planificada:** tablas `laboratory_projects` y
  `laboratory_alternatives`; asistente de 7 pasos; motor de recomendación
  determinista basado en reglas que usa `model_offerings` (precios indexados
  reales), registros open/local y repositorios indexados; tres alternativas
  (económica, local/privada, profesional) con explicación, costos con
  `Costo parcial` cuando faltan datos; persistencia D1 y exportación MD/JSON.

### Espaciado y densidad
- **Problema actual:** panel contextual fijo de 304–320 px no colapsable; tablas
  estrechas; sin modos de densidad.
- **Implementación planificada:** panel contextual colapsable
  (`.module-layout.context-collapsed`), tokens de espaciado existentes respetados,
  cabeceras sticky ya presentes en `.observatory-table` (se conservan).

## Migraciones

Existentes: `0001_initial.sql`, `0002_real_data.sql` (incluye `repository_snapshots`,
`live_events`, `observatory_records`, `providers`, `source_registry` extendida).
Se agrega **solo** `0003_functional_modules.sql` (aditiva): `model_rankings`,
`model_offerings`, `map_locations`, `video_sources`, `video_items`,
`laboratory_projects`, `laboratory_alternatives`, más filas de registro de fuentes
(youtube, openalex-institutions, fuentes regionales manuales, meta, x).

## Credenciales

- `YOUTUBE_API_KEY`: provisto por el usuario, verificado, se guarda en `.dev.vars`.
- `META_APP_ID/SECRET`, tokens de página/IG, `X_BEARER_TOKEN`: no provistos →
  estados honestos de "no configurado".
