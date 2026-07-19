# PRD — AMARU AI OBSERVATORY

## Portal personal de vigilancia, exploración y aplicación de inteligencia artificial

**Versión:** 1.0
**Tipo de producto:** Aplicación web progresiva, informativa y autoindexada
**Modalidad:** Portal privado inicialmente, escalable a acceso público
**Idioma principal:** Español
**Propietario conceptual:** Pierre R.
**Marca asociada:** AndesNova
**Fecha de especificación:** 18 de julio de 2026

---

# 1. Resumen ejecutivo

AMARU AI Observatory será un portal personal de inteligencia tecnológica destinado a observar, organizar, explicar y relacionar la evolución mundial de la inteligencia artificial.

El sistema recopilará información proveniente de proveedores de modelos, documentación oficial, repositorios, publicaciones científicas, medios confiables, universidades, plataformas de video y fuentes regionales.

La información será normalizada y presentada mediante una interfaz visual de una sola pantalla, sin desplazamiento general, organizada mediante pestañas dinámicas.

El sistema deberá responder de forma comprensible:

* Qué tecnología apareció.
* Quién la desarrolla.
* En qué país o región se origina.
* Para qué sirve.
* Cuánto cuesta.
* Cómo se obtiene acceso.
* Si dispone de API.
* Si puede ejecutarse localmente.
* Si es open source, open-weight, gratuita, freemium o propietaria.
* Qué hardware requiere.
* Qué nivel técnico demanda.
* Qué cambió desde la última visita.
* Cómo podría aplicarse a un proyecto concreto.
* Qué relevancia tiene para Perú y Latinoamérica.
* Qué grado de confianza tiene la información.

El producto no será una wiki tradicional ni un agregador convencional de noticias. Será un:

> **Observatorio vivo de inteligencia artificial, sistema personal de vigilancia tecnológica y laboratorio de descubrimiento de oportunidades.**

---

# 2. Problema que resuelve

La información sobre inteligencia artificial se encuentra dispersa entre:

* Documentaciones oficiales.
* Blogs corporativos.
* Changelogs.
* Repositorios GitHub.
* Papers académicos.
* Videos.
* Redes sociales.
* Plataformas de modelos.
* Medios especializados.
* Sitios de inversión.
* Universidades.
* Organismos gubernamentales.

Esta dispersión produce dificultades para:

1. Diferenciar una herramienta estable de una demostración experimental.
2. Comparar precios entre proveedores.
3. Entender qué significa cada unidad de consumo.
4. Reconocer si un modelo puede utilizarse localmente.
5. Identificar licencias y restricciones.
6. Determinar si una noticia es confiable.
7. Saber qué cambió desde una fecha determinada.
8. Relacionar una tecnología con una necesidad real.
9. Encontrar proyectos recientes de GitHub.
10. Detectar investigaciones o avances desarrollados en Perú y Latinoamérica.

AMARU AI Observatory centralizará esta información y la convertirá en conocimiento estructurado, verificable y aplicable.

---

# 3. Objetivo general

Desarrollar un portal interactivo y autoactualizable que permita explorar la evolución, disponibilidad, costo, ubicación, madurez y aplicabilidad de tecnologías de inteligencia artificial.

---

# 4. Objetivos específicos

1. Crear un directorio de proveedores, modelos, plataformas y servicios.
2. Mostrar accesos directos a documentación, API, precios, consolas y repositorios.
3. Indexar noticias y cambios relevantes.
4. Registrar el historial de versiones, precios y capacidades.
5. Identificar herramientas gratuitas, open source, open-weight y locales.
6. Mostrar repositorios recientes y proyectos en crecimiento.
7. Recopilar videos técnicos y educativos.
8. Organizar investigaciones científicas por tema y región.
9. Construir un mapa mundial de actividad en inteligencia artificial.
10. Crear una sección específica para Perú y Latinoamérica.
11. Recomendar tecnologías aplicables a proyectos personales o profesionales.
12. Permitir guardar temas, proveedores, modelos y repositorios.
13. Mostrar las novedades detectadas desde la última visita.
14. Estimar costos por caso de uso.
15. Mantener trazabilidad de las fuentes.

---

# 5. Alcance funcional

## 5.1. Incluido en la primera versión

* Panel de novedades.
* Directorio de proveedores.
* Catálogo de modelos.
* Comparador de precios.
* Herramientas abiertas y locales.
* Noticias verificadas.
* Investigaciones.
* Radar GitHub.
* Videos.
* Mapa mundial.
* Perú y Latinoamérica.
* Laboratorio personal.
* Favoritos.
* Historial de cambios.
* Sistema de confianza.
* Buscador global.
* Panel administrativo.
* Indexación automática.
* Registro de errores.
* Diseño responsive.
* PWA instalable.

## 5.2. Fuera del alcance inicial

* Venta directa de servicios.
* Entrenamiento propio de modelos.
* Descarga automática de videos.
* Copia completa de artículos de terceros.
* Ejecución remota de código desconocido.
* Instalación automática de repositorios.
* Modificación autónoma del código de producción.
* Uso de scraping agresivo.
* Publicación automática de información no verificada.
* Gestión financiera de inversiones.
* Compra automática de API o servicios.

