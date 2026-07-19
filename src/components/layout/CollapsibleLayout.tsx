import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { type ReactNode, useState } from "react";

// Distribución estándar de módulo con panel contextual colapsable.
// Al colapsar, la tabla o el mapa usan todo el ancho disponible.
export function CollapsibleLayout({
  storageKey,
  panel,
  children,
  className = "",
}: {
  storageKey: string;
  panel: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(`amaru-panel-${storageKey}`) === "collapsed",
  );
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(
      `amaru-panel-${storageKey}`,
      next ? "collapsed" : "open",
    );
  }
  return (
    <div
      className={`module-layout observatory-layout ${collapsed ? "context-collapsed" : ""} ${className}`}
    >
      <section className="module-main scroll-region">{children}</section>
      <div className="context-slot">
        <button
          type="button"
          className="context-toggle"
          onClick={toggle}
          aria-label={
            collapsed ? "Mostrar panel contextual" : "Ocultar panel contextual"
          }
          title={collapsed ? "Mostrar panel" : "Ocultar panel"}
        >
          {collapsed ? <PanelRightOpen /> : <PanelRightClose />}
        </button>
        {collapsed ? null : panel}
      </div>
    </div>
  );
}
