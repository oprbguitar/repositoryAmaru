import { describe, expect, it } from "vitest";
import {
  normalizeFrankfurter,
  normalizeSecCompanyConcept,
  normalizeSecSubmissions,
} from "../lib/external/normalizers";

const now = "2026-07-18T00:00:00Z";

describe("SEC XBRL companyconcept", () => {
  it("toma la última observación 10-K y 10-Q sin mezclar periodos", () => {
    const records = normalizeSecCompanyConcept(
      {
        cik: 1045810,
        entityName: "NVIDIA CORP",
        units: {
          USD: [
            {
              end: "2025-01-26",
              val: 130497000000,
              form: "10-K",
              filed: "2025-02-26",
              fp: "FY",
              fy: 2025,
            },
            {
              end: "2026-01-25",
              val: 215938000000,
              form: "10-K",
              filed: "2026-02-25",
              fp: "FY",
              fy: 2026,
            },
            {
              end: "2026-04-26",
              val: 81615000000,
              form: "10-Q",
              filed: "2026-05-27",
              fp: "Q1",
              fy: 2027,
            },
            { end: "2026-04-26", val: 999, form: "DEF 14A" },
          ],
        },
      },
      { tag: "Revenues", label: "Ingresos" },
      now,
      "nvidia",
    );
    expect(records).toHaveLength(2);
    const annual = records.find((record) => record.data.form === "10-K");
    const quarterly = records.find((record) => record.data.form === "10-Q");
    expect(annual?.data.value).toBe(215938000000);
    expect(annual?.data.periodEnd).toBe("2026-01-25");
    expect(quarterly?.data.value).toBe(81615000000);
    expect(records[0].sourceId).toBe("sec-xbrl");
    expect(records[0].verificationStatus).toBe("verified");
    expect(records[0].originalUrl).toContain("CIK0001045810/us-gaap/Revenues");
  });

  it("devuelve vacío cuando no hay unidades USD", () => {
    const records = normalizeSecCompanyConcept(
      { cik: 1, entityName: "X", units: {} },
      { tag: "Revenues", label: "Ingresos" },
      now,
    );
    expect(records).toHaveLength(0);
  });
});

describe("Frankfurter (BCE)", () => {
  it("normaliza cada tasa como indicador con fecha de referencia", () => {
    const records = normalizeFrankfurter(
      {
        amount: 1,
        base: "USD",
        date: "2026-07-17",
        rates: { EUR: 0.87451, BRL: 5.1158 },
      },
      now,
    );
    expect(records).toHaveLength(2);
    const eur = records.find((record) => record.data.currency === "EUR");
    expect(eur?.data.value).toBe(0.87451);
    expect(eur?.externalId).toBe("USD/EUR:2026-07-17");
    expect(eur?.data.indicatorType).toBe("fx_reference_rate");
    expect(eur?.publishedAt).toBe("2026-07-17");
  });
});

describe("SEC submissions multiempresa", () => {
  it("usa el providerId indicado y respeta el límite", () => {
    const records = normalizeSecSubmissions(
      {
        cik: "0000789019",
        name: "MICROSOFT CORP",
        filings: {
          recent: {
            accessionNumber: ["0001-25-1", "0001-25-2", "0001-25-3"],
            form: ["10-Q", "8-K", "10-K"],
            filingDate: ["2026-06-01", "2026-05-01", "2026-04-01"],
            primaryDocument: ["a.htm", "b.htm", "c.htm"],
          },
        },
      },
      now,
      { providerId: null, limit: 2 },
    );
    expect(records).toHaveLength(2);
    expect(records[0].providerId).toBeNull();
    expect(records[0].title).toContain("MICROSOFT CORP");
    expect(records[0].data.cik).toBe("0000789019");
  });
});