---

# 6. Usuarios

## 6.1. Usuario principal

Profesional interesado en:

* Inteligencia artificial.
* Ingeniería.
* Automatización.
* Sistemas documentales.
* Investigación.
* Análisis normativo.
* Desarrollo de aplicaciones.
* Modelos locales.
* Proyectos tecnológicos.
* Vigilancia de tendencias.

## 6.2. Usuario principiante

Persona que necesita explicaciones claras, ejemplos y definiciones sencillas.

## 6.3. Usuario técnico

Profesional que requiere:

* Modelos.
* Contexto.
* Tokens.
* Precios.
* Endpoints.
* Modalidades.
* Licencias.
* Hardware.
* Benchmarks.
* Repositorios.
* Historial de cambios.

## 6.4. Administrador

Responsable de:

* Configurar fuentes.
* Habilitar proveedores.
* Revisar información.
* Validar registros.
* Corregir clasificaciones.
* Gestionar errores.
* Programar actualizaciones.
* Configurar API keys.
* Bloquear fuentes.

---

# 7. Principios de diseño

## 7.1. Una pantalla, múltiples espacios

La aplicación principal ocupará el alto completo del dispositivo:

```css
height: 100dvh;
overflow: hidden;
```

No existirá desplazamiento vertical general en escritorio.

Las zonas que requieran más contenido utilizarán desplazamiento interno:

* Listados.
* Tablas.
* Panel de detalles.
* Cronología.
* Resultados de búsqueda.

## 7.2. Información progresiva

La pantalla mostrará inicialmente información resumida.

El usuario podrá abrir:

* Detalle.
* Comparación.
* Fuente.
* Evolución.
* Aplicación.
* Riesgos.
* Información técnica.

## 7.3. Dos niveles de lectura

### Modo Explorar

Lenguaje sencillo, definiciones y ejemplos.

### Modo Profesional

Información técnica, precios, límites, licencias, API, hardware y arquitectura.

## 7.4. Movimiento controlado

Se permitirán:

* Transiciones suaves.
* Cinta de novedades.
* Indicadores de actividad.
* Animaciones del mapa.
* Resaltado de cambios.

No se permitirán:

* Carruseles rápidos.
* Parpadeo permanente.
* Movimiento que impida leer.
* Actualizaciones que cambien el contenido mientras el usuario lo examina.

---

# 8. Identidad visual

## 8.1. Concepto

La interfaz debe transmitir:

* Inteligencia estratégica.
* Exploración.
* Ciencia.
* Vigilancia tecnológica.
* Innovación mundial.
* Precisión.
* Misterio moderado.
* Profesionalismo.

## 8.2. Estilo

* Fondo oscuro o neutro profundo.
* Paneles translúcidos moderados.
* Líneas cartográficas.
* Iluminación tenue.
* Tipografía limpia.
* Indicadores pequeños.
* Tarjetas compactas.
* Mapas de alto contraste.
* Uso limitado de degradados.

## 8.3. Colores semánticos

| Estado  | Aplicación                   |
| ------- | ---------------------------- |
| Verde   | Verificado, estable, activo  |
| Ámbar   | Preview, información parcial |
| Rojo    | Retirado, riesgo o error     |
| Azul    | Información técnica          |
| Violeta | Investigación                |
| Cian    | Open source o local          |
| Gris    | Archivado o sin verificar    |

Los colores deberán respetar contraste y accesibilidad.

---

# 9. Arquitectura de navegación

## 9.1. Navegación principal

La barra lateral contendrá:

1. Hoy.
2. Proveedores.
3. Modelos.
4. Herramientas.
5. Open y local.
6. Noticias.
7. Investigación.
8. GitHub.
9. Videos.
10. Mapa.
11. Perú y LATAM.
12. Mi laboratorio.
13. Guardados.
14. Historial.

## 9.2. Navegación secundaria

En la parte superior:

* Buscador global.
* Selector Explorar/Profesional.
* Selector de idioma.
* Fecha de actualización.
* Estado de indexadores.
* Notificaciones.
* Perfil.
* Configuración.

## 9.3. Panel contextual

La zona derecha mostrará:

* Resumen.
* Por qué importa.
* Aplicaciones.
* Costos.
* Restricciones.
* Fuentes.
* Elementos relacionados.
* Recomendación personal.

---

