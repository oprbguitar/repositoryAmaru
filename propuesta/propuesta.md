# Propuesta conceptual: AMARU AI Observatory

## 1. Concepto general

**AMARU AI Observatory** sería un observatorio interactivo y permanentemente actualizado sobre inteligencia artificial, diseñado para dos niveles de usuario:

* Personas que recién comienzan y necesitan explicaciones sencillas.
* Profesionales que requieren costos, características técnicas, licencias, API, benchmarks, repositorios e investigaciones.

No funcionaría como una wiki tradicional, porque una wiki organiza artículos relativamente estáticos. Tampoco sería únicamente un dashboard, porque no se limitaría a mostrar indicadores.

El concepto más apropiado sería:

> **Observatorio vivo de inteligencia artificial, laboratorio de descubrimiento y sistema personal de vigilancia tecnológica.**

Su objetivo sería transformar información dispersa de proveedores, universidades, repositorios, empresas y centros de investigación en fichas comprensibles y comparables.

Cada elemento respondería, como mínimo, estas preguntas:

1. ¿Qué es?
2. ¿Quién lo desarrolla?
3. ¿En qué país o región se desarrolla?
4. ¿Para qué sirve realmente?
5. ¿Qué modalidades admite: texto, audio, imagen, video, código o documentos?
6. ¿Tiene API?
7. ¿Dónde se obtiene la API key?
8. ¿Tiene nivel gratuito?
9. ¿Cuánto cuesta?
10. ¿Es abierto, open-weight, propietario o parcialmente abierto?
11. ¿Puede utilizarse localmente?
12. ¿Qué conocimientos técnicos requiere?
13. ¿Para qué proyecto concreto podría servirte?
14. ¿Qué limitaciones, riesgos o condiciones de privacidad presenta?
15. ¿Cuándo se verificó por última vez la información?

---

# 2. Nombre y posicionamiento

## Nombre recomendado

**AMARU AI Observatory**
**Global Intelligence, Models & Innovation Radar**

Otras variantes:

* AndesNova AI Atlas
* AMARU Technology Radar
* Global AI Intelligence Monitor
* AI Frontier Observatory
* AMARU Innovation Watch

La identidad visual podría combinar el misterio tecnológico de AMARU con una representación cartográfica, científica y profesional.

No tendría la apariencia de un portal de noticias. Debería sentirse como un **centro de control privado para explorar la evolución tecnológica mundial**.

---

# 3. Modelo visual: una pantalla, múltiples espacios

La aplicación puede construirse como una interfaz de altura completa, `100vh`, sin desplazamiento general de la página.

La estructura sería:

```text
┌─────────────────────────────────────────────────────────────────┐
│ AMARU AI OBSERVATORY | Buscar | Modo | Actualizado hace 12 min  │
├────────────┬────────────────────────────────────┬───────────────┤
│ Navegación │                                    │ Inteligencia  │
│            │        Espacio principal           │ contextual    │
│ Pulso      │                                    │               │
│ Modelos    │     Tabla / mapa / línea de         │ Recomendación │
│ Herramientas│    tiempo / comparador             │ Alertas       │
│ Mapa       │                                    │ Explicación   │
│ Papers     │                                    │ personal      │
│ GitHub     │                                    │               │
│ Laboratorio│                                    │               │
├────────────┴────────────────────────────────────┴───────────────┤
│ Flujo: nuevos modelos · investigaciones · repositorios · costos │
└─────────────────────────────────────────────────────────────────┘
```

## Comportamiento

* La página exterior no se desplaza.
* Cada pestaña cambia el contenido del panel central.
* Las tablas o paneles extensos pueden tener desplazamiento interno.
* El mapa puede ampliarse mediante un modo de enfoque.
* El panel derecho explica el elemento seleccionado.
* Una cinta inferior muestra novedades, pero debe poder pausarse.
* Los filtros permanecen visibles al cambiar de módulo.

