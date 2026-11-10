# AMARU en línea — producción, administración e IA gratuita

Actualizado: 2026-11-10.

## Dónde está

| Dirección | Uso |
| --- | --- |
| https://amaru.andesnova.solutions | Dirección principal |
| https://ia.amauta.online | Dominio adicional (mismo Worker) |

- **Plataforma:** Cloudflare Workers. Se eligió Cloudflare y no Vercel porque el backend ya es un Worker con D1, KV, Queues y Workers AI: no hay que reescribir nada y la IA gratuita corre en el mismo lugar.
- **Worker:** `amaru-ai-observatory-production`, entorno `production` de `wrangler.jsonc`. Los dos dominios están declarados como `custom_domain` en ese entorno.
- **Recursos:**
  - D1 `amaru-observatory`, con las migraciones aplicadas hasta `0012`;
  - KV `CACHE`;
  - cola `amaru-index-jobs`;
  - binding `AI`;
  - cron cada 30 minutos.

## Seguridad de las llaves

- **Nunca hay llaves en GitHub.** `.dev.vars` y `.env.local` están en `.gitignore`. El repositorio y su historial se revisaron en busca de patrones de llaves (`sk-`, `AIza`, `ghp_`, `nvapi-`…) y salió limpio.
- **Secretos del Worker** (se crearon con `wrangler secret put`, nunca en archivos):
  - `DEVELOPER_LAB_ENCRYPTION_KEY`: aleatoria. Con ella se cifran (AES-GCM) las llaves que subes desde Administración.
  - `ADMIN_SESSION_SECRET`: aleatoria. Firma la cookie de sesión.
  - `ADMIN_PASSWORD`: **la pones tú** (ver abajo).
- **Las llaves de mercado, noticias e IA** se suben desde **Administración → Claves y fuentes** y desde el **Laboratorio de APIs**:
  - quedan cifradas en D1;
  - nunca se devuelven al navegador.

## Acceso de administrador

- **Usuario:** `oprbguitar`. Es la variable `ADMIN_USER` de `wrangler.jsonc`; no es secreta.
- **Clave:** secreto `ADMIN_PASSWORD`. Mientras no exista, el inicio de sesión queda cerrado, es decir, falla de forma segura.

Para crearla o cambiarla, ejecuta esto en la carpeta del proyecto y escribe la clave cuando te la pida:

```bash
npx wrangler secret put ADMIN_PASSWORD --env production
```

Cómo funciona la sesión:
- es una cookie `HttpOnly; Secure; SameSite=Strict` firmada con HMAC y dura 8 horas;
- 5 intentos fallidos bloquean el acceso por 15 minutos;
- en desarrollo local (`APP_ENV=development`) no hay login: quien usa la PC es el administrador.

Qué exige sesión de administrador en producción (`worker/admin.ts` → `needsAdmin`):
- `/api/admin/*`, salvo login y sesión;
- `/api/developer-lab/*`, porque usa tus llaves de pago;
- `/api/integrations*`;
- `/api/local-models/*`;
- todo `POST`, `PUT`, `PATCH` o `DELETE`: sincronizar, guardar, borrar.

La lectura del observatorio es pública. En `GET /api/github/mine`, los repositorios privados solo se listan al administrador.

## IA gratuita para visitantes

- **Modelo:** Cloudflare Workers AI con modelos abiertos pequeños. Por defecto es Llama 3.2 3B, dentro de la asignación diaria gratuita de Cloudflare. No usa ninguna llave de pago.
- **Límites:** por defecto, **3 consultas por visitante al día** y **150 al día para todo el sitio**. El administrador no tiene límite.
- **Dónde se ajusta:** en Administración → IA gratuita. Puedes activarla o desactivarla, y cambiar el límite por visitante (0–20), el tope diario del sitio, el modelo y el máximo de tokens.
- **Cómo cuenta las consultas:** el visitante se identifica con un resumen salado de su IP; la IP nunca se guarda. El contador está en KV con caducidad de 36 h.
- **Endpoints:**
  - `GET /api/public-ai/status`;
  - `POST /api/public-ai/chat` (exige la cabecera `x-amaru-csrf`);
  - `GET`/`PUT /api/admin/public-ai`.

## Módulos nuevos

- **Tema pastel (predeterminado):**
  - Manrope para el texto y Fredoka para los titulares, con superficies crema, tinta ciruela y acento coral;
  - los otros 4 temas siguen en el menú «Visualización».
- **Prompts y agentes** (`/prompts`):
  - cadenas paso a paso: video en 9 capas, imagen, informe por partes, mapa mental, relación jurídica, árbol de pensamientos, escalera de preguntas, software por especificación, web en 9 puntos e investigación;
  - un generador sin IA;
  - sistemas agénticos por fases, con el modelo sugerido por etapa;
  - técnicas, histórico personal por categorías y el resumen del curso PIT 2026;
  - descarga en `.md` en la carpeta que elijas.
- **Guía y Documentación**, abajo en el menú:
  - la guía muestra una tarjeta por sección y la recorre con «Anterior / Siguiente»;
  - los dos botones brillan suavemente hasta el primer uso.
- **Aviso de privacidad** (Ley N.° 29733):
  - es discreto; como no hay cookies de seguimiento, no hay nada que aceptar;
  - los detalles quedan en «Privacidad», en el menú.
- **Descargas:** «Open y local» sigue permitiendo elegir la carpeta destino, igual que la descarga de prompts.

## Volver a desplegar

```bash
CLOUDFLARE_ENV=production pnpm build
```

```bash
npx wrangler deploy --config dist/amaru_ai_observatory/wrangler.json
```

Si hay migraciones nuevas, aplícalas antes con:

```bash
npx wrangler d1 migrations apply DB --remote --env production
```

## Fuente del contenido del curso

- Se leyó `PIT_2026_SOLO_TEXTO.md` (≈10 mil tokens), que contiene el texto de los 7 PDF; los PDF son diapositivas cuyo texto ya está en ese archivo.
- Se integró solo lo que complementa a AMARU, en `src/features/prompts/course.ts`:
  - sesiones;
  - ecosistemas;
  - parámetros;
  - gobernanza;
  - ejercicios de comparación.
- Las técnicas están en `catalog.ts`.
- La carpeta del escritorio ya puede borrarse.
