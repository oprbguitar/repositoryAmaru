import { describe, expect, it } from "vitest";
import type { LaboratoryProjectSummary } from "../src/features/laboratory/api";
import { buildTimeline, groupByDay } from "../src/features/laboratory/timeline";

const base = { inputs: null, alternativeCount: 0 };
const projects: LaboratoryProjectSummary[] = [
  {
    ...base,
    id: "a",
    name: "A",
    status: "active",
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
  },
  {
    ...base,
    id: "b",
    name: "B",
    status: "active",
    alternativeCount: 3,
    createdAt: "2026-11-02T10:00:00Z",
    updatedAt: "2026-11-03T10:00:00Z",
  },
  {
    ...base,
    id: "c",
    name: "C",
    status: "archived",
    createdAt: "2026-11-02T08:00:00Z",
    updatedAt: "2026-11-04T10:00:00Z",
  },
];

describe("laboratory timeline", () => {
  it("derives events only from stored dates, newest first", () => {
    expect(buildTimeline(projects).map((e) => e.key)).toEqual([
      "c:archived",
      "b:calculated",
      "b:created",
      "c:created",
      "a:created",
    ]);
  });
  it("groups by day", () => {
    expect(groupByDay(buildTimeline(projects)).map((g) => g.day)).toEqual([
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
      "2026-11-01",
    ]);
  });
});
