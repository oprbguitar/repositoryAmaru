// Applies the stored theme before first paint so readers never see a flash of
// the wrong palette. Kept as a file (not inline) because the worker's CSP only
// allows same-origin scripts. Pastel is the default for new visitors.
try {
  const stored = localStorage.getItem("amaru-theme-v2");
  document.documentElement.dataset.theme =
    ["pastel", "dark", "light", "contrast-light", "contrast-dark"].indexOf(
      stored,
    ) >= 0
      ? stored
      : "pastel";
  if (localStorage.getItem("amaru-nav") === "compact") {
    document.documentElement.dataset.nav = "compact";
  }
} catch (_error) {
  document.documentElement.dataset.theme = "pastel";
}
