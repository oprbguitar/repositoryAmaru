import { describe, expect, it } from "vitest";
import { summarizeSources } from "../src/components/layout/sourceSummary";

describe("summarizeSources", () => {
  it("reports an empty registry explicitly", () => {
    expect(summarizeSources([])).toMatchObject({ enabled: 0, level: "empty" });
  });

  it("ignores disabled sources", () => {
    expect(
      summarizeSources([
        { enabled: false, status: "failed" },
        { enabled: true, status: "connected" },
      ]),
    ).toEqual({ enabled: 1, connected: 1, failed: 0, pending: 0, level: "ok" });
  });

  it("flags failures, including rate limits, above pending sources", () => {
    expect(
      summarizeSources([
        { enabled: true, status: "connected" },
        { enabled: true, status: "rate_limited" },
        { enabled: true, status: "not_configured" },
      ]),
    ).toEqual({
      enabled: 3,
      connected: 1,
      failed: 1,
      pending: 1,
      level: "error",
    });
  });

  it("warns when some sources have not synced yet", () => {
    expect(
      summarizeSources([
        { enabled: true, status: "connected" },
        { enabled: true, status: "pending" },
      ]).level,
    ).toBe("warn");
  });
});
