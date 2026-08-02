import { describe, expect, it } from "vitest";
import {
  dictionary,
  LANGUAGES,
  resolveInitialLanguage,
} from "../src/i18n/dictionary";

describe("resolveInitialLanguage", () => {
  it("defaults to Spanish, the product's interface language", () => {
    expect(resolveInitialLanguage(null)).toBe("es");
  });

  it("does not flip to English just because the browser is en-US", () => {
    // Regression guard: auto-detection broke the Spanish-first convention.
    expect(resolveInitialLanguage(null)).toBe("es");
    expect(resolveInitialLanguage("")).toBe("es");
  });

  it("honours an explicit stored choice", () => {
    expect(resolveInitialLanguage("en")).toBe("en");
    expect(resolveInitialLanguage("es")).toBe("es");
  });

  it("falls back to Spanish for an unknown stored value", () => {
    expect(resolveInitialLanguage("fr")).toBe("es");
  });
});

describe("dictionary", () => {
  it("offers exactly the advertised languages", () => {
    expect(LANGUAGES.map((entry) => entry.code)).toEqual(["es", "en"]);
  });

  it("translates every Spanish key into English", () => {
    const spanish = Object.keys(dictionary.es).sort();
    const english = Object.keys(dictionary.en).sort();
    expect(english).toEqual(spanish);
  });

  it("has no empty strings in either language", () => {
    for (const language of ["es", "en"] as const) {
      for (const [key, value] of Object.entries(dictionary[language])) {
        expect(value, `${language}.${key}`).toBeTruthy();
      }
    }
  });

  it("actually differs between languages for translatable copy", () => {
    // Proper nouns such as GitHub legitimately match; most keys must not.
    const identical = Object.keys(dictionary.es).filter(
      (key) =>
        dictionary.es[key as keyof typeof dictionary.es] ===
        dictionary.en[key as keyof typeof dictionary.en],
    );
    expect(identical.length).toBeLessThan(
      Object.keys(dictionary.es).length / 4,
    );
  });
});
