import { describe, expect, it } from "vitest";
import {
  APP_THEMES,
  applyTheme,
  isAppTheme,
  isLightTheme,
  nextTheme,
  resolveInitialTheme,
  resolveNavMode,
  themeBase,
} from "../src/components/layout/theme";

describe("application theme", () => {
  it("offers the playful palettes plus the reading modes", () => {
    expect(APP_THEMES).toEqual([
      "playful",
      "mint",
      "sunset",
      "pastel",
      "obsidian",
      "dark",
      "light",
      "contrast-light",
      "contrast-dark",
    ]);
  });

  it("restores an explicit stored preference", () => {
    expect(resolveInitialTheme("dark", true)).toBe("dark");
    expect(resolveInitialTheme("obsidian", true)).toBe("obsidian");
    expect(resolveInitialTheme("contrast-light", false)).toBe("contrast-light");
  });

  it("defaults to playful when no choice was stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("playful");
    expect(resolveInitialTheme("bogus", false)).toBe("playful");
  });

  it("honours prefers-contrast: more when nothing was stored", () => {
    expect(resolveInitialTheme(null, true, true)).toBe("contrast-light");
    expect(resolveInitialTheme(null, false, true)).toBe("contrast-dark");
    expect(resolveInitialTheme("dark", false, true)).toBe("dark");
  });

  it("cycles through every theme", () => {
    expect(nextTheme("playful")).toBe("mint");
    expect(nextTheme("contrast-dark")).toBe("playful");
  });

  it("maps palettes onto a base token family", () => {
    expect(themeBase("playful")).toBe("pastel");
    expect(themeBase("obsidian")).toBe("dark");
    expect(themeBase("light")).toBe("light");
    const root = document.createElement("html");
    applyTheme("sunset", root);
    expect(root.dataset.theme).toBe("pastel");
    expect(root.dataset.palette).toBe("sunset");
    applyTheme("light", root);
    expect(root.dataset.theme).toBe("light");
    expect(root.dataset.palette).toBeUndefined();
  });

  it("classifies light surfaces and validates values", () => {
    expect(isLightTheme("playful")).toBe(true);
    expect(isLightTheme("obsidian")).toBe(false);
    expect(isLightTheme("contrast-dark")).toBe(false);
    expect(isAppTheme("mint")).toBe(true);
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
