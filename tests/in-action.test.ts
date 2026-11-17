import { describe, expect, it } from "vitest";
import {
  fillPrompt,
  PROFESSIONS,
  promptFields,
  searchCases,
} from "../src/features/in-action/professions";
import {
  ASSISTANTS,
  assistantById,
  solesWithIgv,
  TASKS,
  tierFor,
} from "../src/features/in-action/tools";
import { bcrpPeriodTime, latestFx } from "../src/features/in-action/useFx";

describe("IA en acción — catálogo", () => {
  it("every case points to a known task and every task to known assistants", () => {
    const ids = new Set<string>();
    for (const profession of PROFESSIONS) {
      expect(profession.specialties.length).toBeGreaterThan(0);
      for (const specialty of profession.specialties) {
        for (const item of specialty.cases) {
          expect(TASKS[item.kind]).toBeDefined();
          const key = `${profession.id}/${item.id}`;
          expect(ids.has(key)).toBe(false);
          ids.add(key);
        }
      }
    }
    for (const task of Object.values(TASKS)) {
      for (const pick of task.commercial) {
        expect(assistantById(pick.id)).toBeDefined();
      }
    }
    expect(ASSISTANTS.every((a) => a.plans.length > 0)).toBe(true);
  });

  it("finds cases from a natural request", () => {
    const hits = searchCases("Necesito investigar jurisprudencia");
    expect(hits[0]?.profession.id).toBe("derecho");
    expect(searchCases("quiero")).toEqual([]);
  });

  it("fills only the prompt fields the visitor wrote", () => {
    const prompt = "Analiza [tema] en [región].";
    expect(promptFields(prompt)).toEqual(["tema", "región"]);
    expect(fillPrompt(prompt, { tema: "dengue" })).toBe(
      "Analiza dengue en [región].",
    );
  });
});

describe("IA en acción — soles, tipo de cambio y hardware", () => {
  it("adds IGV to the converted price", () => {
    expect(solesWithIgv(20, 3.4)).toBeCloseTo(80.24, 2);
  });

  it("takes the latest numeric BCRP observation and skips n.d.", () => {
    expect(bcrpPeriodTime("12.Nov.26")).toBe(Date.UTC(2026, 10, 12));
    const reading = latestFx([
      { sourceId: "bcrp", data: { value: "3.414", period: "11.Nov.26" } },
      { sourceId: "bcrp", data: { value: "3.407", period: "12.Nov.26" } },
      { sourceId: "bcrp", data: { value: "n.d.", period: "13.Nov.26" } },
      { sourceId: "frankfurter", data: { value: "9", period: "14.Nov.26" } },
    ]);
    expect(reading).toEqual({ rate: 3.407, period: "12.Nov.26" });
    expect(latestFx([])).toBeNull();
  });

  it("maps a PC to the highest tier it reaches", () => {
    expect(tierFor(null, null)).toBeNull();
    expect(tierFor(8, null)?.id).toBe("basic");
    expect(tierFor(16, 8)?.id).toBe("mid");
    expect(tierFor(16, 0)?.id).toBe("basic");
    expect(tierFor(16, null)?.id).toBe("mid");
    expect(tierFor(32, 12)?.id).toBe("high");
    expect(tierFor(4, 0)).toBeNull();
  });
});
