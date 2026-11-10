import { describe, expect, it } from "vitest";
import { CONCEPTS, conceptById } from "../src/features/evolution/concepts";
import {
  BRANCHES,
  ERAS,
  filterMilestones,
  MILESTONES,
  milestoneYear,
  sortedMilestones,
  timelineStats,
} from "../src/features/evolution/timeline";

describe("evolution timeline", () => {
  it("every milestone has a source, a known era and a known branch", () => {
    const eras = new Set(ERAS.map((era) => era.id));
    const branches = new Set(BRANCHES.map((branch) => branch.id));
    for (const milestone of MILESTONES) {
      expect(milestone.sources.length).toBeGreaterThan(0);
      expect(eras.has(milestone.era)).toBe(true);
      expect(branches.has(milestone.branch)).toBe(true);
    }
  });

  it("milestone years fall inside their era", () => {
    for (const milestone of MILESTONES) {
      const era = ERAS.find((item) => item.id === milestone.era);
      const year = milestoneYear(milestone);
      expect(year).toBeGreaterThanOrEqual(era?.start ?? 0);
      expect(year).toBeLessThanOrEqual(era?.end ?? 9999);
    }
  });

  it("sorts chronologically and reaches 2026 without future dates", () => {
    const sorted = sortedMilestones();
    for (let i = 1; i < sorted.length; i += 1)
      expect(milestoneYear(sorted[i])).toBeGreaterThanOrEqual(
        milestoneYear(sorted[i - 1]),
      );
    expect(milestoneYear(sorted[sorted.length - 1])).toBeLessThanOrEqual(2026);
  });

  it("filters by branch and reports stats", () => {
    const branch = BRANCHES[0].id;
    const filtered = filterMilestones(MILESTONES, branch, "");
    expect(filtered.every((m) => m.branch === branch)).toBe(true);
    expect(timelineStats().milestones).toBe(MILESTONES.length);
  });

  it("concept graph parents exist", () => {
    for (const concept of CONCEPTS)
      for (const parent of concept.parents)
        expect(conceptById(parent)).toBeDefined();
  });
});