# 10. Estructura visual general

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Logo | Buscador global | Explorar/Profesional | Actualización | Perfil   │
├───────────────┬───────────────────────────────────────┬───────────────────┤
│ Navegación    │                                       │ Panel contextual  │
│               │                                       │                   │
│ Hoy           │          Contenido principal          │ Resumen           │
│ Proveedores   │                                       │ Aplicaciones      │
│ Modelos       │  Tabla / tarjetas / mapa / timeline   │ Costos            │
│ Open y local  │                                       │ Riesgos           │
│ Noticias      │                                       │ Fuentes           │
│ Investigación │                                       │ Recomendación     │
│ GitHub        │                                       │                   │
│ Videos        │                                       │                   │
│ Perú/LATAM    │                                       │                   │
├───────────────┴───────────────────────────────────────┴───────────────────┤
│ Flujo de novedades · Pausar · Marcar como leído · Ver todos              │
└───────────────────────────────────────────────────────────────────────────┘
```

---

# 11. Rutas de aplicación

Aunque visualmente funcione como una sola pantalla, cada pestaña debe contar con una ruta propia.

```text
/
 /today
 /providers
 /providers/:providerSlug
 /models
 /models/:modelSlug
 /tools
 /tools/:toolSlug
 /open-local
 /news
 /news/:newsId
 /research
 /research/:paperId
 /github
 /github/:repositoryId
 /videos
 /videos/:videoId
 /map
 /latam
 /peru
 /laboratory
 /saved
 /history
 /search
 /settings
 /admin
 /admin/sources
 /admin/indexers
 /admin/verification
 /admin/jobs
 /admin/errors
