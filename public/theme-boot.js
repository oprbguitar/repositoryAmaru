// Applies the stored theme before first paint so high-contrast readers never
// see a flash of the dark palette. Kept as a file (not inline) because the
// worker's CSP only allows same-origin scripts.
try {
  const stored = localStorage.getItem("amaru-theme");
  if (
    ["dark", "light", "contrast-light", "contrast-dark"].indexOf(stored) >= 0
  ) {
    document.documentElement.dataset.theme = stored;
  }
  if (localStorage.getItem("amaru-nav") === "compact") {
    document.documentElement.dataset.nav = "compact";
  }
} catch (_error) {}
