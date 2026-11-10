import { RefreshCw } from "lucide-react";
import { useIsAdmin } from "../../features/admin/AdminNote";

/**
 * Botón de sincronización compartido por todos los módulos.
 *
 * Mientras la petición está en curso muestra tres señales a la vez: el icono
 * girando, el texto en gerundio y una barra indeterminada al pie del botón. Es
 * indeterminada a propósito: el Worker consulta varias fuentes externas y no
 * informa de un porcentaje, así que fingir una barra de progreso mediría algo
 * que nadie está midiendo. Con `prefers-reduced-motion` la barra se queda fija
 * y el estado sigue siendo legible por el texto.
 */
export function SyncActionButton({
  label,
  busyLabel = "Sincronizando…",
  busy,
  disabled = false,
  onClick,
  title,
  className = "secondary-button compact",
  children,
}: {
  label: string;
  busyLabel?: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  className?: string;
  /** Contenido adicional bajo la etiqueta (avisos de credencial, por ejemplo). */
  children?: React.ReactNode;
}) {
  // Manual sync is an administrator tool; visitors rely on the weekly cron.
  if (!useIsAdmin()) return null;
  return (
    <button
      type="button"
      className={`${className} sync-action${busy ? " is-syncing" : ""}`}
      onClick={onClick}
      disabled={busy || disabled}
      aria-busy={busy}
      title={title}
    >
      <RefreshCw className={busy ? "spin" : ""} aria-hidden="true" />
      <span className="sync-action-label">{busy ? busyLabel : label}</span>
      {children}
      {busy ? (
        <span className="sync-action-progress" aria-hidden="true" />
      ) : null}
    </button>
  );
}
