import { describe, expect, it } from "vitest";
import {
  CONCEPT_FLOW,
  ERAS,
  MILESTONES,
  timelineStats,
} from "../src/features/evolution/timeline";

// The Evolución IA section is curated editorial content. These checks keep it
// honest: every milestone must cite at least one real, linkable source, and
// the page stats must be derived from the data instead of typed by hand.

describe("evolution timeline data", () => {
  it("has unique milestone ids", () => {
    const ids = MILESTONES.map((milestone) => milestone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns every milestone to a defined era", () => {
    const eraIds = new Set(ERAS.map((era) => era.id));
    for (const milestone of MILESTONES) {
      expect(eraIds.has(milestone.era), milestone.id).toBe(true);
    }
  });

  it("cites at least one https source per milestone", () => {
    for (const milestone of MILESTONES) {
      expect(milestone.sources.length, milestone.id).toBeGreaterThan(0);
      for (const source of milestone.sources) {
        expect(source.url, `${milestone.id}: ${source.title}`).toMatch(
          /^https?:\/\//,
        );
        expect(source.title.trim()).not.toBe("");
        expect(source.author.trim()).not.toBe("");
      }
    }
  });

  it("keeps explanations and impact non-empty", () => {
    for (const milestone of MILESTONES) {
      expect(milestone.summary.trim(), milestone.id).not.toBe("");
      expect(milestone.whatHappened.trim(), milestone.id).not.toBe("");
      expect(milestone.whyItMattered.trim(), milestone.id).not.toBe("");
      expect(milestone.simpleExample.trim(), milestone.id).not.toBe("");
      expect(milestone.impact.length, milestone.id).toBeGreaterThan(0);
    }
  });

  it("orders eras consistently with milestone years", () => {
    const bounds: Record<string, [number, number]> = {
      "1950-1980": [1950, 1980],
      "1980-2012": [1980, 2012],
      "2012-2019": [2012, 2019],
      "2020-hoy": [2020, 2100],
    };
    for (const milestone of MILESTONES) {
      const [min, max] = bounds[milestone.era];
      expect(milestone.year, milestone.id).toBeGreaterThanOrEqual(min);
      expect(milestone.year, milestone.id).toBeLessThanOrEqual(max);
    }
  });

  it("links every concept-flow step to an existing milestone", () => {
    const ids = new Set(MILESTONES.map((milestone) => milestone.id));
    for (const concept of CONCEPT_FLOW) {
      expect(ids.has(concept.milestoneId), concept.id).toBe(true);
    }
  });

  it("computes stats from the dataset", () => {
    const stats = timelineStats();
    expect(stats.milestones).toBe(MILESTONES.length);
    expect(stats.eras).toBe(ERAS.length);
    expect(stats.sources).toBe(
      MILESTONES.reduce((total, m) => total + m.sources.length, 0),
    );
    expect(stats.keyModels).toBeGreaterThan(0);
  });
});
