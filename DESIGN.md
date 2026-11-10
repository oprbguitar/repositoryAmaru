# AMARU AI Observatory — DESIGN.md

Dirección visual vigente desde 2026-11-09 (rediseño "observatorio de modelos"). Desde 2026-11-10 el tema por defecto es **pastel** (pedido del usuario: vista amigable y divertida para todo público); la estructura no cambia.

## Dirección (6 líneas)
1. **Dominio:** observatorio técnico personal de IA — mucha tabla, rankings, fichas y series. Densidad media-alta.
2. **Arquetipo:** *canvas + inspector*: lienzo central (lista, timeline, mapa, gráfico) y panel lateral contextual que explica lo seleccionado.
3. **Tipografía:** `Public Sans` (UI y titulares) + `IBM Plex Mono` (cifras, ids, versiones, tamaños). Autohospedadas vía @fontsource.
4. **Paleta:** identidad heredada del logo — navy profundo, cian (`--accent`) para acción/selección, verde (`--accent-2`) para "local / abierto / ejecutable". Estados (`--ok --warn --danger --info`) nunca decorativos.
5. **Geometría:** radios 4–10px (`--radius-sm/md/lg`), bordes de 1px hacen el trabajo, sombras solo en capas flotantes.
6. **Motion:** entrada escalonada de 40ms (`--stagger`) en listas al cargar datos; hover con desplazamiento ≤2px; todo anulado con `prefers-reduced-motion`.

> `design-pick` propuso "tinta + ámbar". Se conserva la tipografía, la geometría y el motion propuestos, pero la paleta se deriva del logo
> entregado por el usuario (identidad existente manda, regla 3 del harness).

## Tokens (fuente única: `src/app/styles/global.css` `:root`)
- Superficies: `--bg --bg-deep --surface --surface-2 --surface-3 --surface-hover`
- Bordes: `--line --line-soft --line-strong`
- Texto: `--text --text-muted --text-subtle`
- Acentos: `--accent --accent-strong --accent-quiet --accent-2 --accent-2-quiet`
- Estado: `--ok --warn --danger --info --purple`
- Espacio: `--space-1..7` (4·8·12·16·24·32·48)
- Radio: `--radius-sm 4 / --radius-md 6 / --radius-lg 10 / --radius-pill`
- Tipo: `--text-xs 11 · sm 12 · md 13 · lg 15 · xl 18 · 2xl 22`; `--font-sans --font-mono`
- Control: `--control-sm 28 / md 32 / lg 36`
- Motion: `--ease-out --dur-fast 120ms --dur-med 220ms --stagger 40ms`

Temas: `pastel` (defecto desde 2026-11-10: Manrope + Fredoka vía `--font-display`, crema/ciruela/coral, tokens `--bubble-1..6` para categorías y `--nav-bubble-1..6` para íconos del menú), `dark`, `light`, `contrast-light` (negro sobre blanco), `contrast-dark` (blanco sobre negro). Todos redefinen **solo tokens**.

## Reglas para módulos
- Cada módulo nuevo o rediseñado tiene su CSS propio junto al componente (`src/features/<x>/<x>.css`) importado desde la página, con clases prefijadas por módulo. `global.css` solo contiene tokens y shell.
- Nada de valores mágicos: colores, radios, espacios y tamaños de texto salen de los tokens.
- Prohibido: degradados morado→azul, blobs, glassmorphism, cards anidadas, radios ≥ 16px en contenedores, pills decorativas, métricas inventadas.
- Estados obligatorios: hover, active, `:focus-visible`, disabled, loading, selected, vacío y "no configurado".
- Responsive verificado a 360 / 768 / 1280 / 1600 px.
- Copy en español de Perú; nunca inventar datos: sin fuente → estado explícito "sin datos / no configurado".
