import { Lightbulb, Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
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

/**
 * The learning layer as a small note in the top bar: hovering or focusing it
 * (CSS) reveals what the section is and how to read it, a tap pins it open on
 * touch screens; moving away hides it. It takes no room from the page. On a visitor's
 * first visit to a section the note bounces to invite a look.
 */
export function SectionHint({ pathname }: { pathname: string }) {
  const { language } = useLanguage();
  const intro = introFor(pathname, language);
  const key = `/${pathname.split("/")[1] ?? ""}`;
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    const seen = readSeen();
    const firstVisit = !seen.includes(key);
    setFresh(firstVisit);
    if (firstVisit) writeStorage(SEEN_KEY, JSON.stringify([...seen, key]));
  }, [key]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (!intro) return null;
  const en = language === "en";

  function show() {
    setOpen(true);
    setFresh(false);
  }

  return (
    <div className="section-hint" ref={rootRef}>
      <button
        type="button"
        className="section-hint-trigger"
        data-fresh={fresh ? "true" : undefined}
        aria-expanded={open}
        aria-controls={popoverId}
        onMouseEnter={() => setFresh(false)}
        onFocus={() => setFresh(false)}
        onClick={() => (open ? setOpen(false) : show())}
      >
        <Sparkles aria-hidden="true" />
        <span>{en ? "What is this?" : "¿Qué es esto?"}</span>
      </button>
      <div
        id={popoverId}
        role="tooltip"
        className="section-hint-pop"
        data-open={open ? "true" : undefined}
      >
        <p className="section-hint-what">{intro.what}</p>
        <ol>
          {intro.tips.map((tip, index) => (
            <li key={tip} style={{ "--i": index } as React.CSSProperties}>
              {tip}
            </li>
          ))}
        </ol>
        {intro.concept ? (
          <p className="section-hint-concept">
            <Lightbulb aria-hidden="true" />
            <span>
              <strong>{intro.concept.term}:</strong> {intro.concept.meaning}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
