/**
 * Colour themes. Each theme maps to a *base* (the token family the existing
 * component rules are keyed on: pastel, dark, light, contrast-*) plus an
 * optional *palette* that only re-tints tokens on top of that base. That way
 * the new palettes inherit every light/dark adjustment already written.
 */
export const APP_THEMES = [
  "playful",
  "mint",
  "sunset",
  "pastel",
  "obsidian",
  "dark",
  "light",
  "contrast-light",
  "contrast-dark",
] as const;

export type AppTheme = (typeof APP_THEMES)[number];
export type ThemeBase =
  | "pastel"
  | "dark"
  | "light"
  | "contrast-light"
  | "contrast-dark";

const THEME_BASE: Record<AppTheme, ThemeBase> = {
  playful: "pastel",
  mint: "pastel",
  sunset: "pastel",
  pastel: "pastel",
  obsidian: "dark",
  dark: "dark",
  light: "light",
  "contrast-light": "contrast-light",
  "contrast-dark": "contrast-dark",
};

export const DEFAULT_THEME: AppTheme = "playful";

export function isAppTheme(value: unknown): value is AppTheme {
  return (
    typeof value === "string" &&
    (APP_THEMES as readonly string[]).includes(value)
  );
}

export function themeBase(theme: AppTheme): ThemeBase {
  return THEME_BASE[theme];
}

/** Applies a theme to <html>: base drives component rules, palette re-tints. */
export function applyTheme(theme: AppTheme, root = document.documentElement) {
  root.dataset.theme = themeBase(theme);
  if (themeBase(theme) === theme) delete root.dataset.palette;
  else root.dataset.palette = theme;
}

export function resolveInitialTheme(
  stored: string | null,
  _prefersLight: boolean,
  prefersMoreContrast = false,
): AppTheme {
  if (isAppTheme(stored)) return stored;
  if (prefersMoreContrast)
    return _prefersLight ? "contrast-light" : "contrast-dark";
  // The playful observatory palette is the default for every new visitor;
  // the other palettes stay one click away in the theme picker.
  return DEFAULT_THEME;
}

/** Cycles through every theme in display order. */
export function nextTheme(theme: AppTheme): AppTheme {
  const index = APP_THEMES.indexOf(theme);
  return APP_THEMES[(index + 1) % APP_THEMES.length] ?? DEFAULT_THEME;
}

/** Whether a theme paints light surfaces (drives `color-scheme` helpers). */
export function isLightTheme(theme: AppTheme) {
  const base = themeBase(theme);
  return base === "light" || base === "pastel" || base === "contrast-light";
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