No recomiendo que todo el contenido se mueva automáticamente. El movimiento constante puede dificultar la lectura. Es mejor utilizar:

* Una cinta inferior de novedades.
* Un carrusel pausado.
* Cambios destacados desde la última visita.
* Animaciones suaves para mostrar nueva información.
* Botón de pausa.
* Actualización automática sin recargar la página.

---

# 4. Dos niveles de explicación

En la parte superior existiría un selector:

## Modo «Explorar»

Pensado para usuarios nuevos.

Ejemplo:

> **¿Qué es RAG?**
> Es una técnica que permite que una inteligencia artificial consulte tus documentos antes de responder. Sirve para crear asistentes que respondan utilizando expedientes, informes, normas o manuales propios.

## Modo «Profesional»

Mostraría información adicional:

> **RAG — Retrieval-Augmented Generation**
> Arquitectura compuesta por ingestión, segmentación, embeddings, almacenamiento vectorial, recuperación semántica, reranking y generación contextual. Requiere evaluar precisión, trazabilidad, tamaño de fragmento, modelo de embeddings, privacidad y costo de inferencia.

No serían dos portales diferentes. Sería la misma información presentada con distinta profundidad.

---

# 5. Pestañas principales

## 5.1. Pulso de IA

Sería la pantalla inicial.

Mostraría únicamente los cambios importantes:

* Nuevos modelos.
* Reducciones o incrementos de precios.
* Modelos que serán retirados.
* Nuevas funciones.
* Herramientas emergentes.
* Investigaciones relevantes.
* Repositorios con crecimiento acelerado.
* Nuevas API disponibles.
* Cambios regulatorios.
* Inversiones y adquisiciones.

Cada actualización debería resumirse así:

> **Qué ocurrió**
> Google actualizó determinado modelo o servicio.

> **Por qué importa**
> Reduce el costo, mejora la velocidad o incorpora una nueva modalidad.

> **Cómo podría ayudarte**
> Puede utilizarse para transcripción, análisis documental, programación o atención automatizada.

> **Fuente y fecha**
> Documentación oficial, fecha de publicación y fecha de verificación.

También tendría un filtro:

* Hoy.
* Últimos siete días.
* Últimos treinta días.
* Solo cambios que afectan mis proyectos.

---

## 5.2. Modelos y API

Este sería uno de los módulos centrales.

### Filtros

* Empresa.
* País.
* Modelo abierto o propietario.
* Texto, audio, imagen, video o multimodal.
* Razonamiento.
* Programación.
* Herramientas o function calling.
* Ventana de contexto.
* Entrada de imágenes.
* Salida de audio.
* Uso local.
* Nivel gratuito.
* Precio.
* Latencia.
* Privacidad.
* Disponibilidad regional.

### Cada ficha mostraría

```text
Modelo: GPT-5.6 Terra
Proveedor: OpenAI
Región: Estados Unidos
Tipo: Propietario
Entrada: Texto e imagen
Salida: Texto
Contexto: 1,05 millones de tokens
Precio de entrada: US$2,50 por millón de tokens
Precio de salida: US$15 por millón de tokens
Uso recomendado: análisis, razonamiento y programación
API: Disponible
Estado: Activo
Última verificación: 18/07/2026
```

Como ejemplo de la necesidad de actualización automática, la documentación actual de OpenAI diferencia modelos orientados a máxima capacidad, equilibrio y volumen, cada uno con precios y límites distintos. Esos datos no deberían escribirse manualmente en el código, sino almacenarse como registros versionados.

OpenRouter resulta especialmente útil para esta sección porque su Models API entrega un formato normalizado con identificadores, precios, modalidades y otros metadatos de numerosos proveedores. También ofrece información de consumo y costos de las generaciones, lo que permitiría evitar decenas de integraciones iniciales.

### Simulador de costos

No debería limitarse a preguntar cuántos tokens se utilizarán. Debe permitir seleccionar una actividad real:

