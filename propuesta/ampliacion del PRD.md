# Ampliación del PRD

## Módulo Mercado IA — Acciones, ETF, infraestructura y derivados

**Producto:** AMARU AI Observatory
**Nueva ruta principal:** `/markets`
**Infraestructura:** Cloudflare Workers, D1, KV y R2
**Finalidad:** observar el comportamiento financiero del ecosistema mundial de inteligencia artificial sin ejecutar operaciones bursátiles.

---

# 1. Objetivo del módulo

El módulo **Mercado IA** permitirá seguir el desempeño financiero de empresas, fondos e industrias relacionadas directa o indirectamente con la inteligencia artificial.

No se limitará a presentar el precio de una acción. Deberá explicar:

* Qué papel ocupa la empresa dentro de la cadena de valor de IA.
* Cuánto ha variado su precio.
* Qué noticias pueden estar relacionadas con la variación.
* Qué resultados financieros publicó.
* Qué exposición efectiva tiene a la inteligencia artificial.
* En qué ETF relacionados aparece.
* Qué productos, modelos o infraestructura desarrolla.
* Qué riesgos regulatorios, tecnológicos o empresariales presenta.
* Qué ocurrió desde la última visita.
* Qué fuente proporcionó cada dato.
* Si el dato es en tiempo real, retrasado o de cierre diario.

El módulo será informativo y analítico. No ejecutará compras, ventas ni operaciones automatizadas.

---

# 2. Nueva estructura de navegación

```text
/markets
/markets/overview
/markets/equities
/markets/etfs
/markets/value-chain
/markets/derivatives
/markets/fundamentals
/markets/filings
/markets/news
/markets/macro
/markets/peru
/markets/watchlists
/markets/assets/:symbol
```

En la navegación principal aparecerá:

```text
Hoy
Proveedores
Modelos
Open y local
Noticias
Investigación
GitHub
Videos
Mapa
Perú y LATAM
Mercado IA
Mi laboratorio
```

---

