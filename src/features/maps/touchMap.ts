/**
 * On touch screens a full-width map would trap the page scroll. Cooperative
 * gestures let one finger scroll the page and two fingers move the map.
 */
export function touchMapOptions(): {
  cooperativeGestures?: boolean;
  locale?: Record<string, string>;
} {
  let coarse = false;
  try {
    coarse = window.matchMedia("(pointer: coarse)").matches;
  } catch {
    coarse = false;
  }
  if (!coarse) return {};
  return {
    cooperativeGestures: true,
    locale: {
      "CooperativeGesturesHandler.MobileHelpText":
        "Usa dos dedos para mover el mapa",
      "CooperativeGesturesHandler.WindowsHelpText":
        "Usa Ctrl + rueda para acercar el mapa",
      "CooperativeGesturesHandler.MacHelpText":
        "Usa ⌘ + rueda para acercar el mapa",
    },
  };
}

/** Narrow screens start with the whole world in view. */
export function initialZoom(desktopZoom: number) {
  try {
    return window.matchMedia("(max-width: 600px)").matches
      ? Math.min(desktopZoom, 0.3)
      : desktopZoom;
  } catch {
    return desktopZoom;
  }
}