```

Las rutas deberán conservar:

* Filtros.
* Elemento seleccionado.
* Pestaña.
* Orden.
* Vista.
* País.
* Fecha.

Esto permitirá compartir enlaces internos sin perder el contexto.

---

# 12. Módulo «Hoy»

## 12.1. Objetivo

Mostrar los cambios más importantes desde la última visita.

## 12.2. Componentes

### Resumen superior

* Modelos nuevos.
* Cambios de precio.
* Nuevos repositorios.
* Papers.
* Videos.
* Noticias regionales.
* Modelos retirados.

### Tendencia principal

Una tarjeta destacada con:

* Tema.
* Crecimiento.
* Periodo.
* Explicación.
* Aplicaciones.
* Fuentes.

### Flujo cronológico

Cada registro mostrará:

* Tipo.
* Título.
* Fuente.
* Fecha original.
* Fecha de detección.
* Tiempo transcurrido.
* Confianza.
* Región.
* Etiquetas.

### Recomendaciones

* Para observar.
* Para probar.
* Para aplicar.
* Para descartar.
* Para investigar.

## 12.3. Criterios de aceptación

* El usuario identifica los cambios desde su última sesión.
* Cada novedad tiene al menos una fuente.
* La fecha de publicación se diferencia de la fecha de detección.
* Las novedades pueden marcarse como leídas.
* Las recomendaciones pueden guardarse.

---

# 13. Módulo «Proveedores»

## 13.1. Objetivo

Centralizar las plataformas que ofrecen modelos, API, infraestructura, herramientas o recursos.

## 13.2. Categorías

* Modelos fundacionales.
* Agregadores de modelos.
* Inferencia.
* Modelos locales.
* Audio.
* Imagen.
* Video.
* Embeddings.
* OCR.
* Agentes.
* Infraestructura.
* Investigación.
* Repositorios.
* Datos.
* Automatización.

## 13.3. Proveedores iniciales

* OpenAI.
* Anthropic.
* Google Gemini.
* Hugging Face.
* NVIDIA.
* OpenRouter.
* Mistral AI.
* Groq.
* Cohere.
* Together AI.
* Fireworks AI.
* Cerebras.
* DeepInfra.
* Replicate.
* Stability AI.
* ElevenLabs.
* AssemblyAI.
* Deepgram.
* GitHub.
* Ollama.
* LM Studio.
* vLLM.
* Modal.
* RunPod.
* Cloudflare AI.
* Amazon Bedrock.
* Microsoft Azure AI.
* Google Vertex AI.

## 13.4. Datos de cada proveedor

```text
Nombre
Slug
Logotipo
Descripción sencilla
Descripción profesional
Empresa
País
Región
Categorías
Página principal
Documentación
Consola
Página de modelos
Página de precios
Página de API keys
Changelog
Estado
Tipo de acceso
Métodos de pago
Nivel gratuito
Prueba gratuita
Uso local
API disponible
SDK disponibles
Política de datos
Soporte
Última verificación
```

## 13.5. Botones de acceso

Cada ficha tendrá:

* Visitar proveedor.
* Explorar modelos.
* Obtener API key.
* Ver precios.
* Ver documentación.
* Ver changelog.
* Ver ejemplos.
* Guardar.
* Comparar.

Los enlaces serán configurables desde la base de datos.

---

# 14. Módulo «Modelos»

## 14.1. Objetivo

Comparar modelos según capacidades, costo, disponibilidad y caso de uso.

## 14.2. Modalidades

* Texto.
* Código.
* Imagen.
* Audio.
* Voz.
* Video.
* Embeddings.
* Reranking.
* OCR.
* Multimodal.

## 14.3. Filtros

* Proveedor.
* País.
* Modalidad.
* Entrada.
* Salida.
* Contexto.
* Precio.
* Razonamiento.
* Tool calling.
* Streaming.
* Salida estructurada.
* Búsqueda web.
* API.
* Disponibilidad regional.
* Modelo local.
* Licencia.
* Estado.
* Fecha de lanzamiento.

## 14.4. Datos del modelo

```text
Nombre
Identificador API
Proveedor
Familia
Versión
Fecha de lanzamiento
Fecha de retiro
Estado
Modalidad de entrada
Modalidad de salida
Ventana de contexto
Salida máxima
Precio de entrada
Precio de salida
Precio de caché
Precio de audio
Precio de imagen
Precio de video
Precio de herramientas
Capacidad de razonamiento
Tool calling
Structured outputs
Streaming
Embeddings
Uso local
Licencia
Hardware estimado
Regiones disponibles
Documentación
Fuente del precio
Fecha de verificación
```

## 14.5. Comparador

Permitirá seleccionar hasta cuatro modelos.

Comparará:

* Capacidad.
* Contexto.
* Precio.
* Modalidad.
* Latencia estimada.
* Calidad.
* Privacidad.
* Facilidad.
* Estabilidad.
* Uso recomendado.

---

# 15. Simulador de costos

## 15.1. Casos de uso

* Consulta de chat.
* Resumen documental.
* Análisis de PDF.
* Sistema RAG.
* Transcripción.
* Diarización.
* OCR.
* Generación de imágenes.
* Generación de video.
* Programación.
* Agente.
* Clasificación masiva.
* Embeddings.
* Atención al cliente.

## 15.2. Parámetros

```text
Número de usuarios
Consultas por día
Tokens de entrada
Tokens de salida
Archivos por día
Páginas por archivo
Minutos de audio
Imágenes
Videos
Embeddings
Periodo mensual
Tipo de cambio
Margen de contingencia
```

## 15.3. Resultado

* Costo diario.
* Costo mensual.
* Costo anual.
* Costo en dólares.
* Costo en soles.
* Alternativa económica.
* Alternativa equilibrada.
* Alternativa avanzada.
* Alternativa local.
* Punto de equilibrio entre nube y local.

---

# 16. Módulo «Herramientas»

## 16.1. Objetivo

Mostrar productos listos para utilizar, no únicamente modelos.

## 16.2. Categorías

* Investigación.
* Programación.
* Documentos.
* Presentaciones.
* Audio.
* Voz.
* Imagen.
* Video.
* Automatización.
* Agentes.
* Datos.
* Ingeniería.
* Legal.
* Salud.
* Educación.
* Seguridad.
* Marketing.
* Operaciones.

## 16.3. Datos

```text
Nombre
Proveedor
Descripción
Categoría
Página principal
Precio
Plan gratuito
API
Aplicación de escritorio
Aplicación web
Aplicación móvil
Extensión
Uso local
Idioma
Privacidad
Integraciones
Nivel de dificultad
Casos de uso
Limitaciones
Última verificación
```

---

# 17. Módulo «Open y local»

## 17.1. Objetivo

Diferenciar correctamente modelos y herramientas que pueden utilizarse sin depender completamente de servicios externos.

## 17.2. Etiquetas obligatorias

* Open source.
* Open-weight.
* Source-available.
* Gratuito.
* Freemium.
* Prueba gratuita.
* API gratuita limitada.
* Local.
* Autoalojable.
* Uso comercial permitido.
* Uso comercial restringido.

## 17.3. Compatibilidad de hardware

El sistema registrará:

```text
RAM mínima
RAM recomendada
VRAM mínima
VRAM recomendada
CPU compatible
GPU NVIDIA
GPU AMD
Apple Silicon
Cuantizaciones
Tamaño de descarga
Sistema operativo
Docker
Ollama
LM Studio
vLLM
```

## 17.4. Indicador personalizado

El usuario podrá registrar su equipo.

El portal mostrará:

* Compatible.
* Compatible con limitaciones.
* Requiere cuantización.
* Funcionará lentamente.
* No recomendado.
* Requiere GPU superior.

---

# 18. Módulo «Noticias»

## 18.1. Objetivo

Recopilar noticias y avances relevantes sin convertirse en un agregador indiscriminado.

## 18.2. Tipos

* Lanzamiento.
* Actualización.
* Precio.
* Investigación.
* Inversión.
* Regulación.
* Seguridad.
* Adquisición.
* Infraestructura.
* Caso de uso.
* Retiro.
* Controversia.

## 18.3. Jerarquía de fuentes

1. Documentación oficial.
2. Changelog.
3. Blog oficial.
4. Repositorio oficial.
5. Paper.
6. Organismo público.
7. Agencia de noticias.
8. Medio tecnológico reconocido.
9. Comunidad.

## 18.4. Datos de noticia

```text
Título
Resumen
Resumen sencillo
Análisis profesional
Fuente
Autor
URL
Fecha de publicación
Fecha de detección
Fecha de actualización
Proveedor
País
Región
Tema
Confianza
Estado de verificación
Impacto
Aplicaciones
Riesgos
Noticias relacionadas
```

## 18.5. Control de duplicados

El sistema deberá detectar noticias duplicadas mediante:

* URL canónica.
* Título normalizado.
* Similitud semántica.
* Entidades.
* Fecha.
* Fuente original.

Una noticia podrá tener varias fuentes vinculadas.

---

# 19. Módulo «Investigación»

## 19.1. Objetivo

Indexar investigación científica y técnica.

## 19.2. Fuentes

* arXiv.
* OpenAlex.
* Semantic Scholar.
* Crossref.
* Hugging Face Papers.
* SciELO.
* LA Referencia.
* ALICIA.
* PerúCRIS.
* Repositorios universitarios.

## 19.3. Clasificación

* Preprint.
* Revisado por pares.
* Tesis.
* Conferencia.
* Documento técnico.
* Benchmark empresarial.
* Evaluación independiente.
* Replicación.

## 19.4. Datos

```text
Título
Autores
Instituciones
Países
Resumen original
Resumen sencillo
Análisis profesional
Metodología
Resultados
Limitaciones
Aplicaciones
DOI
URL
Fecha
Citas
Temas
Nivel de evidencia
Madurez
Código asociado
Dataset asociado
```

## 19.5. Evaluación de madurez

* Idea.
* Investigación inicial.
* Prototipo.
* Validación.
* Piloto.
* Aplicación productiva.

---

# 20. Módulo «GitHub»

## 20.1. Objetivo

Detectar proyectos útiles, recientes y en crecimiento.

## 20.2. Filtros

* Tema.
* Lenguaje.
* Fecha de creación.
* Última actualización.
* Estrellas.
* Crecimiento semanal.
* Forks.
* Contributors.
* Issues.
* Licencia.
* Demo.
* Docker.
* Windows.
* Local.
* GPU.
* Dificultad.

## 20.3. Índice de impulso

```text
Momentum Score =
crecimiento de estrellas
+ actividad de commits
+ nuevos contribuidores
+ releases recientes
+ resolución de issues
+ calidad documental
+ continuidad temporal
```

## 20.4. Índice de utilidad

```text
Utility Score =
documentación
+ licencia clara
+ facilidad de instalación
+ demo disponible
+ compatibilidad
+ mantenimiento
+ seguridad
+ relación con casos de uso
```

## 20.5. Datos

```text
Nombre
Organización
Descripción
URL
Fecha de creación
Última actualización
Estrellas
Crecimiento
Forks
Issues
Contributors
Lenguaje
Licencia
Release
Docker
Demo
Documentación
Requerimientos
Nivel de dificultad
Momentum Score
Utility Score
```

---

# 21. Módulo «Videos»

## 21.1. Objetivo

Recopilar videos técnicos y educativos seleccionados.

## 21.2. Fuentes

* Canales oficiales.
* Universidades.
* Laboratorios.
* Conferencias.
* Cursos.
* Demostraciones.
* Investigadores.

## 21.3. Datos

```text
Título
Canal
Proveedor
URL
Fecha
Duración
Idioma
Subtítulos
Tema
Nivel
Tipo
Resumen
Aprendizajes
Aplicaciones
Confianza
Proyecto relacionado
```

## 21.4. Acciones

* Ver.
* Guardar.
* Marcar como visto.
* Resumir.
* Relacionar.
* Ocultar canal.
* Seguir canal.

---

# 22. Módulo «Mapa mundial»

## 22.1. Tecnología

MapLibre GL JS o equivalente open source.

## 22.2. Capas

* Empresas.
* Laboratorios.
* Universidades.
* Modelos.
* Inversiones.
* Repositorios.
* Papers.
* Regulaciones.
* Centros de datos.
* Eventos.
* Patentes.
* Proyectos gubernamentales.

## 22.3. Interacción

Al seleccionar un país:

* Indicadores.
* Empresas principales.
* Modelos.
* Investigaciones.
* Repositorios.
* Noticias.
* Inversión.
* Regulación.
* Productos.
* Tendencias.

## 22.4. Modos

* País.
* Región.
* Tema.
* Periodo.
* Intensidad.
* Crecimiento.
* Comparación.

---

# 23. Módulo «Perú y Latinoamérica»

## 23.1. Objetivo

Priorizar información regional.

## 23.2. Países iniciales

* Perú.
* Brasil.
* México.
* Argentina.
* Chile.
* Colombia.
* Uruguay.
* Ecuador.
* Bolivia.
* Paraguay.
* Costa Rica.
* Panamá.

## 23.3. Categorías

* Investigación.
* Universidades.
* Startups.
* Empresas.
* Fondos.
* Convocatorias.
* Regulación.
* Repositorios.
* Eventos.
* Proyectos públicos.
* Casos de uso.
* Datasets.

## 23.4. Panel Perú

* Investigaciones nuevas.
* Instituciones activas.
* Convocatorias.
* Repositorios.
* Empresas.
* Eventos.
* Normativa.
* Vacíos tecnológicos.
* Oportunidades.

## 23.5. Detección de oportunidades

El sistema podrá generar observaciones como:

> Existe crecimiento de investigación en OCR, pero poca oferta de productos especializados en documentos administrativos peruanos.

> Se detecta disponibilidad de modelos de voz en español, pero escasa adaptación a terminología jurídica peruana.

Estas recomendaciones deberán etiquetarse como inferencias, no como hechos.

---

# 24. Módulo «Mi laboratorio»

## 24.1. Objetivo

Convertir una necesidad en una posible arquitectura tecnológica.

## 24.2. Formulario

```text
Nombre del proyecto
Problema
Usuarios
Tipo de datos
Volumen
Privacidad
Presupuesto
Modalidad
Hardware
Resultado esperado
```

## 24.3. Resultado

* Arquitectura sugerida.
* Modelos.
* Herramientas.
* Proveedores.
* Repositorios.
* Papers.
* Costos.
* Riesgos.
* Dificultad.
* Alternativa local.
* Alternativa económica.
* Alternativa profesional.
* Próximos pasos.

## 24.4. Estados del proyecto

* Idea.
* Investigación.
* Evaluación.
* Prototipo.
* Piloto.
* Producción.
* Archivado.

---

# 25. Buscador global

## 25.1. Alcance

Buscará en:

* Proveedores.
* Modelos.
* Herramientas.
* Noticias.
* Papers.
* Repositorios.
* Videos.
* Países.
* Proyectos.
* Casos de uso.

## 25.2. Búsqueda semántica

Ejemplo:

> “Quiero analizar documentos confidenciales sin subirlos a internet”.

El sistema deberá relacionar:

* Modelos locales.
* RAG.
* OCR local.
* Herramientas autoalojables.
* Repositorios.
* Hardware.
* Riesgos.
* Costos.

## 25.3. Comandos rápidos

```text
/modelos
/proveedores
/local
/peru
/github
/videos
/precios
/comparar
```

---

# 26. Motor de recomendaciones

## 26.1. Fuentes de recomendación

* Preferencias.
* Proyectos guardados.
* Historial de navegación.
* Temas seguidos.
* Hardware registrado.
* Presupuesto.
* Nivel técnico.
* Región.
* Elementos guardados.

## 26.2. Tipos

* Conviene probar.
* Conviene observar.
* Puede reemplazar otra herramienta.
* Redujo su precio.
* Compatible con tu equipo.
* Relacionado con tu proyecto.
* Tecnología inmadura.
* Riesgo de privacidad.
* Próxima a retiro.
* Nueva oportunidad.

## 26.3. Transparencia

Cada recomendación deberá explicar:

* Por qué apareció.
* Qué datos utilizó.
* Qué nivel de confianza tiene.
* Qué limitaciones presenta.

---

# 27. Sistema de confianza

## 27.1. Niveles

### Verificado

Fuente oficial o API oficial.

### Confirmado

Coincidencia entre varias fuentes confiables.

### Provisional

Anuncio pendiente de documentación completa.

### Inferido

Conclusión producida a partir de datos relacionados.

### No verificado

Información comunitaria o insuficiente.

## 27.2. Campos

```text
confidence_level
verification_status
verified_by
verified_at
source_count
official_source
evidence_notes
```

---

# 28. Motor de indexación

## 28.1. Flujo

```text
Descubrir
↓
Capturar
↓
Normalizar
↓
Limpiar
↓
Deduplicar
↓
Clasificar
↓
Verificar
↓
Relacionar
↓
Versionar
↓
Publicar
```

## 28.2. Indexadores

Cada fuente tendrá un adaptador independiente:

```text
OpenRouterIndexer
HuggingFaceIndexer
GitHubIndexer
ArxivIndexer
OpenAlexIndexer
YouTubeIndexer
ProviderChangelogIndexer
NewsIndexer
LatamResearchIndexer
```

## 28.3. Estados de ejecución

* Pendiente.
* Ejecutando.
* Completado.
* Completado con advertencias.
* Fallido.
* Bloqueado por límite.
* Requiere revisión.

## 28.4. Control de frecuencia

| Fuente                 | Frecuencia inicial |
| ---------------------- | -----------------: |
| Changelogs             |       Cada 2 horas |
| Modelos                |       Cada 6 horas |
| Precios                |      Cada 12 horas |
| Noticias               |          Cada hora |
| GitHub                 |       Cada 6 horas |
| Papers                 |      Cada 12 horas |
| Videos                 |      Cada 12 horas |
| Perú/LATAM             |             Diaria |
| Indicadores históricos |            Semanal |

---

# 29. Historial y versionado

No se sobrescribirá información crítica sin conservar versiones.

## 29.1. Elementos versionados

* Precios.
* Capacidades.
* Contexto.
* Estado.
* Licencia.
* Disponibilidad.
* Modelos.
* Herramientas.
* Enlaces.
* Requerimientos.

## 29.2. Vista de evolución

```text
10/06/2026 — Modelo publicado
18/06/2026 — Precio actualizado
02/07/2026 — Contexto ampliado
15/07/2026 — Nueva capacidad de audio
18/07/2026 — Estado cambiado a estable
```

## 29.3. Comparación

El usuario podrá seleccionar dos fechas y observar:

* Antes.
* Después.
* Campo modificado.
* Fuente.
* Impacto.

---

# 30. Modelo de datos

## 30.1. Tablas principales

```text
users
user_profiles
user_devices
user_preferences
providers
provider_links
provider_sources
models
model_versions
model_capabilities
model_prices
tools
tool_versions
licenses
repositories
repository_snapshots
papers
authors
institutions
videos
news_items
news_sources
countries
regions
organizations
investments
regulations
events
projects
project_recommendations
saved_items
watchlists
notifications
sources
source_snapshots
indexing_jobs
indexing_errors
verification_logs
change_events
tags
entity_tags
```

## 30.2. Campos comunes

Toda entidad indexada deberá contener:

```text
id
slug
name
description
source_url
source_type
published_at
detected_at
updated_at
verified_at
confidence_level
verification_status
country_id
language
status
metadata
content_hash
```

---

# 31. Arquitectura tecnológica

## 31.1. Frontend

* React.
* TypeScript.
* Next.js o Vite.
* Tailwind CSS.
* Componentes accesibles.
* TanStack Query.
* Zustand o Context para estado ligero.
* MapLibre GL JS.
* PWA.
* IndexedDB.
* Virtualización de listas.

## 31.2. Backend

* Supabase PostgreSQL.
* Supabase Auth.
* Edge Functions.
* PostgreSQL Full-Text Search.
* `pgvector`.
* Supabase Storage.
* Supabase Vault.
* Row Level Security.

## 31.3. Automatización

* Supabase Cron.
* Cloudflare Workers.
* GitHub Actions para tareas auxiliares.
* Cola de trabajos.
* Reintentos exponenciales.
* Caché.
* Registro de límites.

## 31.4. Despliegue

Alternativa recomendada:

```text
Frontend: Vercel o Cloudflare Pages
Backend: Supabase
Workers: Cloudflare Workers
Base de datos: PostgreSQL
Mapas: MapLibre
Almacenamiento: Supabase Storage
```

---

# 32. Seguridad

## 32.1. Secretos

Las API keys se almacenarán únicamente en:

* Variables de entorno del servidor.
* Supabase Vault.
* Cloudflare Secrets.
* Vercel Environment Variables.
* GitHub Secrets.

## 32.2. Prohibiciones

No se permitirá almacenar claves en:

* Código fuente.
* Repositorio.
* Frontend.
* Local Storage.
* URL.
* Logs.
* Capturas.
* Respuestas públicas.

## 32.3. Acceso

Roles:

* Administrador.
* Editor.
* Usuario.
* Invitado.

## 32.4. Protección

* Row Level Security.
* Rate limiting.
* Validación de entrada.
* Sanitización.
* Protección XSS.
* Protección CSRF.
* Auditoría.
* Cifrado.
* Rotación de claves.

---

# 33. Rendimiento

## 33.1. Objetivos

* Primera carga menor a 3 segundos en conexión adecuada.
* Cambio de pestaña menor a 300 ms con caché.
* Búsqueda inicial menor a 1 segundo.
* Listas virtualizadas.
* Imágenes optimizadas.
* Carga diferida del mapa.
* Caché de consultas.
* Sin bloqueo por tareas de indexación.

## 33.2. Estrategias

* Server-side pagination.
* Lazy loading.
* IndexedDB.
* CDN.
* Compresión.
* Snapshots.
* Actualización incremental.
* Índices PostgreSQL.
* Materialized views.

---

# 34. Funcionamiento sin conexión

La PWA permitirá consultar parcialmente:

* Favoritos.
* Historial reciente.
* Proveedores guardados.
* Modelos guardados.
* Proyectos.
* Últimos datos sincronizados.

No se permitirá sin conexión:

* Actualización de fuentes.
* Verificación.
* Noticias nuevas.
* Recolección.
* Comparaciones que requieran datos remotos.

---

# 35. Panel administrativo

## 35.1. Fuentes

* Crear fuente.
* Editar.
* Habilitar.
* Deshabilitar.
* Probar conexión.
* Revisar límites.
* Ver última ejecución.

## 35.2. Indexadores

* Ejecutar manualmente.
* Pausar.
* Reintentar.
* Cambiar frecuencia.
* Ver registros.

## 35.3. Verificación

* Pendientes.
* Provisionales.
* Conflictos.
* Sin fuente oficial.
* Información antigua.

## 35.4. Errores

* API no disponible.
* Límite superado.
* Respuesta inválida.
* Cambio de esquema.
* Error de autenticación.
* Registro duplicado.

---

# 36. Observabilidad

## 36.1. Indicadores

* Fuentes activas.
* Última actualización.
* Trabajos exitosos.
* Trabajos fallidos.
* Registros nuevos.
* Registros actualizados.
* Duplicados.
* Tiempo de proceso.
* Consumo de API.
* Costo estimado.

## 36.2. Alertas

* Fuente sin actualizar.
* API key vencida.
* Precio no verificado.
* Proveedor retirado.
* Modelo próximo a retiro.
* Cambio importante.
* Error repetitivo.

---

# 37. Diseño responsive

## 37.1. Escritorio

Tres columnas:

* Navegación.
* Contenido.
* Panel contextual.

## 37.2. Tablet

Dos columnas:

* Navegación colapsable.
* Contenido.

El panel contextual se abrirá como drawer.

## 37.3. Móvil

* Barra superior compacta.
* Navegación inferior.
* Tarjetas verticales.
* Drawer para filtros.
* Panel de detalle en pantalla completa.
* Sin tablas horizontales extensas.
* Uso de tarjetas comparativas.

---

# 38. Accesibilidad

* Navegación mediante teclado.
* Lectores de pantalla.
* Contraste adecuado.
* Indicadores no dependientes solo del color.
* Texto alternativo.
* Reducción de movimiento.
* Tamaño mínimo táctil.
* Foco visible.
* Subtítulos cuando estén disponibles.

---

# 39. Fases de desarrollo

## Fase 1 — Fundamentos

* Estructura del proyecto.
* Autenticación.
* Base de datos.
* Layout.
* Navegación.
* Buscador básico.
* Proveedores.
* Modelos.
* Panel administrativo inicial.

## Fase 2 — Indexación

* OpenRouter.
* Hugging Face.
* GitHub.
* arXiv.
* OpenAlex.
* Changelogs.

## Fase 3 — Inteligencia

* Normalización.
* Deduplicación.
* Confianza.
* Resúmenes.
* Relación de entidades.
* Recomendaciones.

## Fase 4 — Exploración

* Noticias.
* Videos.
* Open y local.
* Comparador.
* Simulador de costos.
* Historial.

## Fase 5 — Geografía

* Mapa.
* Perú y Latinoamérica.
* Instituciones.
* Investigación regional.
* Oportunidades.

## Fase 6 — Laboratorio

* Proyectos.
* Arquitecturas sugeridas.
* Estimación de costos.
* Relación con modelos y repositorios.

---

# 40. MVP recomendado

El MVP deberá incluir:

1. Inicio.
2. Proveedores.
3. Modelos.
4. Open y local.
5. Noticias.
6. GitHub.
7. Investigación.
8. Favoritos.
9. Buscador.
10. Administración de fuentes.

Fuentes iniciales:

* OpenRouter.
* Hugging Face.
* GitHub.
* arXiv.
* OpenAlex.
* Cinco proveedores oficiales.

No se incorporará inicialmente:

* Inversiones avanzadas.
* Patentes.
* Empleo.
* Centros de datos.
* Agentes autónomos complejos.

---

# 41. Criterios globales de aceptación

El producto será aceptable cuando:

1. Muestre información de al menos veinte proveedores.
2. Permita comparar al menos cuatro modelos.
3. Distinga open source, open-weight, gratuito y local.
4. Registre fechas de publicación y detección.
5. Mantenga fuentes visibles.
6. Muestre historial de cambios.
7. Detecte novedades desde la última visita.
8. Permita guardar elementos.
9. Funcione en escritorio y móvil.
10. Tenga actualización automática.
11. Permita desactivar fuentes.
12. Mantenga API keys fuera del frontend.
13. Permita consultar errores de indexación.
14. Clasifique la confianza de cada registro.
15. No copie artículos completos.
16. Permita buscar por necesidad y no solo por nombre.
17. Muestre aplicaciones posibles para cada tecnología.
18. Priorice contenido de Perú y Latinoamérica cuando corresponda.

---

# 42. Estructura sugerida del repositorio

```text
src/
├── app/
│   ├── today/
│   ├── providers/
│   ├── models/
│   ├── tools/
│   ├── open-local/
│   ├── news/
│   ├── research/
│   ├── github/
│   ├── videos/
│   ├── map/
│   ├── peru/
│   ├── latam/
│   ├── laboratory/
│   ├── saved/
│   ├── history/
│   └── admin/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── cards/
│   ├── tables/
│   ├── filters/
│   ├── map/
│   ├── charts/
│   ├── search/
│   └── common/
├── features/
│   ├── providers/
│   ├── models/
│   ├── news/
│   ├── research/
│   ├── repositories/
│   ├── videos/
│   ├── recommendations/
│   └── indexing/
├── services/
│   ├── api/
│   ├── supabase/
│   ├── search/
│   └── analytics/
├── hooks/
├── types/
├── schemas/
├── utils/
└── config/

