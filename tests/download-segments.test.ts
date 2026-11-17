import { describe, expect, it } from "vitest";
import {
  CHUNK_BYTES,
  ConnectionGate,
  chunkCount,
  resumeSegments,
  SpeedMeter,
  segmentLayout,
} from "../src/features/local-models/downloader";

describe("parallel download chunks", () => {
  it("splits a file into covering segments", () => {
    expect(segmentLayout(10, 4)).toEqual([
      { from: 0, length: 3 },
      { from: 3, length: 3 },
      { from: 6, length: 3 },
      { from: 9, length: 1 },
    ]);
  });

  it("uses ~16 MB chunks so slow connections only hold back a little", () => {
    expect(chunkCount(1)).toBe(1);
    expect(chunkCount(CHUNK_BYTES * 10)).toBe(10);
    expect(chunkCount(CHUNK_BYTES * 10 + 1)).toBe(11);
  });

  it("derives chunk progress from a contiguous byte count", () => {
    expect(resumeSegments(10, undefined, 7, 10, 4)).toEqual([3, 3, 1, 0]);
  });

  it("prefers saved counters but clamps them to the bytes on disk", () => {
    expect(resumeSegments(10, [3, 2, 3, 1], 0, 8, 4)).toEqual([3, 2, 2, 0]);
  });

  it("re-maps progress saved with the old 4-segment layout", () => {
    // Old layout of 20 bytes: [0,5) [5,10) [10,15) [15,20); first two done,
    // third half done. New layout: 10 chunks of 2 bytes.
    expect(resumeSegments(20, [5, 5, 2, 0], 0, 20, 10)).toEqual([
      2, 2, 2, 2, 2, 2, 0, 0, 0, 0,
    ]);
  });
});

describe("connection budget", () => {
  it("queues connections beyond the budget and hands slots over", async () => {
    const gate = new ConnectionGate(2);
    const signal = new AbortController().signal;
    const a = await gate.acquire(signal);
    await gate.acquire(signal);
    expect(gate.available).toBe(0);
    let third = false;
    const pending = gate.acquire(signal).then((release) => {
      third = true;
      return release;
    });
    await Promise.resolve();
    expect(third).toBe(false);
    a();
    a(); // releasing twice is harmless
    (await pending)();
    expect(third).toBe(true);
    expect(gate.available).toBe(1);
  });

  it("drops a waiting request when its download is paused", async () => {
    const gate = new ConnectionGate(1);
    await gate.acquire(new AbortController().signal);
    const pause = new AbortController();
    const waiting = gate.acquire(pause.signal);
    pause.abort(new Error("Pausado"));
    await expect(waiting).rejects.toThrow("Pausado");
  });
});

describe("speed meter", () => {
  it("reports the recent speed, not the average since the start", () => {
    const meter = new SpeedMeter(5000);
    meter.add(1_000_000, 0); // slow start
    meter.add(1_000_000, 10_000);
    for (let t = 10_100; t <= 15_000; t += 100) meter.add(10_000_000, t);
    // ~10 MB every 100 ms during the last 5 s ≈ 100 MB/s.
    expect(meter.rate(15_000)).toBeGreaterThan(90_000_000);
  });
});
