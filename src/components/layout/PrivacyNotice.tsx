import { ShieldCheck, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { readStorage, writeStorage } from "./theme";

const KEY = "amaru-privacy-ack-v1";
/** Fired by the sidebar «Privacidad» button to reopen the details. */
export const PRIVACY_EVENT = "amaru:privacy";

/**
 * Subtle notice under Ley N.° 29733 (Protección de Datos Personales, Perú) and
 * its reglamento. AMARU uses no advertising or analytics cookies, so there is
 * nothing to accept: the notice informs once and stays reachable afterwards.
 */
export function PrivacyNotice() {
  const [visible, setVisible] = useState(() => readStorage(KEY) !== "1");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const open = () => setDetailsOpen(true);
    window.addEventListener(PRIVACY_EVENT, open);
    return () => window.removeEventListener(PRIVACY_EVENT, open);
  }, []);

  function dismiss() {
    writeStorage(KEY, "1");
    setVisible(false);
  }

  return (
    <>
      {visible ? (
        <aside className="privacy-toast" aria-label="Aviso de privacidad">
          <ShieldCheck aria-hidden="true" />
          <p>
            Sin cookies de publicidad ni de seguimiento. Guardamos tus
            preferencias en este navegador.{" "}
            <button
              type="button"
              className="privacy-link"
              onClick={() => setDetailsOpen(true)}
            >
              Más detalles
            </button>
          </p>
          <button type="button" className="privacy-ok" onClick={dismiss}>
            Entendido
          </button>
        </aside>
      ) : null}
      {detailsOpen ? (
        <PrivacyDialog
          onClose={() => {
            setDetailsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="docs-dialog privacy-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
    >
      <header>
        <h2 id={titleId}>Privacidad y datos personales</h2>
        <button
          type="button"
          className="guide-close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="privacy-body">
        <p>
          Este aviso sigue la Ley N.° 29733, Ley de Protección de Datos
          Personales, y su reglamento. AMARU no tiene registro de usuarios: solo
          existe una cuenta de administrador.
        </p>
        <h3>Qué se guarda</h3>
        <ul>
          <li>
            <strong>En tu navegador (localStorage):</strong> tema, idioma, menú,
            favoritos, tu histórico de prompts y este aviso. No sale de tu
            equipo y puedes borrarlo desde la configuración del navegador.
          </li>
          <li>
            <strong>IA gratuita:</strong> para limitar las consultas diarias se
            guarda un identificador seudonimizado (un resumen cifrado de tu IP,
            nunca la IP) durante 36 horas. El texto que envías se procesa en
            Cloudflare Workers AI y AMARU no lo almacena.
          </li>
          <li>
            <strong>Administrador:</strong> una cookie técnica de sesión
            (HttpOnly) solo si inicias sesión como administrador. Es
            estrictamente necesaria y no se usa para seguimiento.
          </li>
        </ul>
        <h3>Qué no se hace</h3>
        <ul>
          <li>No hay cookies de publicidad, analítica ni redes sociales.</li>
          <li>No se venden ni ceden datos a terceros.</li>
          <li>Los videos se insertan en el modo sin cookies de YouTube.</li>
        </ul>
        <h3>Tus derechos</h3>
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, cancelación y
          oposición (ARCO) contactando al administrador del sitio. Como la
          mayoría de datos vive en tu propio navegador, borrar los datos del
          sitio los elimina por completo. No envíes datos personales sensibles
          en las consultas a la IA.
        </p>
      </div>
    </dialog>
  );
}
