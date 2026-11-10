import { Check, Copy, Cpu, ExternalLink, PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { LOCAL_MODELS } from "../prompts/tools";

const REQUIREMENTS = [
  {
    size: "1–4 B",
    example: "Llama 3.2 3B, Gemma 3 4B",
    ram: "8 GB",
    gpu: "No necesita",
    disk: "2–3 GB",
  },
  {
    size: "7–8 B",
    example: "Qwen3 8B, Mistral 7B",
    ram: "16 GB",
    gpu: "Opcional · 6–8 GB VRAM",
    disk: "4–6 GB",
  },
  {
    size: "12–14 B",
    example: "Gemma 3 12B, Qwen3 14B",
    ram: "32 GB",
    gpu: "Recomendada · 12 GB VRAM",
    disk: "8–10 GB",
  },
  {
    size: "27–32 B",
    example: "Gemma 3 27B, Qwen3 32B",
    ram: "64 GB",
    gpu: "24 GB VRAM",
    disk: "16–20 GB",
  },
] as const;

const VIDEO_SEARCHES = [
  {
    label: "Instalar Ollama en Windows",
    q: "instalar ollama windows tutorial español",
  },
  {
    label: "Primeros pasos con LM Studio",
    q: "lm studio tutorial español modelos locales",
  },
  {
    label: "Ollama + Open WebUI (interfaz tipo chat)",
    q: "ollama open webui tutorial español",
  },
] as const;

/**
 * Quick, honest guide to run a model on your own PC: hardware by model size,
 * three install paths and tutorial searches. Linked from «Prompts y agentes».
 */
export function LocalRunGuide() {
  const [copied, setCopied] = useState<string | null>(null);
  const location = useLocation();
  const ref = useRef<HTMLDetailsElement>(null);
  // Links from «Prompts y agentes» land on /open-local#guia-local.
  useEffect(() => {
    if (location.hash === "#guia-local")
      ref.current?.scrollIntoView({ block: "start" });
  }, [location.hash]);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }
  return (
    <details className="lr-guide" id="guia-local" open ref={ref}>
      <summary>
        <Cpu aria-hidden="true" /> Guía rápida: correr un modelo en tu PC
      </summary>

      <div className="lr-grid">
        <section aria-labelledby="lr-req">
          <h3 id="lr-req">1 · ¿Lo soporta tu equipo?</h3>
          <div className="lr-table-wrap">
            <table className="lr-table">
              <thead>
                <tr>
                  <th scope="col">Tamaño</th>
                  <th scope="col">RAM</th>
                  <th scope="col">Tarjeta gráfica</th>
                  <th scope="col">Disco</th>
                </tr>
              </thead>
              <tbody>
                {REQUIREMENTS.map((row) => (
                  <tr key={row.size}>
                    <th scope="row">
                      {row.size}
                      <small>{row.example}</small>
                    </th>
                    <td>{row.ram}</td>
                    <td>{row.gpu}</td>
                    <td>{row.disk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lr-note">
            Valores orientativos para cuantización Q4 (la más usada). Windows
            10/11, macOS con chip Apple (M1 o superior) o Linux. Más RAM o VRAM
            = respuestas más rápidas.
          </p>
        </section>

        <section aria-labelledby="lr-install">
          <h3 id="lr-install">2 · Instala una de estas apps</h3>
          <ol className="lr-steps">
            <li>
              <strong>Ollama</strong> (recomendado, liviano):{" "}
              <a
                href="https://ollama.com/download"
                target="_blank"
                rel="noreferrer"
              >
                descargar <ExternalLink aria-hidden="true" />
              </a>
              . Instálalo y abre una terminal (PowerShell en Windows).
            </li>
            <li>
              <strong>LM Studio</strong> (con interfaz, sin terminal):{" "}
              <a href="https://lmstudio.ai" target="_blank" rel="noreferrer">
                descargar <ExternalLink aria-hidden="true" />
              </a>
              . Busca el modelo, elige la versión Q4_K_M y pulsa «Download».
            </li>
            <li>
              <strong>Jan</strong> (código abierto):{" "}
              <a href="https://jan.ai" target="_blank" rel="noreferrer">
                descargar <ExternalLink aria-hidden="true" />
              </a>
              .
            </li>
          </ol>
          <p className="lr-note">
            ¿Descargaste un GGUF con el gestor de abajo? En LM Studio apunta a
            esa carpeta; en Ollama crea un archivo <code>Modelfile</code> con{" "}
            <code>FROM ./modelo.gguf</code> y ejecuta{" "}
            <code>ollama create mi-modelo -f Modelfile</code>.
          </p>
        </section>

        <section aria-labelledby="lr-run">
          <h3 id="lr-run">3 · Ejecuta un modelo</h3>
          <ul className="lr-models">
            {Object.values(LOCAL_MODELS).map((model) => {
              const command = `ollama run ${model.ollama}`;
              return (
                <li key={model.ollama}>
                  <div>
                    <strong>{model.name}</strong>
                    <small>
                      {model.use} · {model.size} · {model.ram}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="lr-copy"
                    onClick={() => copy(command)}
                    aria-label={`Copiar ${command}`}
                  >
                    <code>{command}</code>
                    {copied === command ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="lr-note">
            La primera vez descarga el modelo; luego responde sin internet.
            Escribe tu pregunta y usa <code>/bye</code> para salir.
          </p>
        </section>

        <section aria-labelledby="lr-videos">
          <h3 id="lr-videos">4 · Míralo en video</h3>
          <ul className="lr-videos">
            {VIDEO_SEARCHES.map((video) => (
              <li key={video.q}>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.q)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <PlayCircle aria-hidden="true" /> {video.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="lr-note">
            Abre búsquedas en YouTube con tutoriales recientes en español.
          </p>
        </section>
      </div>
    </details>
  );
}