supabase/
├── migrations/
├── functions/
│   ├── index-openrouter/
│   ├── index-huggingface/
│   ├── index-github/
│   ├── index-arxiv/
│   ├── index-openalex/
│   ├── index-youtube/
│   └── index-news/
└── seed/
```

---

# 43. Variables de entorno

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

OPENROUTER_API_KEY
HUGGINGFACE_TOKEN
GITHUB_TOKEN
YOUTUBE_API_KEY
SEMANTIC_SCHOLAR_API_KEY

OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY

CRON_SECRET
ENCRYPTION_KEY
APP_BASE_URL
```

Las variables privadas nunca deberán utilizar prefijos públicos como `VITE_` o `NEXT_PUBLIC_`.

---

# 44. Resultado esperado

AMARU AI Observatory deberá convertirse en una herramienta personal de consulta diaria.

Al ingresar, el usuario podrá comprender rápidamente:

* Qué cambió.
* Qué está creciendo.
* Qué desapareció.
* Qué cuesta menos.
* Qué puede ejecutarse localmente.
* Qué proyecto apareció.
* Qué investigación merece atención.
* Qué ocurre en Perú.
* Qué alternativa es compatible con su equipo.
* Qué solución podría construir.

El producto no deberá limitarse a acumular información.

Su propósito será:

> **Transformar señales tecnológicas dispersas en decisiones, conocimiento y proyectos aplicables.**