* Resumir un PDF de 100 páginas.
* Procesar 1 000 documentos.
* Transcribir dos horas de audio.
* Analizar 500 imágenes.
* Ejecutar un agente de programación.
* Crear embeddings para 10 000 archivos.
* Realizar 100 consultas RAG diarias.
* Generar un reporte de veinte páginas.

El simulador calcularía:

* Tokens de entrada.
* Tokens de salida.
* Tokens almacenados en caché.
* Embeddings.
* Búsquedas web.
* Procesamiento de audio.
* Páginas procesadas por OCR.
* Imágenes o videos.
* Costo mensual.
* Costo en dólares y soles.
* Alternativa más económica.
* Alternativa equilibrada.
* Alternativa de mayor capacidad.

Esto es importante porque no todos los servicios cobran por tokens. Algunos cobran por imagen, segundo de audio, página, herramienta utilizada, almacenamiento o tiempo de infraestructura.

---

## 5.3. Herramientas y productos

Aquí no se mostrarían modelos aislados, sino productos terminados.

### Categorías

* Programación asistida.
* Investigación académica.
* Análisis documental.
* RAG.
* Transcripción y diarización.
* Voz en tiempo real.
* Generación de imágenes.
* Edición de imágenes.
* Video.
* Presentaciones.
* Automatización.
* Agentes.
* Inteligencia empresarial.
* Ciencia de datos.
* Ingeniería.
* Legal.
* Salud.
* Educación.
* Modelos locales.
* Ciberseguridad.

Cada herramienta tendría una clasificación sencilla:

```text
Nivel: Inicial / Intermedio / Profesional
Costo: Gratuito / Freemium / Pago
Requiere API: Sí / No
Instalación local: Sí / No
Uso comercial: Permitido / Restringido
Privacidad: Baja / Media / Alta / Local
Estado: Experimental / Estable / Empresarial
```

También tendría un botón:

> **¿Cómo podría utilizarla Pierre?**

La respuesta no sería genérica. El sistema relacionaría la herramienta con tus proyectos registrados, por ejemplo:

* Archiv-IA.
* Transcripción pericial.
* JustiPenal.
* Herramientas para el Fiscal.
* SupplyChain Perú Analytics.
* Portales de vigilancia tecnológica.
* Generación de informes técnicos.

---

## 5.4. Mapa mundial de inteligencia artificial

La visualización puede construirse con **MapLibre GL JS**, una biblioteca open source que renderiza mapas vectoriales interactivos mediante WebGL y permite trabajar con capas, puntos, polígonos, ventanas emergentes e incluso una vista de globo.

### Capas seleccionables

* Laboratorios de IA.
* Empresas.
* Modelos.
* Investigación.
* Inversión.
* Proyectos gubernamentales.
* Regulación.
* Repositorios open source.
* Centros universitarios.
* Infraestructura y centros de datos.
* Patentes.
* Adopción empresarial.

### Ejemplo de interacción

Al seleccionar Francia:

```text
FRANCIA

Ecosistema principal:
• Mistral AI
• Laboratorios universitarios
• Programas europeos de soberanía tecnológica

Fortalezas:
• Modelos abiertos
• IA empresarial
• Regulación europea
• Investigación científica

Actividad reciente:
• 8 lanzamientos
• 42 investigaciones
• 17 repositorios destacados
• 3 inversiones registradas

Productos observados:
• Modelos de lenguaje
• OCR
• Agentes de programación
• Soluciones soberanas
```

Al seleccionar China podrían aparecer sus laboratorios, familias de modelos, repositorios, publicaciones e inversiones. Lo mismo ocurriría con Estados Unidos, Canadá, Reino Unido, Alemania, India, Japón, Corea, Emiratos Árabes, Brasil y Perú.

GDELT puede servir como una de las fuentes para identificar noticias y señales geográficas mundiales. Su infraestructura procesa información internacional y dispone de componentes documentales y geográficos. Sin embargo, sus resultados deben considerarse señales que requieren depuración, no hechos automáticamente validados.

