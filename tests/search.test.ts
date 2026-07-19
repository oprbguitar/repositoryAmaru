import { describe, expect, it } from "vitest";
import { normalizeSearch, tokenizeSearch } from "../lib/normalization/search";

describe("search normalization", () => {
  it("normalizes Spanish accents and duplicate spacing", () => {
    expect(normalizeSearch("  Investigación   Perú  ")).toBe(
      "investigacion peru",
    );
  });

  it("returns unique useful tokens", () => {
    expect(tokenizeSearch("IA local, IA privada y segura")).toEqual([
      "ia",
      "local",
      "privada",
      "segura",
    ]);
  });
});
