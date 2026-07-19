# Arquitectura definitiva sin Supabase

## AMARU AI Observatory — Cloudflare Native

**Fecha de definición:** 18 de julio de 2026
**Objetivo:** construir un visor informativo autoindexado, actualizable y de bajo costo, sin depender de Supabase ni Vercel.

---

# 1. Decisión tecnológica recomendada

## Solución principal

Utilizar una arquitectura completamente integrada con Cloudflare:

```text
GitHub
   │
   ▼
Cloudflare Workers + Static Assets
   │
   ├── API interna
   ├── autenticación
   ├── filtros
   ├── búsquedas
   └── presentación del visor
          │
          ├── D1 ───────── Datos estructurados
          ├── R2 ───────── Archivos, snapshots y mapas
          ├── KV ───────── Caché y configuración
          ├── Queues ───── Trabajos de indexación
          ├── Cron ─────── Actualizaciones programadas
          ├── Workers AI ─ Resúmenes y clasificación
          └── Vectorize ── Búsqueda semántica opcional
```

## Conclusión

**No es necesario reemplazar Supabase con otra plataforma completa.**

Para este producto, Cloudflare puede cubrir:

* Frontend.
* Backend.
* Base de datos.
* almacenamiento.
* caché.
* procesos programados.
* colas.
* búsqueda semántica.
* generación de resúmenes.
* protección del portal.
* alojamiento de mapas.

Esto reduce dependencias, evita duplicar configuraciones y permite mantener el observatorio inicialmente dentro de planes gratuitos.

---

# 2. Componentes de Cloudflare

## 2.1. Cloudflare Workers y Static Assets

Se utilizarán para:

* Alojar la aplicación.
* Entregar React, TypeScript, CSS e imágenes.
* Ejecutar la API.
* Consultar proveedores externos.
* Aplicar filtros.
* gestionar favoritos.
* mostrar las novedades.
* proteger las claves privadas.

El plan gratuito admite actualmente 100 000 solicitudes diarias, hasta 100 Workers y cinco Cron Triggers por cuenta. Los archivos estáticos no consumen las solicitudes dinámicas ordinarias.

### Estrategia recomendada

No crear un Cron Trigger por cada fuente.

Utilizar un único disparador principal:

```text
Cron Dispatcher
      │
      ├── 00: modelos
      ├── 01: noticias
      ├── 02: GitHub
      ├── 03: investigaciones
      ├── 04: videos
      └── 05: Perú y Latinoamérica
```

El Dispatcher consultará una tabla de programación y decidirá qué indexadores ejecutar.

---

## 2.2. Cloudflare D1

D1 reemplazará la base PostgreSQL de Supabase.

Se utilizará para almacenar:

* Proveedores.
* Modelos.
* precios.
* capacidades.
* noticias.
* investigaciones.
* repositorios.
* videos.
* países.
* instituciones.
* favoritos.
* historial de cambios.
* estados de indexación.
* fuentes.
* etiquetas.
* recomendaciones.

El plan gratuito admite diez bases por cuenta, hasta 500 MB por base y 5 GB totales. Incluye cinco millones de filas leídas y 100 000 filas escritas diariamente. D1 no cobra transferencia de salida.

### Por qué es suficiente

El observatorio almacenará principalmente:

* Metadatos.
* títulos.
* precios.
* enlaces.
* fechas.
* etiquetas.
* resúmenes.
* relaciones.
* estados.

No almacenará artículos completos, videos ni grandes archivos dentro de D1.

Por ello, 500 MB pueden albergar cientos de miles de registros compactos. Esta es una estimación de arquitectura, no una garantía fija: dependerá del tamaño de los resúmenes y del número de versiones conservadas.

### Distribución propuesta

```text
amaru-observatory-main
├── proveedores
├── modelos
├── herramientas
├── noticias
├── investigaciones
├── videos
├── repositorios
├── países
└── usuarios

amaru-observatory-history
├── precios históricos
├── versiones
├── snapshots
└── auditoría
```

Inicialmente bastaría una sola base. La segunda se utilizaría cuando el historial crezca.

---

## 2.3. Cloudflare R2

R2 almacenará:

* Respuestas originales de las API.
* Archivos JSON.
* XML y RSS recuperados.
* imágenes autorizadas.
* miniaturas propias.
* exports CSV o JSON.
* snapshots históricos.
* archivos PMTiles del mapa.
* copias temporales para reprocesamiento.

