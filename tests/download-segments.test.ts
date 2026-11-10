import { describe, expect, it } from "vitest";
import {
  resumeSegments,
  segmentLayout,
} from "../src/features/local-models/downloader";

describe("parallel download segments", () => {
  it("splits a file into four covering segments", () => {
    const layout = segmentLayout(10);
    expect(layout).toEqual([
      { from: 0, length: 3 },
      { from: 3, length: 3 },
      { from: 6, length: 3 },
      { from: 9, length: 1 },
    ]);
  });

  it("derives segment progress from a contiguous byte count", () => {
    expect(resumeSegments(10, undefined, 7, 10)).toEqual([3, 3, 1, 0]);
  });

  it("prefers saved counters but clamps them to the bytes on disk", () => {
    expect(resumeSegments(10, [3, 2, 3, 1], 0, 8)).toEqual([3, 2, 2, 0]);
  });
});
