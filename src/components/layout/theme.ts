export const APP_THEMES = [
  "dark",
  "light",
  "contrast-light",
  "contrast-dark",
] as const;

export type AppTheme = (typeof APP_THEMES)[number];

export function isAppTheme(value: unknown): value is AppTheme {
  return (
    typeof value === "string" &&
    (APP_THEMES as readonly string[]).includes(value)
  );
}

export function resolveInitialTheme(
  stored: string | null,
  prefersLight: boolean,
  prefersMoreContrast = false,
): AppTheme {
  if (isAppTheme(stored)) return stored;
  if (prefersMoreContrast)
    return prefersLight ? "contrast-light" : "contrast-dark";
  return prefersLight ? "light" : "dark";
}

/** Cycles through every theme in display order. */
export function nextTheme(theme: AppTheme): AppTheme {
  const index = APP_THEMES.indexOf(theme);
  return APP_THEMES[(index + 1) % APP_THEMES.length] ?? "dark";
}

/** Whether a theme paints light surfaces (drives `color-scheme` helpers). */
export function isLightTheme(theme: AppTheme) {
  return theme === "light" || theme === "contrast-light";
}

export type NavMode = "full" | "compact";

export function resolveNavMode(stored: string | null): NavMode {
  return stored === "compact" ? "compact" : "full";
}

/** localStorage can throw (private mode, blocked storage); never let it. */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preference simply does not persist.
  }
}