# 3. Vista principal

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ MERCADO IA    Mercado abierto/cerrado    USD/PEN    Última actualización │
├────────────────┬─────────────────────────────────────┬────────────────────┤
│ Categorías     │                                     │ Contexto           │
│                │      Gráfico y activos              │                    │
│ Acciones       │                                     │ Empresa            │
│ ETF            │    Precio · variación · volumen     │ Rol dentro de IA   │
│ Semiconductores│    comparaciones · rendimiento      │ Noticias           │
│ Cloud          │                                     │ Fundamentales      │
│ Software       │                                     │ Riesgos            │
│ Data centers   │                                     │ Fuentes            │
│ Robótica       │                                     │                    │
│ Energía        │                                     │                    │
│ Derivados      │                                     │                    │
├────────────────┴─────────────────────────────────────┴────────────────────┤
│ NVDA −0,8 % · AIQ +0,4 % · Nueva presentación SEC · ETF actualizado      │
└───────────────────────────────────────────────────────────────────────────┘
```

---

# 4. Clasificación de activos

## 4.1. Empresas cotizadas

Las empresas se organizarán según su posición dentro del ecosistema.

### Cómputo y semiconductores

* Diseño de GPU y aceleradores.
* Fabricación de semiconductores.
* Equipos de litografía.
* Memoria de alto ancho de banda.
* Procesamiento de redes.
* Componentes electrónicos.
* Encapsulado avanzado.

### Nube y plataformas

* Infraestructura cloud.
* Servicios empresariales de IA.
* Entrenamiento e inferencia.
* Plataformas de datos.
* Servicios de modelos.

### Software y aplicaciones

* Software empresarial.
* Analítica.
* Bases de datos.
* Ciberseguridad.
* Automatización.
* Agentes.
* Desarrollo asistido.
* Atención al cliente.

### Infraestructura física

* Centros de datos.
* Redes.
* Refrigeración.
* Energía.
* Equipos eléctricos.
* Fibra y conectividad.
* Inmobiliarias de centros de datos.

### Robótica y automatización

* Robótica industrial.
* Vehículos autónomos.
* Sensores.
* Automatización logística.
* Equipamiento médico.
* Robots humanoides.
* Visión industrial.

### Servicios profesionales

* Consultoría.
* Integración tecnológica.
* Outsourcing.
* Centros de datos gestionados.
* Implementación empresarial.

---

# 5. Puntuación de exposición a IA

El portal no debe clasificar automáticamente a toda empresa tecnológica como una empresa de IA.

Se creará un indicador editorial:

## AI Exposure Score

```text
AI Exposure Score =
ingresos relacionados con IA
+ inversión declarada
+ productos comerciales
+ infraestructura suministrada
+ patentes e investigación
+ contratos y clientes
+ presencia en ETF temáticos
```

Escala:

| Puntuación | Clasificación             |
| ---------: | ------------------------- |
|     80–100 | Exposición central        |
|      60–79 | Exposición significativa  |
|      40–59 | Exposición complementaria |
|      20–39 | Exposición indirecta      |
|       0–19 | Relación marginal         |

Cada puntuación deberá mostrar:

* Metodología.
* Fecha de cálculo.
* Fuentes utilizadas.
* Factores positivos.
* Factores que reducen la puntuación.
* Nivel de confianza.

Esta clasificación será una inferencia del observatorio, no una recomendación de inversión.

---

# 6. ETF temáticos

El catálogo inicial puede incorporar fondos vinculados con IA, robótica, semiconductores e infraestructura.

## Núcleo inicial

| Símbolo | Enfoque                                            |
| ------- | -------------------------------------------------- |
| AIQ     | Inteligencia artificial y tecnología               |
| BOTZ    | Robótica e inteligencia artificial                 |
| CHAT    | Inteligencia artificial generativa                 |
| ARTY    | Software, infraestructura y servicios de IA        |
| IGPT    | IA y software de nueva generación                  |
| THNQ    | Empresas mundiales vinculadas con IA               |
| ROBO    | Robótica, automatización e inteligencia artificial |
| CHPX    | Semiconductores de IA y computación cuántica       |

AIQ y BOTZ son fondos de Global X vinculados respectivamente con inteligencia artificial y tecnología, y con robótica e IA. CHAT es un fondo temático de inteligencia artificial generativa; ARTY sigue empresas relacionadas con software, infraestructura y servicios de IA; IGPT se orienta a IA y software de nueva generación; THNQ y ROBO cubren inteligencia artificial, robótica y automatización.

## Productos relacionados con infraestructura

También pueden incorporarse como categoría secundaria:

* Memoria y HBM.
* Centros de datos.
* Semiconductores.
* Computación cuántica.
* Redes.
* Electricidad.
* Refrigeración.
* Componentes electrónicos.

Estos productos no deberán etiquetarse automáticamente como fondos “puros de IA”. Se presentarán como **exposición derivada o infraestructura habilitadora**.

## Información de cada ETF

```text
Símbolo
Nombre
Gestor
Fecha de creación
Mercado
Moneda
Precio
NAV
Activos bajo gestión
Ratio de gastos
Número de posiciones
Índice de referencia
Principales posiciones
Distribución por país
Distribución por sector
Rendimiento
Volatilidad
Fuente de posiciones
Fecha de actualización
```

Los gestores como Global X e iShares publican información de objetivos, gastos, rendimiento y posiciones, y en determinados casos permiten descargar las tenencias del fondo. Estas fuentes deben tener prioridad sobre un proveedor secundario para conocer la composición del ETF.

---

# 7. Derivados

La sección `/markets/derivatives` deberá separar claramente:

## Opciones

* Opciones sobre acciones relacionadas con IA.
* Opciones sobre ETF temáticos.
* Precio de ejercicio.
* Fecha de vencimiento.
* Call o put.
* Volumen.
* Interés abierto.
* Volatilidad implícita.
* Delta, gamma, theta y vega.
* Bid y ask.

## Futuros

No existe necesariamente un futuro bursátil específico y universal de “inteligencia artificial”. El visor puede mostrar futuros relacionados con factores que afectan al sector:

* Nasdaq-100.
* Semiconductores o índices tecnológicos, cuando existan.
* Electricidad.
* Gas natural.
* Cobre.
* Bonos del Tesoro.
* Tasas de interés.

## Índices

* Índices tecnológicos.
* Índices de semiconductores.
* Índices de robótica.
* Índices de inteligencia artificial.
* Índices de centros de datos.
* Índices de infraestructura digital.

## Regla de seguridad

La primera versión mostrará:

* Cotización.
* cadena de opciones.
* volumen.
* vencimientos.
* información educativa.

No deberá:

* Recomendar operaciones apalancadas.
* Calcular apuestas de compra o venta.
* Ejecutar órdenes.
* Conectarse a un bróker.
* presentar predicciones como certezas.

---

# 8. Información de cada activo

La ficha de una acción o ETF contendrá:

```text
Símbolo
Nombre
Mercado
País
Moneda
Sector
Industria
Cadena de valor IA
Precio actual
Precio anterior
Variación
Volumen
Máximo y mínimo
Capitalización
PER
Beneficio por acción
Ingresos
Crecimiento
Margen
Deuda
Flujo de caja
Dividendos
Próximo resultado
Último filing
Noticias relacionadas
ETF que mantienen el activo
AI Exposure Score
Fecha y retraso del dato
Fuente
```

## Visualizaciones

* Intradía.
* Cinco días.
* Un mes.
* Seis meses.
* Año actual.
* Un año.
* Cinco años.
* Comparación con ETF.
* Comparación con índice.
* Comparación por cadena de valor.

---

# 9. API financieras recomendadas

No conviene conectar diez proveedores simultáneamente. El MVP debe utilizar un proveedor principal, fuentes oficiales para verificación y uno secundario de respaldo.

## 9.1. Twelve Data

### Uso recomendado

* Precios.
* Series históricas.
* Acciones.
* ETF.
* Forex.
* Criptoactivos.
* Indicadores técnicos.
* WebSocket en planes compatibles.

Twelve Data ofrece APIs para acciones, divisas, criptomonedas y otros activos, con REST y documentación sobre series temporales y límites por plan.

### Endpoint conceptual

```text
GET https://api.twelvedata.com/time_series
    ?symbol=NVDA
    &interval=1day
    &apikey=SECRET
