import { describe, expect, it } from "vitest";
import {
  normalizeRelativePath,
  safeDisplayPath,
  UnsafePathError,
} from "../lib/security/path-security";

describe("local path security", () => {
  it.each([
    "../secret.txt",
    "folder/../../secret.txt",
    "/etc/passwd",
    "C:\\Windows\\system.ini",
    "folder/./file.md",
  ])("rejects unsafe path %s", (candidate) =>
    expect(() => normalizeRelativePath(candidate)).toThrow(UnsafePathError),
  );

  it("normalizes safe Windows separators without exposing an absolute path", () => {
    expect(normalizeRelativePath("papers\\2026\\nota.md")).toBe(
      "papers/2026/nota.md",
    );
  });

  it("removes control characters from display segments", () => {
    expect(safeDisplayPath("papers/nota\u0007.md")).toBe("papers/nota.md");
  });
});
