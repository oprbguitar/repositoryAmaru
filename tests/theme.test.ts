import { describe, expect, it } from "vitest";
import { nextTheme, resolveInitialTheme } from "../src/components/layout/theme";

describe("application theme", () => {
  it("restores an explicit stored preference", () => {
    expect(resolveInitialTheme("dark", true)).toBe("dark");
    expect(resolveInitialTheme("light", false)).toBe("light");
  });

  it("uses the operating system preference when no choice was stored", () => {
    expect(resolveInitialTheme(null, true)).toBe("light");
    expect(resolveInitialTheme(null, false)).toBe("dark");
  });

  it("toggles between light and dark", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });
});