```

### Papel en AMARU

**Proveedor principal recomendado para precios y gráficos durante el MVP.**

---

## 9.2. Financial Modeling Prep

### Uso recomendado

* Perfil empresarial.
* Estados financieros.
* métricas.
* resultados.
* ETF.
* calendarios.
* noticias financieras.
* datos históricos de cierre.

Su plan básico gratuito publica actualmente 250 llamadas diarias, datos históricos de cierre y datos de referencia. FMP también advierte que mostrar o redistribuir sus datos puede requerir un acuerdo específico de licencia.

### Endpoint conceptual

```text
GET https://financialmodelingprep.com/stable/profile
    ?symbol=NVDA
    &apikey=SECRET
```

### Papel en AMARU

**Proveedor secundario para perfiles, fundamentos y cierre diario.**

---

## 9.3. Finnhub

### Uso recomendado

* Cotizaciones.
* Datos fundamentales.
* Noticias empresariales.
* Calendario de resultados.
* recomendaciones de analistas.
* transcripciones.
* indicadores económicos.

Finnhub ofrece una clave gratuita y acceso a datos bursátiles, fundamentales, económicos y alternativos, aunque la cobertura y los derechos de presentación dependen del plan contratado.

### Endpoint conceptual

```text
GET https://finnhub.io/api/v1/quote
    ?symbol=NVDA
    &token=SECRET