Para indicadores estructurales pueden incorporarse OECD.AI y el AI Index de Stanford. Estas fuentes son más adecuadas para analizar políticas, inversión, adopción, investigación e impacto, pero no sustituyen una fuente diaria de lanzamientos.

---

## 5.5. Investigación y conocimiento científico

Esta sección recogería estudios relacionados con:

* LLM.
* Agentes.
* RAG.
* Audio y voz.
* Visión artificial.
* Robótica.
* Medicina.
* Ingeniería.
* Ciencia de materiales.
* Seguridad.
* Evaluación de modelos.
* IA explicable.
* Ética y regulación.

### Fuentes recomendadas

| Fuente           | Información                                     |                API key |
| ---------------- | ----------------------------------------------- | ---------------------: |
| arXiv            | Preprints y trabajos recientes                  |                     No |
| OpenAlex         | Trabajos, autores, instituciones, citas y temas | Según modalidad de uso |
| Semantic Scholar | Artículos, autores, citas y recomendaciones     |           Recomendable |
| Crossref         | DOI, publicaciones, financiadores y metadatos   |     No para uso básico |

arXiv ofrece acceso público mediante API. OpenAlex proporciona un catálogo conectado de trabajos, autores, instituciones, fuentes y temas. Semantic Scholar dispone de API académica y de recomendaciones, mientras que Crossref permite consultar metadatos bibliográficos, financiación, licencias y actualizaciones.

### Explicación de cada investigación

Cada estudio tendría cuatro niveles:

1. Resumen original.
2. Explicación sencilla.
3. Análisis profesional.
4. Posibles aplicaciones.

Ejemplo:

> **Hallazgo:** nuevo método para mejorar la recuperación documental.

> **En palabras sencillas:** ayuda a que una IA encuentre mejor el párrafo correcto dentro de miles de documentos.

> **Aplicación profesional:** podría mejorar la precisión de Archiv-IA y reducir respuestas sustentadas en fragmentos irrelevantes.

> **Nivel de evidencia:** preprint, publicación revisada o resultado replicado.

Es fundamental diferenciar:

* Preprint.
* Artículo revisado por pares.
* Documento empresarial.
* Benchmark del propio fabricante.
* Resultado independiente.
* Resultado todavía no reproducido.

---

## 5.6. Radar de GitHub

GitHub no debería presentarse únicamente por número total de estrellas. Los proyectos antiguos siempre tendrían ventaja.

El portal calcularía un **índice de impulso**:

```text
Impulso =
crecimiento reciente de estrellas
+ frecuencia de commits
+ nuevos contribuidores
+ publicaciones recientes
+ resolución de incidencias
+ documentación
+ licencia
+ actividad sostenida
```

### Filtros

* Creado esta semana.
* Creado este mes.
* Mayor crecimiento.
* Más utilizado.
* Open source.
* Con aplicación funcional.
* Solo modelos locales.
* Solo RAG.
* Solo agentes.
* Solo audio.
* Solo herramientas documentales.
* Fácil de instalar.
* Compatible con Windows.
* Compatible con GPU limitada.

La API REST de GitHub permite buscar y analizar repositorios, releases, actividad y otros metadatos. Las solicitudes públicas sin autenticación tienen un límite general de 60 por hora, mientras que las autenticadas normalmente disponen de un límite superior; por eso conviene utilizar un token almacenado en el servidor y aplicar caché.

No existe una API oficial específica que reproduzca exactamente la sección visual “Trending”. El sistema tendría que construir su propio ranking mediante búsquedas, snapshots diarios y diferencias de estrellas, forks y actividad.

---

## 5.7. Línea de tiempo

Mostraría la evolución de la inteligencia artificial desde sus antecedentes hasta la actualidad:

* Fundamentos matemáticos.
* Primeras redes neuronales.
* Sistemas expertos.
* Machine learning.
* Deep learning.
* Transformers.
* Modelos fundacionales.
* IA generativa.
* Multimodalidad.
* Agentes.
* Modelos de razonamiento.
* IA científica.
* Robótica.
* Sistemas autónomos.

