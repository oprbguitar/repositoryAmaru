import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Compass,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { guideFor, SECTION_GUIDES } from "./guides";
import { PRIVACY_EVENT } from "./PrivacyNotice";
import { readStorage, writeStorage } from "./theme";

const GUIDE_SEEN = "amaru-guide-seen";
const DOCS_SEEN = "amaru-docs-seen";

/**
 * Sidebar footer: «Guía» (one explanatory card per section, following the
 * route) and «Documentación» (every section at a glance). Both glow softly
 * until used once; nothing ever blinks.
 */
export function GuideControls({ compact }: { compact: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [guideSeen, setGuideSeen] = useState(
    () => readStorage(GUIDE_SEEN) === "1",
  );
  const [docsSeen, setDocsSeen] = useState(
    () => readStorage(DOCS_SEEN) === "1",
  );
  const guide = guideFor(location.pathname);
  const index = guide ? SECTION_GUIDES.indexOf(guide) : -1;

  function toggleGuide() {
    setActive((value) => !value);
    if (!guideSeen) {
      setGuideSeen(true);
      writeStorage(GUIDE_SEEN, "1");
    }
  }
  function openDocs() {
    setDocsOpen(true);
    if (!docsSeen) {
      setDocsSeen(true);
      writeStorage(DOCS_SEEN, "1");
    }
  }
  function go(step: number) {
    const next =
      SECTION_GUIDES[(step + SECTION_GUIDES.length) % SECTION_GUIDES.length];
    if (next) navigate(next.path);
  }

  return (
    <>
      <div
        className="guide-controls"
        data-compact={compact ? "true" : undefined}
      >
        <button
          type="button"
          className="guide-toggle"
          aria-pressed={active}
          data-glow={!guideSeen ? "true" : undefined}
          onClick={toggleGuide}
          title="Guía por secciones"
        >
          <Compass aria-hidden="true" />
          <span className="nav-label">{active ? "Guía activa" : "Guía"}</span>
        </button>
        <button
          type="button"
          className="guide-toggle"
          data-glow={!docsSeen ? "true" : undefined}
          onClick={openDocs}
          title="Documentación"
        >
          <BookOpenText aria-hidden="true" />
          <span className="nav-label">Documentación</span>
        </button>
        <button
          type="button"
          className="guide-toggle"
          onClick={() => window.dispatchEvent(new Event(PRIVACY_EVENT))}
          title="Privacidad y datos personales"
        >
          <ShieldCheck aria-hidden="true" />
          <span className="nav-label">Privacidad</span>
        </button>
      </div>

      {active ? (
        <section
          className="guide-card"
          aria-live="polite"
          aria-label="Guía de la sección"
        >
          <header>
            <span className="guide-step">
              {index >= 0 ? `${index + 1} / ${SECTION_GUIDES.length}` : "Guía"}
            </span>
            <button
              type="button"
              className="guide-close"
              aria-label="Desactivar guía"
              onClick={() => setActive(false)}
            >
              <X aria-hidden="true" />
            </button>
          </header>
          {guide ? (
            <>
              <h2>{guide.title}</h2>
              <p>{guide.purpose}</p>
              <ol>
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          ) : (
            <p>
              Esta vista no tiene guía. Usa «Siguiente» para recorrer las
              secciones.
            </p>
          )}
          <footer>
            <button type="button" onClick={() => go(index - 1)}>
              <ChevronLeft aria-hidden="true" /> Anterior
            </button>
            <button
              type="button"
              className="guide-next"
              onClick={() => go(index + 1)}
            >
              Siguiente <ChevronRight aria-hidden="true" />
            </button>
          </footer>
        </section>
      ) : null}

      {docsOpen ? <DocsDialog onClose={() => setDocsOpen(false)} /> : null}
    </>
  );
}

function DocsDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const titleId = useId();
  const [query, setQuery] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SECTION_GUIDES.filter(
      (guide) =>
        !needle ||
        `${guide.title} ${guide.purpose} ${guide.steps.join(" ")}`
          .toLowerCase()
          .includes(needle),
    );
  }, [query]);
  return (
    <dialog
      ref={ref}
      className="docs-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
    >
      <header>
        <h2 id={titleId}>Documentación</h2>
        <button
          type="button"
          className="guide-close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <p className="docs-intro">
        AMARU es un observatorio de inteligencia artificial: reúne modelos,
        precios, noticias, investigación y herramientas para crear con IA. Los
        datos vienen de fuentes públicas; cuando una fuente no está configurada
        se indica en lugar de inventar cifras.
      </p>
      <label className="docs-search">
        <Search aria-hidden="true" />
        <span className="pr-visually-hidden">Buscar en la documentación</span>
        <input
          type="search"
          value={query}
          placeholder="Buscar sección…"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="docs-list">
        {shown.map((guide) => (
          <li key={guide.path}>
            <button
              type="button"
              onClick={() => {
                navigate(guide.path);
                onClose();
              }}
            >
              <strong>{guide.title}</strong>
              <span>{guide.purpose}</span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
