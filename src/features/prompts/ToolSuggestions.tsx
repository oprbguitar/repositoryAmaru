import { ExternalLink, HardDrive, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import type { CategoryId } from "./catalog";
import { suggestionsFor } from "./tools";

/**
 * Compact «dónde usarlo» strip: online tools with direct links and small
 * local models that open the «Open y local» guide. Collapsible so it never
 * gets in the way of the prompts themselves.
 */
export function ToolSuggestions({ category }: { category: CategoryId }) {
  const { tip, online, local } = suggestionsFor(category);
  return (
    <details className="pr-tools" open>
      <summary>
        <Lightbulb aria-hidden="true" /> ¿Dónde usar estos prompts?
      </summary>
      <p className="pr-tools-tip">{tip}</p>
      <ul className="pr-tools-list" aria-label="Herramientas en línea">
        {online.map((tool) => (
          <li key={tool.id}>
            <a
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              title={tool.note}
            >
              {tool.name}
              <ExternalLink aria-hidden="true" />
            </a>
            <small>
              {tool.note}
              {tool.free ? " · plan gratuito" : ""}
            </small>
          </li>
        ))}
      </ul>
      <div className="pr-tools-local">
        <span>
          <HardDrive aria-hidden="true" /> En tu PC, sin internet:
        </span>
        {local.map((model) => (
          <a
            key={model.ollama}
            href={`https://ollama.com/library/${model.ollama}`}
            target="_blank"
            rel="noreferrer"
            title={`${model.use} · ${model.size} · ${model.ram}`}
          >
            {model.name} <small>({model.ram})</small>
          </a>
        ))}
        <Link to="/open-local#guia-local">Cómo instalarlo →</Link>
      </div>
      <small className="pr-tools-foot">
        Sugerencias curadas al 10/11/2026; revisa precios y condiciones en cada
        sitio.
      </small>
    </details>
  );
}
