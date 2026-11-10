import { ChevronDown } from "lucide-react";
import { type RefObject, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isMobileViewport } from "./mobile";

/** Taps on these never open the sheet: filters, tabs, links, form fields… */
const IGNORE = [
  "[data-no-sheet]",
  "form",
  "[role=toolbar]",
  "[role=tablist]",
  ".page-heading",
  "nav",
  "select",
  "input",
  "textarea",
  "label",
  "a[href]",
  "summary",
  ".pagination",
  ".fav-star",
  ".sync-action",
  "[class*=filter]",
].join(",");

const TRIGGER = "button, tr, [role=option], [role=row], [role=button]";

/**
 * On phones the context panel of every module (`.module-layout
 * .context-panel`) is hidden for lack of room. When a tap in the list changes
 * that panel, it rises as a bottom sheet instead — the same detail the
 * desktop shows at the side, right where the person is.
 */
export function MobileDetailSheet({
  workspaceRef,
}: {
  workspaceRef: RefObject<HTMLElement | null>;
}) {
  const location = useLocation();
  const [layout, setLayout] = useState<HTMLElement | null>(null);

  function close() {
    setLayout((current) => {
      current?.classList.remove("sheet-open");
      return null;
    });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: close on route change only
  useEffect(() => {
    close();
  }, [location.pathname]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    function onClick(event: MouseEvent) {
      if (!isMobileViewport()) return;
      const target = event.target as Element | null;
      const main = target?.closest(".module-main");
      if (!target || !main || target.closest(IGNORE)) return;
      const trigger = target.closest(TRIGGER);
      if (!trigger) return;
      // Toggle chips (aria-pressed) are filters unless they are list items or
      // selectable cards/tiles.
      if (
        trigger.hasAttribute("aria-pressed") &&
        !trigger.closest("li") &&
        !/card|tile|row|select/.test(trigger.className)
      )
        return;
      const layoutElement = main.closest<HTMLElement>(".module-layout");
      if (!layoutElement) return;
      // CollapsibleLayout wraps the panel in .context-slot; other modules
      // render .context-panel directly as the second column.
      const sheetOf = () =>
        layoutElement.querySelector(":scope > .context-slot") ??
        layoutElement.querySelector(":scope > .context-panel");
      const panelBefore = sheetOf()?.textContent ?? null;
      if (panelBefore === null) return;
      // React commits the selection after this listener; compare shortly
      // after and open only if the detail actually changed. (A timer, not
      // rAF: rAF pauses in background tabs.)
      window.setTimeout(() => {
        const panel = sheetOf();
        if (!panel || panel.textContent === panelBefore) return;
        panel.scrollTop = 0;
        layoutElement.classList.add("sheet-open");
        setLayout(layoutElement);
      }, 60);
    }
    workspace.addEventListener("click", onClick);
    return () => workspace.removeEventListener("click", onClick);
  }, [workspaceRef]);

  useEffect(() => {
    if (!layout) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onResize() {
      if (!isMobileViewport()) close();
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [layout]);

  if (!layout) return null;
  return (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="Cerrar detalle"
        tabIndex={-1}
        onClick={close}
      />
      <button type="button" className="sheet-close" onClick={close}>
        <ChevronDown aria-hidden="true" /> Cerrar detalle
      </button>
    </>
  );
}
