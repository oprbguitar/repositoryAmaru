import {
  AlertCircle,
  ArrowRight,
  Database,
  KeyRound,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

export function PlaceholderWorkspace({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="module-layout">
      <section className="module-main scroll-region">
        <header className="page-heading">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </header>
        <div className="empty-command-panel">
          <div className="empty-orbit">
            <Radio />
            <span />
            <span />
          </div>
          <h2>Fuente todavía no configurada</h2>
          <p>
            Este módulo está preparado para recibir información verificable.
            AMARU no mostrará datos ficticios mientras falten una fuente pública
            compatible o credenciales locales.
          </p>
          <div className="empty-actions">
            <Link className="primary-button" to="/admin/sources">
              <KeyRound /> Revisar fuentes
            </Link>
            <Link className="secondary-button" to="/local-library">
              Abrir biblioteca <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <aside className="context-panel scroll-region">
        <div className="context-title">
          <Database />
          <strong>Información contextual</strong>
        </div>
        <section>
          <h3>Estado</h3>
          <span className="state-badge not-configured">
            <AlertCircle /> No configurado
          </span>
          <p>La aplicación local continúa operativa sin esta integración.</p>
        </section>
        <section>
          <h3>Principio de confianza</h3>
          <p>
            Solo se publican registros con procedencia, fecha y nivel de
            confianza explícitos.
          </p>
        </section>
        <section>
          <h3>Privacidad</h3>
          <p>
            <ShieldCheck className="inline-icon" /> Las claves se guardan
            únicamente en archivos locales ignorados por Git.
          </p>
        </section>
      </aside>
    </div>
  );
}
