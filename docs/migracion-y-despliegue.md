# Dónde migrar AMARU AI Observatory

Fecha: 2026-11-09. Guía de decisión; el paso a paso técnico de Cloudflare sigue en [cloudflare-deployment.md](cloudflare-deployment.md).

## Resumen corto

| Opción | Qué funciona | Qué no funciona | Costo aprox. | Recomendación |
| --- | --- | --- | --- | --- |
| **A. Local (actual)** — `Iniciar-Servidor-Local.cmd` | Todo: fuentes, laboratorio, descargas a carpeta, Ollama/LM Studio, apagado del servidor | Solo accesible desde tu PC | 0 | Uso diario |
| **B. Local + Cloudflare Tunnel** — `Iniciar-Observatorio-Web.cmd` | Todo lo de A, accesible desde el celular u otra PC con usuario/contraseña temporal | Se apaga al cerrar la ventana; URL cambia cada vez | 0 | Mostrar o usar fuera de casa |
| **C. Cloudflare Workers (nube)** | Observatorio, noticias, investigación, mercado, GitHub, catálogos, laboratorio de APIs en la nube, descargas a carpeta (el navegador descarga directo de Hugging Face) | Servidores locales (Ollama/LM Studio) desde el worker, apagado del servidor (no existe en la nube), carpeta `local-research` | Workers Paid USD 5/mes (por Queues) + uso | Versión pública/persistente |
| **D. Otra plataforma (Vercel, Netlify, Render, VPS)** | Solo el frontend sin reescritura | El backend es un Worker con D1/KV/R2/Queues: habría que reescribirlo | Variable | No recomendado |

**Recomendación:** quédate en **A** para trabajar y usa **B** cuando necesites acceso remoto. Cuando quieras una URL permanente, migra a **C** (Cloudflare), que es nativo para este código: no requiere reescribir nada.

## Opción C — Cloudflare en 8 pasos

1. Cuenta Cloudflare con **Workers Paid** (la cola `INDEX_QUEUE` lo exige).
2. `pnpm wrangler login` y `pnpm wrangler whoami`.
3. Crear recursos: `wrangler d1 create amaru-observatory`, `wrangler kv namespace create CACHE`, `wrangler queues create amaru-index-jobs` (R2 opcional).
4. Copiar los IDs devueltos a `wrangler.jsonc` (hoy tienen ceros de relleno).
5. `pnpm db:migrate:remote`.
6. Secretos: `wrangler secret put DEVELOPER_LAB_ENCRYPTION_KEY` (obligatorio) y las claves que uses. Alternativa: guardarlas luego desde **Integraciones** (quedan cifradas en D1).
7. `pnpm build` y `pnpm wrangler deploy`.
8. **Proteger el acceso**: tus configuraciones y claves son personales. Activa **Cloudflare Access** (Zero Trust, gratis hasta 50 usuarios) sobre el dominio `*.workers.dev` o tu dominio, con login por tu correo. Sin esto, cualquiera con la URL podría usar tus claves.

## Configuraciones personales

- Las claves de API se guardan cifradas (AES-GCM) en D1 con la llave `DEVELOPER_LAB_ENCRYPTION_KEY`. Si cambias la llave, las claves guardadas dejan de poder leerse: vuelve a ingresarlas.
- Preferencias de interfaz (tema, menú plegado, intereses de GitHub, perfil de hardware) viven en el navegador (`localStorage`/IndexedDB): no viajan entre equipos.
- La biblioteca de modelos descargados vive en la carpeta que elijas en tu disco; AMARU solo guarda el inventario en el navegador.

## Qué cambia al pasar a la nube

- El botón **Apagar servidor** se oculta automáticamente (solo existe en el servidor de desarrollo local).
- Las pruebas con Ollama/LM Studio siguen funcionando solo si abres AMARU en la misma PC donde corren y el navegador puede llegar a `127.0.0.1` (el worker en la nube no puede).
- La sincronización programada (`cron`) pasa a ejecutarse en Cloudflare según `wrangler.jsonc`.
