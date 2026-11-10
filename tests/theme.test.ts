import { describe, expect, it } from "vitest";
import {
  APP_THEMES,
  isAppTheme,
  isLightTheme,
  nextTheme,
  resolveInitialTheme,
  resolveNavMode,
} from "../src/components/layout/theme";

describe("application theme", () => {
  it("offers pastel plus the four reading modes", () => {
    expect(APP_THEMES).toEqual([
      "pastel",
      "dark",
      "light",
      "contrast-light",
      "contrast-dark",
    ]);
  });

  it("restores an explicit stored preference", () => {
    expect(resolveInitialTheme("dark", true)).toBe("dark");
    expect(resolveInitialTheme("light", false)).toBe("light");
    expect(resolveInitialTheme("contrast-light", false)).toBe("contrast-light");
    expect(resolveInitialTheme("contrast-dark", true)).toBe("contrast-dark");
  });

  it("defaults to pastel when no choice was stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("pastel");
    expect(resolveInitialTheme(null, false)).toBe("pastel");
    expect(resolveInitialTheme("bogus", false)).toBe("pastel");
  });

  it("honours prefers-contrast: more when nothing was stored", () => {
    expect(resolveInitialTheme(null, true, true)).toBe("contrast-light");
    expect(resolveInitialTheme(null, false, true)).toBe("contrast-dark");
    expect(resolveInitialTheme("dark", false, true)).toBe("dark");
  });

  it("cycles through every theme", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("contrast-light");
    expect(nextTheme("contrast-light")).toBe("contrast-dark");
    expect(nextTheme("contrast-dark")).toBe("pastel");
    expect(nextTheme("pastel")).toBe("dark");
  });

  it("classifies light surfaces and validates values", () => {
    expect(isLightTheme("light")).toBe(true);
    expect(isLightTheme("pastel")).toBe(true);
    expect(isLightTheme("contrast-light")).toBe(true);
    expect(isLightTheme("contrast-dark")).toBe(false);
    expect(isAppTheme("contrast-dark")).toBe(true);
    expect(isAppTheme("sepia")).toBe(false);
  });
});

describe("navigation mode", () => {
  it("defaults to the full menu", () => {
    expect(resolveNavMode(null)).toBe("full");
    expect(resolveNavMode("weird")).toBe("full");
    expect(resolveNavMode("compact")).toBe("compact");
  });
});