```

### Papel en AMARU

**Alternativa a Twelve Data o fuente complementaria de noticias y eventos.**

---

## 9.4. Alpha Vantage

### Uso recomendado

* Series diarias.
* indicadores técnicos.
* opciones.
* divisas.
* materias primas.
* criptomonedas.
* inteligencia de noticias.

La cuenta gratuita está limitada actualmente a 25 solicitudes diarias para la mayoría de conjuntos, por lo que no es adecuada como proveedor principal de un visor con numerosos activos.

### Papel en AMARU

**Fuente auxiliar y de validación, no fuente principal.**

---

## 9.5. Massive

Anteriormente conocida como Polygon.io, ofrece productos para:

* Acciones.
* opciones.
* futuros.
* índices.
* Forex.
* criptomonedas.
* filings.
* operaciones y cotizaciones.

Dispone de planes básicos y de pago. La información detallada de opciones y futuros depende del producto contratado y de las licencias correspondientes.

### Papel en AMARU

**Proveedor recomendado cuando se implemente la fase profesional de derivados.**

---

## 9.6. Nasdaq Data Link

### Uso recomendado

* Datasets financieros.
* datos alternativos.
* datos económicos.
* series históricas.
* índices.
* productos premium.
* streaming.

Nasdaq Data Link ofrece datasets gratuitos y de pago mediante API REST, tablas y productos de streaming. Requiere una API key incluso para determinados conjuntos gratuitos.

### Papel en AMARU

**Fuente especializada de datasets e indicadores, no necesariamente de precios básicos del MVP.**

---

# 10. Fuentes regulatorias y fundamentales

## 10.1. SEC EDGAR

Para empresas estadounidenses se utilizará SEC EDGAR como fuente oficial.

### Datos disponibles

* Presentaciones por empresa.
* Formularios 10-K.
* Formularios 10-Q.
* Formularios 8-K.
* Información XBRL.
* estados financieros.
* Form 4 de operaciones de directivos.
* historial de presentaciones.

La SEC proporciona APIs REST públicas con información de presentaciones y datos XBRL en JSON. El acceso automatizado debe respetar sus políticas de uso justo e identificar adecuadamente al cliente.

### Endpoints conceptuales

```text
GET https://data.sec.gov/submissions/CIK##########.json

GET https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json
```

### Papel en AMARU

**Fuente oficial principal de resultados y comunicaciones regulatorias de Estados Unidos.**

---

## 10.2. SMV y Bolsa de Valores de Lima

La sección peruana podrá integrar:

* Emisores.
* información financiera.
* hechos de importancia.
* valores inscritos.
* sanciones.
* memorias.
* prospectos.
* cotizaciones publicadas.
* ETF extranjeros inscritos.

La SMV dispone de un portal de información del mercado y de datos abiertos; la BVL publica información diaria y mensual. Sin embargo, no debe asumirse que todas sus páginas constituyen una API estable. Cuando no exista un endpoint documentado, la integración deberá realizarse mediante datasets descargables o capturas programadas permitidas.

La BVL registra también determinados ETF extranjeros, lo que puede servir para mostrar cuáles cuentan con inscripción o referencia local, sin asumir por ello que tengan alta liquidez en Perú.

---

# 11. Datos macroeconómicos

## 11.1. FRED

FRED se utilizará para:

* Tasas de interés.
* rendimiento de bonos.
* inflación.
* empleo.
* producción industrial.
* liquidez.
* condiciones financieras.
* indicadores de semiconductores o tecnología cuando existan.

La API FRED permite consultar series, observaciones, categorías y publicaciones en JSON o XML mediante una API key.

```text
GET https://api.stlouisfed.org/fred/series/observations
    ?series_id=DFF
    &api_key=SECRET
    &file_type=json
```

---

## 11.2. BCRPData

Para presentar resultados en soles se utilizará BCRPData.

### Aplicaciones

* Tipo de cambio USD/PEN.
* inflación peruana.
* tasas.
* actividad económica.
* mercado de capitales.
* indicadores financieros.

BCRPData ofrece consultas mediante GET y POST y puede devolver JSON, XML, CSV, TXT y otros formatos sin requerir un acceso previo al portal.

```text
GET https://estadisticas.bcrp.gob.pe/estadisticas/series/api/{SERIE}/json
```

El visor mostrará:

```text
Precio: US$ 100,00
Equivalente referencial: S/ 000,00
Tipo de cambio BCRP
Fecha de la serie
```

---

# 12. Noticias financieras vinculadas con IA

El módulo combinará:

* Changelogs tecnológicos.
* Noticias financieras.
* filings.
* presentaciones de resultados.
* anuncios de productos.
* adquisiciones.
* inversiones.
* contratos.
* regulaciones.
* interrupciones de servicios.
* restricciones comerciales.

## Relación automática

```text
Noticia tecnológica
      ↓
