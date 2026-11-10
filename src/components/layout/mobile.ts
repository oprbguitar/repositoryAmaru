import { useEffect, useState } from "react";

/** Below this width the side panels stack or become a bottom sheet. */
export const MOBILE_QUERY = "(max-width: 900px)";

export function isMobileViewport() {
  try {
    return window.matchMedia(MOBILE_QUERY).matches;
  } catch {
    return false;
  }
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobileViewport);
  useEffect(() => {
    const list = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * On phones the detail lives below the list: after a selection, bring it
 * into view.
 */
export function revealOnMobile(target: string | Element | null) {
  if (!target || !isMobileViewport()) return;
  // A selector is resolved after React re-renders the new detail.
  window.setTimeout(() => {
    const element =
      typeof target === "string" ? document.querySelector(target) : target;
    // Instant jump: fast on low-end phones and never left half-way.
    element?.scrollIntoView({ block: "start" });
  }, 60);
}