La línea no debería ser una lista de fechas. Cada hito mostraría:

* Qué problema resolvió.
* Qué limitación anterior superó.
* Qué productos hizo posibles.
* Qué modelos actuales derivan de ese avance.
* Qué investigaciones siguen abiertas.

---

## 5.8. Laboratorio personal

Esta sería la sección diferenciadora.

Permitiría registrar una necesidad:

> “Quiero crear un sistema que transcriba audios de dos horas, identifique participantes, resuma declaraciones y genere un reporte con citas temporales”.

El observatorio recomendaría una arquitectura:

```text
Entrada:
Audio MP3, WAV o M4A

Procesamiento:
1. Normalización
2. Separación por segmentos
3. Transcripción
4. Diarización
5. Corrección
6. Extracción de entidades
7. Resumen
8. Exportación

Alternativa económica:
Proveedor A + modelo B

Alternativa privada:
Whisper local + modelo local

Alternativa profesional:
Servicio especializado + LLM de razonamiento

Costo estimado:
Por archivo, por hora y por mes
```

También mostraría:

* Complejidad.
* Hardware requerido.
* Servicios externos.
* Privacidad.
* Costo inicial.
* Costo operativo.
* Repositorios relacionados.
* Investigación relacionada.
* Riesgos.
* Posibilidad de comercialización.

---

# 6. Fuentes automáticas recomendadas

## Catálogo de modelos y precios

### OpenRouter

Adecuado para iniciar porque centraliza numerosos modelos y normaliza su información. Su API puede proporcionar modelos, precios, modalidades, proveedores y estadísticas de generación. También dispone de endpoints de benchmarks, aunque estos requieren autenticación y tienen límites definidos.

### Proveedores directos

Las siguientes fuentes deben mantenerse como autoridad principal:

* OpenAI Models y documentación.
* Anthropic Models, Pricing y Deprecations.
* Google Gemini Models, Pricing y Changelog.
* Mistral Models y documentación.
* Groq Models.
* NVIDIA Build/NIM.
* Hugging Face Hub.

Anthropic expone información de modelos, precios, capacidades y ciclos de retiro; Gemini mantiene documentación de modelos, precios, límites y cambios; Mistral permite consultar modelos disponibles y publica fichas por modelo.

## Modelos, datasets y demostraciones abiertas

Hugging Face Hub cuenta con endpoints abiertos para recuperar información sobre modelos, datasets y Spaces. También ofrece clientes para Python y JavaScript, metadatos de model cards, webhooks y acceso programático a determinados leaderboards.

## Noticias y cambios

Prioridad de fuentes:

1. Changelog oficial.
2. Documentación oficial.
3. Blog oficial.
4. Repositorio oficial.
5. Publicación científica.
6. Medio especializado.
7. Medio general.
8. Publicación comunitaria.

Una publicación de una red social podría generar una alerta, pero no debería modificar automáticamente una ficha de precios o capacidades.

## Inversión

Para una versión inicial:

* Comunicados oficiales.
* Noticias empresariales.
* GDELT.
* Registros públicos.
* Informes institucionales.

Para una versión profesional:

* Crunchbase.
* Dealroom.
* Preqin.
* Tracxn.
* Bases especializadas.

Las cifras tendrían estados:

* Anunciada.
* Reportada.
* Confirmada.
* Cerrada.
* Estimada.
* No verificada.

---

# 7. Registro de proveedores y API keys

El portal debe incluir una sección denominada **Centro de proveedores**.