Empresas mencionadas
      ↓
Símbolos bursátiles
      ↓
ETF relacionados
      ↓
Movimiento de precio
      ↓
Explicación contextual
```

La aplicación deberá decir:

> El precio cambió después de esta noticia.

Pero no deberá afirmar:

> El precio cambió debido exclusivamente a esta noticia.

La causalidad financiera debe presentarse como hipótesis o correlación, salvo que exista una explicación suficientemente respaldada.

---

# 13. Empresas privadas

El portal distinguirá entre:

* Empresa cotizada.
* Empresa privada.
* subsidiaria.
* empresa adquirida.
* empresa con planes de salida a bolsa.
* empresa no verificable.

Las compañías privadas vinculadas con IA se mostrarán en una sección separada:

```text
Empresa privada
Última ronda
Inversores
Valoración reportada
Fecha
Productos
País
Estado
Fuentes
```

No se inventará un ticker ni se mezclará la valoración privada con la capitalización bursátil.

---

# 14. Activos digitales relacionados con IA

Puede añadirse posteriormente una sección independiente:

```text
/markets/digital-assets
```

No debe mezclarse con acciones o ETF.

Clasificaciones:

* Tokens vinculados con cómputo.
* Redes descentralizadas.
* almacenamiento.
* mercados de GPU.
* agentes.
* datos.
* proyectos que solo utilizan “AI” como estrategia comercial.

Cada activo deberá mostrar una advertencia reforzada sobre:

* Volatilidad.
* liquidez.
* concentración.
* auditoría.
* utilidad real.
* riesgo regulatorio.
* posible manipulación.

---

# 15. Frecuencia de actualización

| Información              |                        Frecuencia |
| ------------------------ | --------------------------------: |
| Precio retrasado         | Cada 5–15 minutos, según licencia |
| Precio de cierre         |                            Diario |
| Gráficos históricos      |              Diario o incremental |
| ETF y posiciones         |                            Diario |
| Noticias                 |                Cada 30–60 minutos |
| SEC filings              |                Cada 30–60 minutos |
| Fundamentales            |                            Diario |
| Resultados empresariales |                      Según evento |
| Opciones                 |                Cada 15–60 minutos |
| Macroeconomía            |                 Según publicación |
| Tipo de cambio BCRP      |                            Diario |
| SMV y BVL                |                            Diario |

El frontend debe mostrar siempre:

```text
Dato en tiempo real
Dato retrasado 15 minutos
Cierre del día anterior
Última actualización: fecha y hora
```

---

# 16. Arquitectura en Cloudflare

```text
Twelve Data / FMP / Finnhub
SEC / FRED / BCRP
ETF issuers / SMV / BVL
          │
          ▼
Cloudflare Scheduled Worker
          │
          ├── Normalización
          ├── Mapeo de símbolos
          ├── Control de cuotas
          ├── Detección de cambios
          └── Validación
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
      KV         D1        R2
 cotización   histórico   respuestas
   actual     y metadatos originales
