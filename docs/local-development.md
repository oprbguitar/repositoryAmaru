# Local development

Use Node 24 and pnpm. Local Cloudflare state is persisted in `.wrangler/state`; ordinary commands never connect to remote bindings.

```powershell
corepack enable
pnpm install
Copy-Item .dev.vars.example .dev.vars -Force
Copy-Item .env.local.example .env.local -Force
pnpm db:migrate:local
pnpm db:seed:local
pnpm ingest:local
pnpm dev
```

The Vite server listens at `http://127.0.0.1:5174`. API health is available at `/api/status`. Pressing `e` in a Wrangler development session opens Cloudflare Local Explorer when supported by the installed Wrangler version.

Remote work requires an explicit command and prepared resources. `pnpm dev` and all database commands shown above are local.

## Iniciar y apagar con doble clic (Windows)

En la raíz del repositorio hay dos accesos directos:

| Archivo | Qué hace |
| --- | --- |
| `Iniciar-Servidor-Local.cmd` | Verifica Node y pnpm (usa `corepack pnpm` si `pnpm` no está en el PATH), instala dependencias si falta `node_modules`, aplica `pnpm db:migrate:local`, arranca `pnpm dev` y abre `http://127.0.0.1:5174` cuando el servidor responde. Si ya estaba en marcha, solo abre el navegador. |
| `Apagar-Servidor.cmd` | Envía `POST /__amaru/shutdown` para un apagado limpio. Si no responde, muestra el proceso que escucha en el puerto 5174 y pregunta antes de terminarlo. |
| `Iniciar-Observatorio-Web.cmd` | (Sin cambios) servidor + proxy con usuario y contraseña para compartir por enlace. |

La lógica vive en `scripts/start-local-server.ps1` y `scripts/stop-local-server.ps1`.

### Apagar desde la interfaz

Menú **Visualización → Sistema → Apagar servidor** (pide confirmación). Al apagar se muestra la pantalla "Servidor apagado" con la indicación de volver a usar `Iniciar-Servidor-Local.cmd`.

El botón solo aparece cuando `GET /__amaru/health` responde `{ ok, pid, startedAt }`, es decir, con el servidor de Vite local. Esos endpoints los registra el plugin `amaruDevControl` (`scripts/dev-server-control.ts`, cargado en `vite.config.ts` antes de `cloudflare()`). No existen en Cloudflare desplegado.

`/__amaru/shutdown` exige a la vez: método POST, conexión desde loopback (`127.0.0.1`/`::1`), cabecera `x-amaru-csrf: local-ui`, `Origin` local si el navegador la envía y ninguna cabecera de proxy (`x-forwarded-for`, `forwarded`, `x-amaru-via-share`). El proxy de compartir (`scripts/web-share-proxy.mjs`) responde 404 a cualquier ruta `/__amaru/*` y marca cada petición reenviada con `x-amaru-via-share`, así que nadie puede apagar el servidor desde el enlace compartido (y allí el botón no se muestra). Tests: `tests/dev-server-control.test.ts`.

## Navegación y visualización

- `Ctrl+B` contrae o expande el menú lateral (en móvil abre o cierra el cajón). La elección se guarda en `localStorage` (`amaru-nav`).
- `Ctrl+K` o `/` enfocan la búsqueda general (secciones del observatorio + búsqueda en la biblioteca local).
- Temas: Oscuro, Claro, Alto contraste claro (negro sobre blanco) y Alto contraste oscuro (blanco sobre negro), en `amaru-theme`. `public/theme-boot.js` aplica el tema antes del primer pintado.