| Proveedor        | Obtención                       | Uso principal                             |
| ---------------- | ------------------------------- | ----------------------------------------- |
| OpenAI           | Plataforma para desarrolladores | Texto, visión, audio, agentes e imágenes  |
| Anthropic        | Consola de Claude               | Razonamiento, documentos y programación   |
| Google Gemini    | Google AI Studio                | Multimodalidad, voz, visión y búsqueda    |
| OpenRouter       | Panel de API Keys               | Acceso unificado a diferentes proveedores |
| Hugging Face     | Settings → Access Tokens        | Modelos, datasets, Spaces e inferencia    |
| GitHub           | Developer Settings              | Repositorios y automatización             |
| Mistral          | Consola de Mistral              | Texto, código, OCR y modelos abiertos     |
| Groq             | Groq Console                    | Inferencia de baja latencia               |
| NVIDIA           | Build y NGC                     | NIM, modelos y despliegue                 |
| Semantic Scholar | Portal de API                   | Investigación científica                  |

Google está migrando la creación de nuevas credenciales de Gemini hacia claves de autorización vinculadas a proyectos y recomienda aplicar restricciones de seguridad. NVIDIA Build permite obtener credenciales para probar determinados endpoints y NGC utiliza claves para descargar o desplegar recursos.

### Regla fundamental

Las claves nunca deben almacenarse en:

* Código público.
* Repositorio GitHub.
* JavaScript del navegador.
* Local Storage.
* Archivos descargables.
* Variables expuestas con prefijos públicos.

Deben mantenerse en:

* Variables de entorno del servidor.
* Supabase Vault.
* Secretos de Cloudflare.
* Secretos de Vercel.
* GitHub Actions Secrets.

---

# 8. Motor de actualización

El funcionamiento interno tendría esta secuencia:

```text
1. Captura
   APIs + RSS + changelogs + repositorios

2. Normalización
   Convertir cada fuente a un esquema común

3. Deduplicación
   Detectar que varias noticias se refieren al mismo lanzamiento

4. Comparación
   Identificar qué cambió respecto de la versión anterior

5. Enriquecimiento
   Generar explicación inicial y profesional

6. Verificación
   Confirmar precio, modelo, fecha y fuente

7. Clasificación
   Categoría, región, modalidad, licencia y madurez

8. Almacenamiento
   Guardar ficha actual y snapshot histórico

9. Publicación
   Mostrar el cambio en el observatorio

10. Personalización
   Relacionarlo con tus intereses y proyectos
```

No se debe sobrescribir la información anterior. Cada modificación tendría una versión histórica.

Ejemplo:

```text
15/06/2026 — Precio anterior
01/07/2026 — Precio actualizado
10/07/2026 — Nueva ventana de contexto
18/07/2026 — Nueva herramienta disponible
```

Así podrías observar cómo evoluciona realmente un modelo.

---

# 9. Arquitectura tecnológica recomendada

## Recomendación principal: aplicación web progresiva

La alternativa más sostenible sería una **PWA web local-first**, no un programa exclusivamente de escritorio.

Ventajas:

* Un solo código para computadora y móvil.
* Puede instalarse como aplicación.
* Actualización centralizada.
* Acceso desde cualquier dispositivo.
* Posibilidad de funcionar parcialmente sin conexión.
* Menor dificultad para incorporar mapas y visualizaciones.
* Más fácil de compartir.
* Posteriormente puede envolverse con Tauri para obtener una versión de escritorio.

## Stack recomendado

### Interfaz

* React.
* TypeScript.
* Next.js o Vite.
* Tailwind CSS.
* Componentes accesibles.
* MapLibre GL JS.
* PWA.
* IndexedDB para caché local.

### Backend

* Supabase PostgreSQL.
* Supabase Auth.
* Edge Functions.
* `pgvector` para búsquedas semánticas.
* Storage para documentos y snapshots.
* Row Level Security.

### Automatización

* Supabase Cron.
* Edge Functions.
* Cloudflare Workers como alternativa.
* GitHub Actions para procesos secundarios.

Supabase permite programar tareas recurrentes mediante `pg_cron` y llamar Edge Functions, manteniendo secretos en Vault. Cloudflare Workers dispone igualmente de Cron Triggers orientados a recolección periódica de datos.

