import { Lightbulb, MousePointerClick } from "lucide-react";
import type React from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageProvider";
import { introFor } from "./sectionIntros";

/**
 * What a side panel shows before anything is selected: instead of an empty
 * "select something" box, a short lesson about the section so the space
 * teaches while it waits.
 */
export function ContextEmpty({ hint }: { hint?: string }) {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const intro = introFor(pathname, language);
  const en = language === "en";
  return (
    <aside className="context-panel scroll-region context-empty">
      <div className="context-empty-cta">
        <span className="context-empty-icon" aria-hidden="true">
          <MousePointerClick />
        </span>
        <strong>
          {hint ??
            (en
              ? "Pick an item to see its sheet here"
              : "Elige un elemento para ver su ficha aquí")}
        </strong>
      </div>
      {intro ? (
        <>
          <p className="context-empty-what">{intro.what}</p>
          <ol className="context-empty-tips">
            {intro.tips.map((tip, index) => (
              <li key={tip} style={{ "--i": index } as React.CSSProperties}>
                {tip}
              </li>
            ))}
          </ol>
          {intro.concept ? (
            <p className="context-empty-concept">
              <Lightbulb aria-hidden="true" />
              <span>
                <strong>{intro.concept.term}</strong>
                {intro.concept.meaning}
              </span>
            </p>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
