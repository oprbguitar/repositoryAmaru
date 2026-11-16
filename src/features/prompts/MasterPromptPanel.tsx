import { Check, Copy, ExternalLink, Eye, Leaf, ScrollText } from "lucide-react";
import { useState } from "react";
import { fillTemplate } from "./catalog";
import { MASTER_PROMPTS, TOKEN_SAVERS } from "./masters";

/** Where visitors usually take a copied prompt. Plain links, no tracking. */
const FAVORITE_AIS = [
  { label: "ChatGPT", url: "https://chatgpt.com/" },
  { label: "Claude", url: "https://claude.ai/new" },
  { label: "Gemini", url: "https://gemini.google.com/app" },
  { label: "Copilot", url: "https://copilot.microsoft.com/" },
] as const;

export function TokenSaverTag({ id }: { id: string }) {
  const saver = TOKEN_SAVERS.find((item) => item.id === id);
  if (!saver) return null;
  return (
    <span className="pr-token-tag" title={`${saver.what} ${saver.how}`}>
      <Leaf aria-hidden="true" />
      Ahorra tokens · {saver.name}
    </span>
  );
}

/**
 * The long «all-in-one» prompt for a chain, with a simulated result beside it
 * so the visitor knows what to expect before pasting it into their AI.
 */
export function MasterPromptPanel({
  chainId,
  values,
}: {
  chainId: string;
  values: Record<string, string>;
}) {
  const master = MASTER_PROMPTS[chainId];
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"prompt" | "example">("prompt");
  if (!master) return null;
  const text = fillTemplate(master.prompt, values);
  const lines = text.split("\n").length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="pr-master" aria-label="Prompt maestro">
      <header className="pr-master-head">
        <div>
          <span className="pr-master-kicker">
            <ScrollText aria-hidden="true" /> Prompt maestro · todo en uno
          </span>
          <p>
            Versión extensa con rol, contexto, tareas, formato de salida y
            autoverificación ({lines} líneas). Cópiala y pégala en tu IA
            favorita.
          </p>
        </div>
        <div className="pr-master-switch" role="tablist" aria-label="Vista">
          <button
            type="button"
            role="tab"
            aria-selected={view === "prompt"}
            onClick={() => setView("prompt")}
          >
            <ScrollText aria-hidden="true" /> Prompt
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "example"}
            onClick={() => setView("example")}
          >
            <Eye aria-hidden="true" /> Resultado
          </button>
        </div>
      </header>

      <div className="pr-master-grid" data-view={view}>
        <div className="pr-master-col pr-master-prompt">
          <span className="pr-master-label">Prompt (texto para copiar)</span>
          <pre>{text}</pre>
        </div>
        <div className="pr-master-col pr-master-example">
          <span className="pr-master-label">
            Así podría verse el resultado · ejemplo simulado
          </span>
          <pre>{master.example}</pre>
        </div>
      </div>

      <div className="pr-master-savers">
        {master.savers.map((id) => (
          <TokenSaverTag key={id} id={id} />
        ))}
        <p>{master.tip}</p>
      </div>

      <div className="pr-master-actions">
        <button
          type="button"
          className="pr-button pr-button-primary"
          onClick={copy}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copiado" : "Copiar prompt maestro"}
        </button>
        <span className="pr-master-go">Llévalo a:</span>
        {FAVORITE_AIS.map((ai) => (
          <a
            key={ai.label}
            className="pr-button pr-button-ghost"
            href={ai.url}
            target="_blank"
            rel="noreferrer"
            onClick={copy}
          >
            {ai.label} <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