Vercel Cron podría utilizarse para una actualización diaria sencilla. No obstante, en el plan Hobby la ejecución está limitada a una vez por día y puede producirse dentro de una ventana aproximada de una hora.

## Arquitectura resumida

```text
Fuentes externas
      ↓
Recolectores programados
      ↓
Cola de procesamiento
      ↓
Normalizador
      ↓
Verificador
      ↓
PostgreSQL
      ↓
API interna
      ↓
AMARU AI Observatory
```

---

# 10. Modelo mínimo de datos

Las principales tablas serían:

```text
providers
models
model_versions
tools
tool_versions
prices
capabilities
api_sources
countries
organizations
papers
repositories
investments
news_events
regulations
benchmarks
use_cases
personal_projects
recommendations
watchlists
sources
source_snapshots
verification_logs
```

Todo registro debería contener:

* `source_url`
* `source_type`
* `published_at`
* `collected_at`
* `verified_at`
* `confidence_level`
* `verification_status`
* `language`
* `country`
* `license`
* `raw_content_hash`

---

# 11. Sistema de confianza

Las fichas deberían mostrar un sello:

### Alta confianza

Dato obtenido de una API o documentación oficial.

### Confianza media

Dato coincidente en varias fuentes reputadas.

### Confianza provisional

Información anunciada, pero aún no incorporada en documentación oficial.

### No verificado

Rumor, publicación comunitaria o información sin confirmación independiente.

Esto impediría que el portal presente automáticamente cualquier anuncio como verdadero.

---

# 12. Primera versión funcional

La primera versión no debería intentar integrar todo el universo de la IA.

## Núcleo inicial

1. Pulso diario.
2. Catálogo de modelos.
3. Comparador de costos.
4. Radar de GitHub.
5. Investigaciones recientes.
6. Centro de API keys.
7. Lista personal de favoritos.
8. Historial de cambios.

## Fuentes iniciales

* OpenRouter.
* Hugging Face.
* GitHub.
* arXiv.
* OpenAlex.
* Documentación oficial de cinco proveedores.

## Segunda ampliación

* Mapa mundial.
* Inversiones.
* Regulación.
* Productos comerciales.
* Recomendador personal.
* Laboratorio de arquitecturas.

## Evolución avanzada

* Asistente RAG sobre toda la base.
* Alertas personalizadas.
* Comparación de benchmarks.
* Generación de propuestas de proyectos.
* Detección de tecnologías emergentes.
* Seguimiento de proveedores.
* Informes semanales automáticos.
* Exportación a PDF, Excel y PowerPoint.
* API propia del observatorio.

---

# 13. Diferencia frente a otras páginas

El valor no estaría en mostrar cientos de enlaces.

La diferenciación sería:

> **Convertir cada novedad tecnológica en conocimiento práctico, verificable, comparable y aplicable a proyectos concretos.**

En lugar de decir:

> “Se lanzó un nuevo modelo multimodal”.

El sistema explicaría:

> “Este modelo procesa texto, imágenes y audio. Su costo es menor que el de estas tres alternativas. Puede servir para construir un transcriptor, analizar documentos escaneados o crear un asistente por voz. Tiene API, pero no puede ejecutarse localmente. Para información confidencial conviene utilizar esta alternativa.”

Ese sería el verdadero producto.

---

# 14. Recomendación final

La solución más coherente es desarrollar un **observatorio web progresivo, personalizable y basado en datos versionados**, con una interfaz fija por pestañas.

Debe combinar cuatro dimensiones:

1. **Tiempo:** cómo evoluciona la tecnología.
2. **Territorio:** dónde se desarrolla.
3. **Capacidad:** para qué sirve cada modelo o herramienta.
4. **Aplicación:** cómo puede convertirse en un proyecto real.

Su principio rector debería ser:

> **No mostrar más información, sino ayudar a comprender qué cambió, por qué importa y qué se puede construir con ello.**