El nivel gratuito de R2 incluye 10 GB-mes, un millón de operaciones de clase A y diez millones de operaciones de clase B mensuales. La transferencia directa desde R2 no tiene costo de salida.

### Regla

D1 almacenará el dato procesado.

R2 almacenará el contenido original:

```text
D1:
Título, proveedor, fecha, resumen y etiquetas.

R2:
Respuesta JSON/XML original que originó el registro.
```

Esto permitirá comprobar posteriormente cómo se obtuvo una información.

---

## 2.4. Workers KV

KV se utilizará exclusivamente para:

* Caché de consultas frecuentes.
* Configuración activa.
* listas de fuentes.
* fecha de última actualización.
* estado del indexador.
* preferencias rápidas.
* resultados temporales.

Su plan gratuito incluye 100 000 lecturas y 1 000 escrituras diarias, además de 1 GB almacenado.

No se utilizará como base principal porque está orientado a lecturas rápidas de clave-valor, no a relaciones complejas.

---

## 2.5. Cloudflare Queues

Queues permitirá separar la captura del procesamiento:

```text
Indexador
   │
   ▼
Queue
   │
   ├── validar
   ├── normalizar
   ├── deduplicar
   ├── resumir
   ├── clasificar
   └── guardar
```

El plan gratuito incluye 10 000 operaciones diarias y una retención máxima de 24 horas.

Queues debe incorporarse cuando aumente el número de fuentes. El MVP puede funcionar inicialmente sin colas.

---

## 2.6. Workers AI

Workers AI puede realizar:

* Clasificación temática.
* traducción al español.
* resumen sencillo.
* resumen profesional.
* extracción de entidades.
* detección de países.
* generación de etiquetas.
* comparación de novedades.
* explicación de utilidad.

Cloudflare informa que Workers AI está disponible en planes gratuitos y pagados y ofrece un catálogo de modelos alojados. La asignación gratuita actual es de 10 000 Neurons diarios.

No debe utilizarse para determinar hechos, precios o fechas. Esos datos deben provenir de la fuente original.

---

## 2.7. Vectorize

Vectorize puede utilizarse posteriormente para:

* Búsqueda semántica.
* Noticias relacionadas.
* Recomendación de herramientas.
* Relación entre papers y proyectos.
* Consultas por intención.

Existe una inconsistencia actual en la documentación de Cloudflare: la página específica de Vectorize publica una asignación gratuita de dimensiones consultadas y almacenadas, mientras que la página general de precios de Workers mantiene una indicación contradictoria sobre su disponibilidad. Por ello, debe considerarse **opcional** y verificarse directamente en tu panel antes de convertirlo en una dependencia estructural.

El MVP puede comenzar sin Vectorize.

---

# 3. Costo estimado

## Etapa inicial

| Componente   |             Plan esperado |
| ------------ | ------------------------: |
| Frontend     |                      US$0 |
| Worker API   |                      US$0 |
| D1           |                      US$0 |
| R2           |                      US$0 |
| KV           |                      US$0 |
| Queues       |                      US$0 |
| Workers AI   | US$0 dentro de asignación |
| MapLibre     |                      US$0 |
| OpenFreeMap  |                      US$0 |
| Dominio      |             Ya disponible |
| API externas |           Según proveedor |

## Etapa estable

Cuando la actualización sea más intensiva, el primer salto razonable sería contratar **Workers Paid**, cuyo cargo mínimo actual es de US$5 mensuales por cuenta.

Por tanto:

> **El observatorio puede comenzar con costo de infraestructura cercano a US$0 y escalar inicialmente desde US$5 mensuales, sin considerar API externas de pago.**

---

# 4. Alternativa externa: Neon

Cuando sea indispensable utilizar PostgreSQL real, la alternativa externa recomendada es **Neon**:

* [Neon](https://neon.com)
* [Consola](https://console.neon.tech)
* [Documentación](https://neon.com/docs)
* [Precios](https://neon.com/pricing)

Su plan gratuito publica hasta 100 proyectos, 100 CU-horas mensuales por proyecto y escalamiento a cero cuando la base está inactiva. Sus planes pagados se facturan por consumo sin una mensualidad mínima general.

## Cuándo elegir Neon

Elegir Neon únicamente si necesitas:

* PostgreSQL.
* consultas SQL complejas.
* extensiones de PostgreSQL.
* migración directa desde Supabase.
* compatibilidad con herramientas PostgreSQL.
* una base que posteriormente utilizarán otras aplicaciones.

## Recomendación concreta

Para AMARU AI Observatory:

> **Cloudflare D1 como opción principal. Neon como plan de contingencia, no como dependencia inicial.**

Appwrite no soluciona realmente el problema porque su plan gratuito también limita la cantidad de proyectos gratuitos. Firebase es viable, pero su modelo NoSQL añade complejidad innecesaria para un catálogo altamente relacionado y versionado.

---

# 5. Inventario maestro de fuentes y API

No existe una lista finita de “todas las API de inteligencia artificial”, porque aparecen, cambian y desaparecen permanentemente. La solución correcta es construir un **registro extensible de fuentes**.

El siguiente inventario constituye la cobertura inicial recomendada.

---

# 6. Catálogo de modelos y proveedores

## 6.1. Agregadores prioritarios

### OpenRouter

**Función:** catálogo normalizado de cientos de modelos, precios, contexto, modalidades y proveedores.

* [Modelos](https://openrouter.ai/models)
* [Documentación](https://openrouter.ai/docs)
* [API](https://openrouter.ai/docs/api-reference/overview)
* [API keys](https://openrouter.ai/settings/keys)
* Endpoint: `GET https://openrouter.ai/api/v1/models`

OpenRouter ofrece un endpoint unificado para recuperar los modelos disponibles y sus identificadores.

**Prioridad:** crítica.

---

### Hugging Face Hub

**Función:** modelos, datasets, Spaces, licencias, descargas, tags y actividad.

* [Hub](https://huggingface.co)
* [Modelos](https://huggingface.co/models)
* [Datasets](https://huggingface.co/datasets)
* [Spaces](https://huggingface.co/spaces)
* [Trending](https://huggingface.co/models?sort=trending)
* [API](https://huggingface.co/docs/hub/api)
* [Tokens](https://huggingface.co/settings/tokens)
* OpenAPI: `https://huggingface.co/.well-known/openapi.json`

Hugging Face dispone de endpoints abiertos, clientes para Python y JavaScript, OpenAPI y webhooks para cambios incrementales.

**Prioridad:** crítica.

---

## 6.2. Proveedores directos

| Proveedor            | Catálogo y documentación                                                                                                                                                                                                     | Datos que se capturarán                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| OpenAI               | [Modelos](https://platform.openai.com/docs/models) · [API](https://platform.openai.com/docs/api-reference/models) · [Precios](https://openai.com/api/pricing/)                                                               | Modelos, modalidades, precios, límites y estado              |
| Anthropic            | [Documentación](https://docs.anthropic.com) · [Modelos](https://docs.anthropic.com/en/docs/about-claude/models) · [Precios](https://docs.anthropic.com/en/docs/about-claude/pricing)                                         | Claude, contexto, precios, capacidades y retiros             |
| Google Gemini        | [Modelos](https://ai.google.dev/gemini-api/docs/models) · [Precios](https://ai.google.dev/gemini-api/docs/pricing) · [Changelog](https://ai.google.dev/gemini-api/docs/changelog) · [AI Studio](https://aistudio.google.com) | Modelos estables, preview, experimentales, precios y cuotas  |
| Mistral AI           | [Modelos](https://docs.mistral.ai/getting-started/models/) · [API](https://docs.mistral.ai/api/) · [Consola](https://console.mistral.ai)                                                                                     | Modelos, OCR, audio, agentes, estado y precios               |
| Groq                 | [Modelos](https://console.groq.com/docs/models) · [API](https://console.groq.com/docs/api-reference) · [Changelog](https://console.groq.com/docs/changelog)                                                                  | Modelos alojados, velocidad, audio y deprecaciones           |
| NVIDIA               | [NVIDIA Build](https://build.nvidia.com) · [NIM](https://docs.nvidia.com/nim/) · [API Catalog](https://build.nvidia.com/explore/discover)                                                                                    | NIM, Nemotron, embeddings, RAG, audio, visión y contenedores |
| Cohere               | [Modelos](https://docs.cohere.com/docs/models) · [API](https://docs.cohere.com/reference/about) · [Changelog](https://docs.cohere.com/changelog)                                                                             | Command, Embed, Rerank, contexto y estado                    |
| Together AI          | [Modelos](https://api.together.ai/models) · [Documentación](https://docs.together.ai) · [Precios](https://www.together.ai/pricing)                                                                                           | Modelos abiertos alojados, serverless y endpoints dedicados  |
| Cloudflare AI        | [Modelos](https://developers.cloudflare.com/workers-ai/models/) · [Precios](https://developers.cloudflare.com/workers-ai/platform/pricing/)                                                                                  | Catálogo de Workers AI, modalidad y consumo                  |
| Fireworks AI         | [Modelos](https://fireworks.ai/models) · [Documentación](https://docs.fireworks.ai)                                                                                                                                          | Modelos abiertos, serverless y dedicados                     |
| Replicate            | [Modelos](https://replicate.com/explore) · [API](https://replicate.com/docs/reference/http)                                                                                                                                  | Modelos de texto, imagen, audio y video                      |
| Cerebras             | [Documentación](https://inference-docs.cerebras.ai) · [Consola](https://cloud.cerebras.ai)                                                                                                                                   | Modelos e inferencia de alta velocidad                       |
| xAI                  | [Documentación](https://docs.x.ai) · [Consola](https://console.x.ai)                                                                                                                                                         | Modelos Grok, capacidades y precios                          |
| DeepInfra            | [Modelos](https://deepinfra.com/models) · [API](https://deepinfra.com/docs)                                                                                                                                                  | Modelos alojados y precios                                   |
| DeepSeek             | [Plataforma](https://platform.deepseek.com) · [Documentación](https://api-docs.deepseek.com)                                                                                                                                 | Modelos, API y cambios                                       |
| Alibaba Model Studio | [Model Studio](https://www.alibabacloud.com/en/product/modelstudio)                                                                                                                                                          | Qwen y servicios asociados                                   |
| Baidu AI Cloud       | [Baidu AI](https://cloud.baidu.com/product/wenxinworkshop)                                                                                                                                                                   | Modelos y servicios de China                                 |
| Tencent Cloud AI     | [Tencent AI](https://www.tencentcloud.com/products/hunyuan)                                                                                                                                                                  | Hunyuan y servicios empresariales                            |
| Huawei Cloud AI      | [ModelArts](https://www.huaweicloud.com/intl/en-us/product/modelarts.html)                                                                                                                                                   | Modelos, entrenamiento y despliegue                          |
| Amazon Bedrock       | [Modelos](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)                                                                                                                                        | Modelos disponibles por región                               |
| Azure AI Foundry     | [Catálogo](https://ai.azure.com/explore/models)                                                                                                                                                                              | Modelos de Microsoft y asociados                             |
| Google Vertex AI     | [Model Garden](https://cloud.google.com/model-garden)                                                                                                                                                                        | Modelos propios y de terceros                                |

OpenAI, Gemini, Mistral, Groq, NVIDIA, Cohere y Together mantienen catálogos o documentación oficial que debe considerarse la fuente principal para precios, capacidades y retiros.

## Estrategia de captura

1. Consultar OpenRouter y Hugging Face para descubrimiento.
2. Consultar al proveedor oficial para verificación.
3. Guardar ambos registros.
4. Mostrar el dato oficial como prioritario.
5. Registrar cualquier discrepancia.

---

# 7. Ejecución local y open source

| Plataforma            | Enlaces                                                                                         | Información                       |
| --------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Ollama                | [Modelos](https://ollama.com/search) · [API](https://docs.ollama.com/api)                       | Modelos ejecutables localmente    |
| LM Studio             | [Aplicación](https://lmstudio.ai) · [API local](https://lmstudio.ai/docs/developer/core/server) | Descarga y servidor local         |
| vLLM                  | [Documentación](https://docs.vllm.ai)                                                           | Servidor de inferencia            |
| llama.cpp             | [GitHub](https://github.com/ggml-org/llama.cpp)                                                 | Inferencia local y cuantizaciones |
| LocalAI               | [GitHub](https://github.com/mudler/LocalAI)                                                     | API local compatible              |
| Open WebUI            | [GitHub](https://github.com/open-webui/open-webui)                                              | Interfaz local                    |
| Jan                   | [GitHub](https://github.com/menloresearch/jan)                                                  | Asistente local                   |
| GPT4All               | [Modelos](https://www.nomic.ai/gpt4all)                                                         | Modelos locales                   |
| text-generation-webui | [GitHub](https://github.com/oobabooga/text-generation-webui)                                    | Experimentación local             |
| ComfyUI               | [GitHub](https://github.com/comfyanonymous/ComfyUI)                                             | Generación visual local           |
| Whisper               | [GitHub](https://github.com/openai/whisper)                                                     | Transcripción local               |
| faster-whisper        | [GitHub](https://github.com/SYSTRAN/faster-whisper)                                             | Transcripción optimizada          |

Cada registro debe distinguir:

```text
open_source
open_weight
source_available
free_api
free_trial
local_execution
commercial_use
license_name
license_url
minimum_ram
recommended_vram
ollama_compatible
docker_available
```

---

# 8. Repositorios y desarrollo

## GitHub

* [REST API](https://docs.github.com/en/rest)
* [GraphQL API](https://docs.github.com/en/graphql)
* [API tokens](https://github.com/settings/tokens)
* [Search repositories](https://docs.github.com/en/rest/search/search)
* [Releases](https://docs.github.com/en/rest/releases/releases)
* [Events](https://docs.github.com/en/rest/activity/events)

Datos:

* Repositorio.
* propietario.
* fecha de creación.
* última actualización.
* estrellas.
* forks.
* issues.
* releases.
* contribuidores.
* licencia.
* lenguajes.
* topics.
* README.
* homepage.
* estado de mantenimiento.

La API oficial permite construir un ranking propio; no debe dependerse exclusivamente de una página visual de tendencias.

## GitLab

* [REST API](https://docs.gitlab.com/api/)
* [Projects API](https://docs.gitlab.com/api/projects.html)

## Codeberg

* [API](https://codeberg.org/api/swagger)

---

# 9. Investigación científica

| Fuente              | Enlace                                                         | Uso                                              |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| OpenAlex            | [API](https://developers.openalex.org)                         | Trabajos, autores, instituciones, países y temas |
| arXiv               | [API](https://info.arxiv.org/help/api/index.html)              | Preprints recientes                              |
| Crossref            | [REST API](https://api.crossref.org)                           | DOI, publicaciones y metadatos                   |
| Semantic Scholar    | [API](https://api.semanticscholar.org/api-docs/)               | Papers, citas, autores y recomendaciones         |
| Hugging Face Papers | [Papers](https://huggingface.co/papers)                        | Papers y código asociado                         |
| OpenReview          | [API](https://docs.openreview.net)                             | Conferencias y revisiones                        |
| DataCite            | [API](https://support.datacite.org/docs/api)                   | DOI de datasets y software                       |
| ORCID               | [API](https://info.orcid.org/documentation/integration-guide/) | Identidad de investigadores                      |
| Zenodo              | [API](https://developers.zenodo.org)                           | Publicaciones, datasets y software               |
| OpenAIRE            | [API](https://graph.openaire.eu/develop/api.html)              | Investigación europea                            |
| CORE                | [API](https://core.ac.uk/services/api)                         | Literatura de acceso abierto                     |

OpenAlex expone trabajos, autores, instituciones, fuentes, temas, países y financiadores mediante una API estructurada. Crossref y Semantic Scholar proporcionan metadatos académicos y relaciones bibliográficas.

---

# 10. Perú y Latinoamérica

| Fuente          | Método                          | Contenido                                 |
| --------------- | ------------------------------- | ----------------------------------------- |
| ALICIA–CONCYTEC | OAI-PMH y repositorios          | Investigación peruana                     |
| PerúCRIS        | API solicitada, CERIF y OAI-PMH | Investigadores, instituciones y proyectos |
| SciELO          | ArticleMeta API                 | Publicaciones latinoamericanas            |
| LA Referencia   | OAI-PMH                         | Repositorios regionales                   |
| RENATI          | Consulta y repositorios         | Tesis peruanas                            |
| Latindex        | Catálogo                        | Revistas académicas                       |
| Redalyc         | Portal y metadatos              | Publicaciones latinoamericanas            |
| BID             | API y datos abiertos            | Innovación y desarrollo                   |
| CEPALSTAT       | API y datasets                  | Indicadores regionales                    |
| Banco Mundial   | API                             | Indicadores económicos y tecnológicos     |

Enlaces principales:

* [ALICIA](https://alicia.concytec.gob.pe)
* [PerúCRIS](https://perucris.concytec.gob.pe)
* [SciELO API](https://docs.scielo.org)
* [LA Referencia](https://www.lareferencia.info)
* [RENATI](https://renati.sunedu.gob.pe)
* [CEPALSTAT](https://statistics.cepal.org)
* [Banco Mundial API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information)

ALICIA, PerúCRIS y LA Referencia utilizan protocolos o formatos orientados a interoperabilidad académica, especialmente OAI-PMH y CERIF en determinados servicios.

---

# 11. Noticias y avances

## Jerarquía de captura

```text
1. Changelog oficial
2. Blog oficial
3. RSS/Atom oficial
4. Repositorio oficial
5. Paper
6. Organismo público
7. Agencia de noticias
8. Medio tecnológico
9. Red social como señal
```

## Fuentes y API

### GDELT Cloud

* [Documentación](https://docs.gdeltcloud.com)
* [API v2](https://docs.gdeltcloud.com/api-reference/v2)
* [Panel](https://gdeltcloud.com)

Puede proporcionar eventos, historias agrupadas, entidades y descubrimiento geográfico. Debe utilizarse para detectar señales, no como única verificación.

### The Guardian Open Platform

* [Open Platform](https://open-platform.theguardian.com)
* [API](https://content.guardianapis.com)

Uso:

* noticias tecnológicas.
* búsqueda.
* fecha.
* sección.
* etiquetas.
* URL original.

### NewsAPI

* [NewsAPI](https://newsapi.org)
* [Documentación](https://newsapi.org/docs)

El plan gratuito está destinado a desarrollo y pruebas; para un portal público en producción debe revisarse el plan comercial.

### Event Registry / NewsAPI.ai

* [Portal](https://newsapi.ai)
* [Documentación](https://newsapi.ai/documentation)

### MediaStack

* [API](https://mediastack.com)

### Currents API

* [API](https://currentsapi.services)

### Hacker News

* [Firebase API](https://github.com/HackerNews/API)

### DEV Community

* [API](https://developers.forem.com/api)

### Reddit

* [API](https://www.reddit.com/dev/api/)

Reddit, Hacker News y redes comunitarias deben considerarse señales de interés, no fuentes de confirmación.

## Información que se conservará

* Título.
* fecha.
* medio.
* autor.
* URL canónica.
* fragmento breve.
* resumen propio.
* entidades.
* país.
* tema.
* confianza.

No se almacenará ni publicará el artículo completo.

---

# 12. Changelogs oficiales

El portal tendrá un registro configurable:

```text
provider_changelog_sources
├── provider_id
├── source_url
├── source_type
├── rss_url
├── last_checked_at
├── last_item_hash
└── is_active
```

Fuentes iniciales:

* [OpenAI Changelog](https://platform.openai.com/docs/changelog)
* [Google Gemini Changelog](https://ai.google.dev/gemini-api/docs/changelog)
* [Anthropic Release Notes](https://docs.anthropic.com/en/release-notes/overview)
* [Mistral Changelog](https://docs.mistral.ai/getting-started/changelog/)
* [Groq Changelog](https://console.groq.com/docs/changelog)
* [Hugging Face Blog](https://huggingface.co/blog)
* [NVIDIA Developer Blog](https://developer.nvidia.com/blog)
* [Cloudflare AI Changelog](https://developers.cloudflare.com/changelog/product-group/ai/)
* [GitHub Changelog](https://github.blog/changelog/)
* [AWS What's New](https://aws.amazon.com/new/)
* [Azure Updates](https://azure.microsoft.com/updates/)
* [Google Cloud Release Notes](https://cloud.google.com/release-notes)

---

# 13. Videos

## YouTube Data API

* [Documentación](https://developers.google.com/youtube/v3)
* [Search](https://developers.google.com/youtube/v3/docs/search/list)
* [Videos](https://developers.google.com/youtube/v3/docs/videos/list)
* [Google Cloud Console](https://console.cloud.google.com)

Permitirá filtrar por:

* palabra clave.
* canal.
* fecha.
* región.
* idioma.
* duración.
* tipo de contenido.

La API requiere una API key u OAuth según la operación. Su método de búsqueda permite filtrar por país e idioma y utiliza un sistema de cuotas; por ello conviene consultar primero una lista blanca de canales oficiales y después ampliar la búsqueda.

### Canales prioritarios

* OpenAI.
* Anthropic.
* Google DeepMind.
* Google Cloud.
* NVIDIA.
* Hugging Face.
* Mistral AI.
* Microsoft Research.
* AWS.
* Meta AI.
* Stanford HAI.
* MIT CSAIL.
* Berkeley AI Research.
* universidades peruanas.
* CONCYTEC.
* comunidades latinoamericanas.

El portal almacenará el identificador y metadatos. El video se mostrará mediante el reproductor oficial de YouTube.

---

# 14. Instagram

## Integración permitida

Utilizar:

* [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/)
* [Workspace oficial de Meta](https://www.postman.com/meta/instagram/overview)
* [Meta for Developers](https://developers.facebook.com/apps/)

La API oficial de Instagram está orientada principalmente a cuentas profesionales —Business o Creator— y a operaciones autorizadas, como administrar contenido, publicar y consultar métricas.

## Lo que sí puede integrarse

* Publicaciones de la cuenta propia de AMARU.
* Métricas de alcance de la cuenta autorizada.
* Publicación de resúmenes diarios.
* carruseles semanales.
* videos y Reels propios.
* contenido de cuentas profesionales autorizadas.
* almacenamiento de identificadores y enlaces.

## Lo que no debe plantearse

Instagram no debe utilizarse como una API global para buscar y extraer cualquier publicación pública.

No se debe:

* Scrappear perfiles indiscriminadamente.
* copiar fotografías.
* almacenar contenido ajeno completo.
* utilizar credenciales personales en el frontend.
* asumir que una publicación constituye una noticia confirmada.

## Función recomendada

Instagram será principalmente un **canal de salida**:

```text
AMARU detecta una tendencia
        │
        ▼
Genera un resumen visual
        │
        ▼
Revisión manual
        │
        ▼
Publicación en Instagram
```

Como fuente de entrada, se limitará a una lista autorizada de cuentas oficiales y a lo permitido por Meta.

---

# 15. Mapas

## Alternativa inicial

### MapLibre GL JS

* [Documentación](https://maplibre.org/maplibre-gl-js/docs/)
* [GitHub](https://github.com/maplibre/maplibre-gl-js)

MapLibre es el motor visual del mapa y permite trabajar con fuentes vectoriales, marcadores, capas e interacción.

### OpenFreeMap

* [Portal](https://openfreemap.org)
* [GitHub](https://github.com/hyperknot/openfreemap)

OpenFreeMap puede utilizarse inicialmente como mapa base y también permite autoalojamiento.

## Evolución posterior

Utilizar **PMTiles** almacenados en R2:

* [Protomaps](https://protomaps.com)
* [PMTiles](https://docs.protomaps.com/pmtiles/)
* [Integración con R2](https://docs.protomaps.com/pmtiles/cloud-storage)

Protomaps recomienda R2 para PMTiles por la ausencia de tarifas de ancho de banda.

## Arquitectura del mapa

```text
MapLibre
   │
   ├── mapa base: OpenFreeMap
   ├── puntos: D1 → GeoJSON
   ├── países: GeoJSON simplificado
   ├── clusters: frontend
   └── PMTiles: R2
```

D1 guardará:

* País.
* ciudad.
* latitud.
* longitud.
* institución.
* proveedor.
* tipo de actividad.
* intensidad.
* fecha.

No almacenará mosaicos cartográficos.

---

# 16. Formatos que deberá admitir el indexador

| Formato   | Uso                              |
| --------- | -------------------------------- |
| JSON      | API modernas                     |
| JSON Feed | Noticias y blogs                 |
| RSS 2.0   | Blogs y novedades                |
| Atom      | Changelogs y papers              |
| XML       | Catálogos y repositorios         |
| OAI-PMH   | Repositorios académicos          |
| CERIF XML | Información de investigación     |
| REST      | Proveedores y plataformas        |
| GraphQL   | GitHub y catálogos               |
| OpenAPI   | Descubrimiento de endpoints      |
| Webhooks  | Actualización inmediata          |
| CSV       | Datasets y exportaciones         |
| Parquet   | Grandes datasets históricos      |
| HTML      | Último recurso autorizado        |
| GeoJSON   | Puntos y regiones                |
| MVT       | Mapas vectoriales                |
| PMTiles   | Mapas autoalojados               |
| DOI       | Identificación de publicaciones  |
| ORCID     | Identificación de investigadores |

## Prioridad técnica

```text
API oficial
   ↓
Webhook
   ↓
RSS / Atom
   ↓
OAI-PMH
   ↓
Dataset descargable
   ↓
HTML autorizado
```

Browser Run de Cloudflare puede utilizarse excepcionalmente para páginas dinámicas que no tengan API ni feed, respetando las condiciones y `robots.txt`. Su nivel gratuito incluye una asignación diaria limitada, por lo que no debe ser el mecanismo principal.

---

# 17. Registro de fuentes

Cada API o feed se configurará en la base de datos, no dentro del código:

```text
sources
├── id
├── name
├── provider
├── category
├── base_url
├── endpoint
├── format
├── authentication_type
├── secret_name
├── rate_limit
├── update_frequency
├── country
├── language
├── trust_level
├── official
├── enabled
├── last_success_at
├── last_error_at
└── terms_url
```

Esto permitirá agregar proveedores sin reconstruir la interfaz.

---

# 18. Frecuencia de actualización

| Fuente               | Frecuencia inicial |
| -------------------- | -----------------: |
| Changelogs oficiales |       Cada 2 horas |
| OpenRouter           |       Cada 6 horas |
| Hugging Face         |       Cada 6 horas |
| Precios oficiales    |      Cada 12 horas |
| Noticias             |       Cada 2 horas |
| GitHub               |       Cada 6 horas |
| Papers               |      Cada 12 horas |
| YouTube              |      Cada 12 horas |
| Perú y Latinoamérica |      Cada 24 horas |
| Instagram propio     |  Según publicación |
| Mapas e indicadores  |            Semanal |

No es necesario consultar todas las fuentes cada minuto. La mayoría de estos datos no cambia con tal velocidad.

---

# 19. Regla de reconstrucción del portal

La página no se reconstruirá automáticamente en el sentido de modificar su código.

Funcionará así:

```text
Fuente externa
      ↓
Indexador
      ↓
Normalización
      ↓
D1 / R2
      ↓
API del Worker
      ↓
Interfaz actualizada
```

La interfaz estará compuesta por elementos genéricos:

* `ProviderCard`
* `ModelCard`
* `NewsCard`
* `ResearchCard`
* `RepositoryCard`
* `VideoCard`
* `CountryPanel`
* `TimelineEvent`

Cuando aparezca un nuevo registro, la interfaz lo mostrará sin modificar el código.

---

# 20. Decisiones antes de comenzar

## Arquitectura aprobada

* Cloudflare Workers y Static Assets.
* D1 como base principal.
* R2 para contenido original.
* KV para caché.
* Cron Dispatcher.
* Queues en una segunda etapa.
* Workers AI para clasificación y resumen.
* Vectorize opcional.
* MapLibre + OpenFreeMap.
* PMTiles en R2 posteriormente.
* Sin Supabase.
* Sin Vercel.
* Neon únicamente como contingencia.

## Fuentes obligatorias del MVP

1. OpenRouter.
2. Hugging Face.
3. GitHub.
4. OpenAlex.
5. arXiv.
6. Crossref.
7. YouTube.
8. GDELT.
9. Cinco changelogs oficiales.
10. ALICIA, PerúCRIS y LA Referencia.
11. MapLibre y OpenFreeMap.

## Fuentes que se agregarán después

* Instagram.
* Guardian.
* Semantic Scholar.
* SciELO.
* Reddit.
* Hacker News.
* proveedores asiáticos.
* inversiones.
* patentes.
* convocatorias.
* regulación.

---

# 21. Recomendación final

Para tu observatorio, la opción más sostenible es:

> **AMARU AI Observatory sobre Cloudflare, utilizando D1 como catálogo, R2 como repositorio histórico y Workers como motor de actualización.**

Esta arquitectura mantiene el producto ligero, reduce costos y evita ocupar un tercer proyecto de Supabase.

El portal será fundamentalmente de lectura, con escrituras programadas y controladas. Ese patrón coincide especialmente bien con los límites gratuitos de Cloudflare D1, siempre que se utilicen índices, caché y almacenamiento separado para los contenidos voluminosos.
