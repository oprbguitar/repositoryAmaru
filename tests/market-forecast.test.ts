import { describe, expect, it } from "vitest";
import {
  analyzeSeries,
  drawdown,
  ema,
  holtForecast,
  linearFit,
  linearForecast,
  momentum,
  volatility,
} from "../lib/market/forecast";

describe("market forecast", () => {
  it("fits a perfect line and projects it with a narrow band", () => {
    const values = [10, 12, 14, 16, 18, 20];
    expect(linearFit(values)?.slope).toBeCloseTo(2);
    const f = linearForecast(values, 2);
    expect(f?.points[0].value).toBeCloseTo(22);
    const p = f?.points[1];
    expect((p?.upper ?? 0) - (p?.lower ?? 0)).toBeLessThan(1e-6);
  });
  it("widens the Holt band with the horizon", () => {
    const f = holtForecast([1, 3, 2, 4, 3, 5, 4, 6], 3);
    const w = (i: number) =>
      (f?.points[i].upper ?? 0) - (f?.points[i].lower ?? 0);
    expect(w(2)).toBeGreaterThan(w(0));
  });
  it("returns null on short series", () => {
    expect(linearForecast([1, 2], 3)).toBeNull();
    expect(holtForecast([1, 2, 3], 3)).toBeNull();
  });
  it("computes momentum, drawdown, ema and volatility", () => {
    expect(momentum([100, 110], 1)).toBeCloseTo(0.1);
    expect(drawdown([100, 120, 90, 100])?.max).toBeCloseTo(-0.25);
    expect(ema([1, 1, 1, 1], 2)).toBeCloseTo(1);
    expect(volatility([100, 100, 100])).toBe(0);
  });
  it("refuses to forecast below the minimum observations", () => {
    const a = analyzeSeries(
      [1, 2, 3].map((v, i) => ({ date: `2026-01-0${i + 1}`, value: v })),
    );
    expect(a?.forecast).toBeNull();
    expect(a?.note).toContain("al menos");
  });
});