```

## Distribución

### KV

* Último precio.
* variación.
* estado del mercado.
* fecha de actualización.
* tipo de cambio actual.
* resumen del panel.

### D1

* Activos.
* históricos diarios.
* empresas.
* ETF.
* fundamentales.
* noticias.
* filings.
* relaciones.
* puntuaciones.
* watchlists.

### R2

* Respuestas originales.
* filings.
* tenencias de ETF.
* CSV.
* XBRL.
* documentos.
* snapshots.

---

# 17. Tablas nuevas para D1

```text
market_assets
market_exchanges
market_quotes
market_daily_prices
market_fundamentals
market_financial_statements
market_filings
market_etfs
market_etf_holdings
market_indices
market_derivatives
market_option_contracts
market_macro_series
market_news_links
market_company_roles
market_ai_exposure_scores
market_watchlists
market_watchlist_items
market_data_sources
market_sync_jobs
market_sync_errors
```

## Tabla principal

```sql
CREATE TABLE market_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    exchange TEXT,
    country_code TEXT,
    currency TEXT,
    sector TEXT,
    industry TEXT,
    ai_value_chain TEXT,
    is_ai_related INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    source_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(symbol, exchange)
);
```

## Cotización

```sql
CREATE TABLE market_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    price REAL,
    previous_close REAL,
    change_value REAL,
    change_percent REAL,
    volume REAL,
    currency TEXT,
    market_status TEXT,
    delay_minutes INTEGER,
    quoted_at TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES market_assets(id)
);
```

## ETF y posiciones

```sql
CREATE TABLE market_etf_holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etf_asset_id INTEGER NOT NULL,
    holding_asset_id INTEGER,
    holding_symbol TEXT,
    holding_name TEXT,
    weight_percent REAL,
    shares REAL,
    market_value REAL,
    as_of_date TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    FOREIGN KEY (etf_asset_id) REFERENCES market_assets(id)
);
```

---

# 18. Estrategia API recomendada

## MVP privado y gratuito

```text
Precios y gráficos:
Twelve Data

Fundamentales:
Financial Modeling Prep

Filings:
SEC EDGAR

Macro:
FRED

Conversión a soles:
BCRPData

ETF:
Páginas y descargas oficiales del gestor

Noticias:
GDELT + fuentes financieras y corporativas

Perú:
SMV + BVL
```

## Segunda fase

```text
Finnhub:
noticias, resultados y datos alternativos

Massive:
opciones, futuros y mayor profundidad

Nasdaq Data Link:
datasets especializados
```

## No recomendado

* Utilizar Yahoo Finance mediante endpoints no documentados como dependencia productiva.
* Scrappear páginas financieras constantemente.
* mostrar precios sin indicar retraso.
* publicar cotizaciones en tiempo real sin revisar licencias.
* guardar claves en el frontend.
* consultar cada activo individualmente cuando exista un endpoint por lotes.

---

# 19. Restricciones de licenciamiento

Este punto debe resolverse antes de publicar el portal.

Los datos bursátiles tienen tres usos diferentes:

1. Uso personal.
2. Visualización pública.
3. Redistribución comercial.

Una API gratuita puede permitir pruebas personales, pero no necesariamente:

* Presentar datos públicamente.
* redistribuir cotizaciones.
* almacenar históricos indefinidamente.
* utilizar precios en un producto comercial.
* mostrar datos en tiempo real.

Por ello, cada fuente tendrá estos campos:

```text
personal_use_allowed
public_display_allowed
commercial_use_allowed
redistribution_allowed
historical_storage_allowed
attribution_required
real_time_license_required
terms_url
verified_at
```

FMP indica expresamente que la visualización o redistribución puede requerir un acuerdo de licencia específico. Nasdaq distingue entre productos gratuitos, premium, retrasados y de streaming, algunos sujetos a reglas de las bolsas.

---

# 20. Resultado esperado

La pestaña **Mercado IA** permitirá observar el sector desde tres perspectivas:

## Tecnológica

Qué productos, modelos, chips o infraestructuras desarrolla cada empresa.

## Financiera

Cómo evolucionan su cotización, resultados, ingresos, márgenes y valoración.

## Estratégica

Qué lugar ocupa dentro de la cadena mundial de inteligencia artificial.

El sistema deberá transformar una variación bursátil en una explicación contextual:

> La empresa pertenece a la capa de infraestructura de cómputo. Su precio presenta esta variación. Durante el mismo periodo se publicaron estos resultados, estos anuncios tecnológicos y estos documentos regulatorios. La relación es relevante, pero no prueba por sí sola causalidad.

## Principio rector

> **Mostrar el mercado de IA como un ecosistema económico y tecnológico, no como una lista de acciones para comprar.**
