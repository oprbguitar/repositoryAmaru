import { ChevronDown, Lightbulb, Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useId, useState } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { introFor } from "./sectionIntros";
import { readStorage, writeStorage } from "./theme";

const SEEN_KEY = "amaru-intro-seen-v1";

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(readStorage(SEEN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sectionKey(pathname: string) {
  return `/${pathname.split("/")[1] ?? ""}`;
}

/**
 * The learning layer: a one-line "what is this?" for every section. It opens
 * by itself the first time a visitor enters a section, then stays folded to a
 * single line they can expand whenever they want the tips again.
 */
export function SectionIntroBar({ pathname }: { pathname: string }) {
  const { language } = useLanguage();
  const intro = introFor(pathname, language);
  const key = sectionKey(pathname);
  const detailsId = useId();
  const [open, setOpen] = useState(() => !readSeen().includes(key));

  useEffect(() => {
    const seen = readSeen();
    const firstVisit = !seen.includes(key);
    setOpen(firstVisit);
    if (firstVisit) writeStorage(SEEN_KEY, JSON.stringify([...seen, key]));
  }, [key]);

  if (!intro) return null;
  const en = language === "en";

  return (
    <section
      className="intro-bar"
      data-open={open ? "true" : undefined}
      aria-label={en ? "About this section" : "Sobre esta sección"}
    >
      <button
        type="button"
        className="intro-bar-head"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="intro-bar-icon" aria-hidden="true">
          <Sparkles />
        </span>
        <span className="intro-bar-what">{intro.what}</span>
        <span className="intro-bar-toggle">
          {open
            ? en
              ? "Hide"
              : "Ocultar"
            : en
              ? "How to read it"
              : "Cómo leerlo"}
          <ChevronDown aria-hidden="true" />
        </span>
      </button>
      <div className="intro-bar-body" id={detailsId} hidden={!open}>
        <ol className="intro-bar-tips">
          {intro.tips.map((tip, index) => (
            <li key={tip} style={{ "--i": index } as React.CSSProperties}>
              <span aria-hidden="true">{index + 1}</span>
              {tip}
            </li>
          ))}
        </ol>
        {intro.concept ? (
          <p className="intro-bar-concept">
            <Lightbulb aria-hidden="true" />
            <span>
              <strong>{intro.concept.term}:</strong> {intro.concept.meaning}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
