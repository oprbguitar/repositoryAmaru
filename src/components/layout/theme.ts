export type AppTheme = "dark" | "light";

export function resolveInitialTheme(
  stored: string | null,
  prefersLight: boolean,
): AppTheme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersLight ? "light" : "dark";
}

export function nextTheme(theme: AppTheme): AppTheme {
  return theme === "dark" ? "light" : "dark";
}
