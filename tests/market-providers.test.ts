import { describe, expect, it } from "vitest";
import {
  parseAlphaVantage,
  parseMarketstack,
  parsePolygon,
  parseTiingo,
  parseTwelveData,
} from "../lib/market/providers";

describe("market provider parsers", () => {
  it("parses documented payload shapes ascending", () => {
    expect(
      parseTwelveData({
        values: [
          { datetime: "2026-11-09", close: "10.5" },
          { datetime: "2026-11-06", close: "10" },
        ],
      }),
    ).toEqual([
      { date: "2026-11-06", value: 10 },
      { date: "2026-11-09", value: 10.5 },
    ]);
    expect(
      parseAlphaVantage({
        "Time Series (Daily)": { "2026-11-09": { "4. close": "5" } },
      }),
    ).toEqual([{ date: "2026-11-09", value: 5 }]);
    expect(
      parseTiingo([{ date: "2026-11-09T00:00:00.000Z", close: 3 }]),
    ).toEqual([{ date: "2026-11-09", value: 3 }]);
    expect(
      parsePolygon({ results: [{ t: Date.UTC(2026, 10, 9), c: 7 }] }),
    ).toEqual([{ date: "2026-11-09", value: 7 }]);
    expect(
      parseMarketstack({
        data: [{ date: "2026-11-09T00:00:00+0000", close: 2 }],
      }),
    ).toEqual([{ date: "2026-11-09", value: 2 }]);
  });
  it("returns [] for error payloads", () => {
    expect(parseTwelveData({ code: 401, status: "error" })).toEqual([]);
    expect(parseAlphaVantage({ Information: "limit" })).toEqual([]);
  });
});
