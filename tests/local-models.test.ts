import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  describeAlignment,
  metadataFromTags,
} from "../src/features/local-models/alignment";
import {
  classifyCompatibility,
  type ModelMemoryInput,
} from "../src/features/local-models/compat";
import {
  interpretRange,
  verifyDigest,
} from "../src/features/local-models/downloader";
import {
  buildHardwareReport,
  parseGib,
  type RawHardware,
} from "../src/features/local-models/hardware";
import {
  compareRevision,
  isRepoId,
  parseCommits,
  parseModelInfo,
} from "../src/features/local-models/hf";
import {
  createManifest,
  describeFolder,
  diffPackage,
  folderNameFor,
  mergePackage,
} from "../src/features/local-models/manifest";
import {
  computeMetrics,
  hfPullName,
  pullFraction,
} from "../src/features/local-models/ollama";
import { GIB, sizeProfileFor } from "../src/features/local-models/profiles";
import {
  type RepoFile,
  selectGgufPackage,
  selectSafetensorsPackage,
} from "../src/features/local-models/selection";
import { Sha256, sha256Hex } from "../src/features/local-models/sha256";

const enc = (text: string) => new TextEncoder().encode(text);

describe("sha256 (NIST FIPS 180-4 vectors)", () => {
  const vectors: Array<[string, string]> = [
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    ],
    [
      "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
      "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1",
    ],
  ];
  for (const [input, digest] of vectors)
    it(`hashes "${input.slice(0, 12)}…"`, () => {
      expect(sha256Hex(enc(input))).toBe(digest);
    });

  it("hashes one million 'a' in uneven chunks", () => {
    const hasher = new Sha256();
    const chunk = new Uint8Array(997).fill(0x61);
    let left = 1_000_000;
    while (left > 0) {
      const size = Math.min(left, chunk.length);
      hasher.update(chunk.subarray(0, size));
      left -= size;
    }
    expect(hasher.hex()).toBe(
      "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0",
    );
  });

  it("resumes from a JSON-serialized state and matches node:crypto", () => {
    const data = new Uint8Array(200_003);
    for (let i = 0; i < data.length; i += 1) data[i] = (i * 31 + 7) & 0xff;
    const first = new Sha256().update(data.subarray(0, 70_001));
    const state = JSON.parse(JSON.stringify(first.save()));
    const resumed = Sha256.restore(state).update(data.subarray(70_001));
    expect(resumed.hex()).toBe(createHash("sha256").update(data).digest("hex"));
  });
});

describe("size profiles", () => {
  it("maps bytes to the inclusive GiB bounds", () => {
    expect(sizeProfileFor(GIB).id).toBe("ultralight");
    expect(sizeProfileFor(GIB + 1).id).toBe("light");
    expect(sizeProfileFor(4.7 * GIB).id).toBe("mid");
    expect(sizeProfileFor(10 * GIB).id).toBe("advanced");
    expect(sizeProfileFor(14 * GIB).id).toBe("extended");
    expect(sizeProfileFor(40 * GIB).id).toBe("oversize");
  });
});

const tree: RepoFile[] = [
  { path: "README.md", size: 5_000, sha256: null, gitOid: "a".repeat(40) },
  { path: "LICENSE", size: 7_000, sha256: null, gitOid: "b".repeat(40) },
  { path: "m-Q4_K_M.gguf", size: 800, sha256: "c".repeat(64), gitOid: null },
  { path: "m-Q8_0.gguf", size: 1_500, sha256: "d".repeat(64), gitOid: null },
  { path: "mmproj-f16.gguf", size: 300, sha256: "e".repeat(64), gitOid: null },
];

describe("minimum package selection", () => {
  it("GGUF: one quantization + README/LICENSE, no projector", () => {
    const pkg = selectGgufPackage(tree, "q4_k_m");
    expect(pkg?.files.map((f) => f.path).sort()).toEqual([
      "LICENSE",
      "README.md",
      "m-Q4_K_M.gguf",
    ]);
    expect(pkg?.weightBytes).toBe(800);
  });

  it("safetensors: weights + config + tokenizer + licence", () => {
    const files: RepoFile[] = [
      ...tree.slice(0, 2),
      {
        path: "model.safetensors",
        size: 9,
        sha256: "f".repeat(64),
        gitOid: null,
      },
      { path: "config.json", size: 1, sha256: null, gitOid: "1".repeat(40) },
      { path: "tokenizer.json", size: 1, sha256: null, gitOid: "2".repeat(40) },
      {
        path: "onnx/model.onnx",
        size: 99,
        sha256: null,
        gitOid: "3".repeat(40),
      },
      {
        path: "pytorch_model.bin",
        size: 99,
        sha256: null,
        gitOid: "4".repeat(40),
      },
    ];
    const paths = selectSafetensorsPackage(files)?.files.map((f) => f.path);
    expect(paths).toContain("tokenizer.json");
    expect(paths).toContain("config.json");
    expect(paths).not.toContain("pytorch_model.bin");
    expect(paths).not.toContain("onnx/model.onnx");
  });
});

describe("manifest", () => {
  const pkg = selectGgufPackage(tree, "Q4_K_M");
  if (!pkg) throw new Error("fixture");
  const manifest = createManifest({
    repo: "org/m-GGUF",
    revision: "0123456789abcdef",
    revisionDate: null,
    license: "apache-2.0",
    baseModel: null,
    pkg,
    now: "2026-11-09T00:00:00Z",
  });

  it("names one folder per revision", () => {
    expect(folderNameFor("org/m-GGUF", "0123456789abcdef")).toBe(
      "org--m-GGUF@01234567",
    );
  });

  it("does not duplicate files already in the manifest", () => {
    const again = mergePackage(manifest, pkg, "x");
    expect(again.added).toBe(0);
    expect(again.alreadyPresent).toBe(3);
  });

  it("finds same and other revisions in the folder", () => {
    const ctx = describeFolder(
      [{ folder: "a", manifest }],
      "ORG/m-gguf",
      "ffff",
    );
    expect(ctx.sameRevision).toBeNull();
    expect(ctx.otherRevisions).toHaveLength(1);
  });

  it("diffs installed vs published files", () => {
    const published = pkg.files.map((f) =>
      f.role === "weights" ? { ...f, sha256: "9".repeat(64), size: 900 } : f,
    );
    const diff = diffPackage(manifest.files, published);
    expect(diff.changed).toHaveLength(1);
    expect(diff.sizeDelta).toBe(100);
  });
});

describe("compatibility rule", () => {
  const model = (gib: number): ModelMemoryInput => ({
    weightBytes: gib * GIB,
    parameters: 8e9,
    contextTokens: 4096,
    runnableFormat: true,
  });
  it("GPU fit → compatible", () => {
    expect(
      classifyCompatibility(model(4), { ramGib: 16, vramGib: 12 }).level,
    ).toBe("compatible");
  });
  it("RAM + VRAM fit → limited", () => {
    expect(
      classifyCompatibility(model(9), { ramGib: 16, vramGib: 4 }).level,
    ).toBe("limited");
  });
  it("too big → storage only", () => {
    expect(
      classifyCompatibility(model(40), { ramGib: 16, vramGib: 0 }).level,
    ).toBe("storage-only");
  });
  it("without hardware → unknown", () => {
    expect(
      classifyCompatibility(model(1), { ramGib: null, vramGib: null }).level,
    ).toBe("unknown");
  });
});

describe("hardware report", () => {
  const raw: RawHardware = {
    cores: 8,
    deviceMemory: 8,
    webgpu: "available",
    gpu: { vendor: "nvidia", architecture: "ada", description: "" },
    maxBufferBytes: null,
  };
  it("flags the 8 GB deviceMemory cap", () => {
    const report = buildHardwareReport(raw);
    expect(report.ramCapped).toBe(true);
    expect(report.notes[0]).toMatch(/8 GB/);
  });
  it("parses user GiB input", () => {
    expect(parseGib("15,5")).toBe(15.5);
    expect(parseGib("")).toBeNull();
    expect(parseGib("-1")).toBeNull();
  });
});

describe("modified / alignment axes", () => {
  it("detects abliterated models from tags and name", () => {
    const profile = describeAlignment(
      metadataFromTags("x/Llama-abliterated", [
        "license:llama3.1",
        "base_model:meta-llama/Llama-3.1-8B-Instruct",
      ]),
    );
    expect(profile.modified).toBe(true);
    expect(profile.alignment.level).toBe("low");
    expect(profile.usageFreedom.label).toBe("Con condiciones");
  });
  it("keeps regular models out of the category", () => {
    const profile = describeAlignment(
      metadataFromTags("org/model", ["license:apache-2.0"]),
    );
    expect(profile.modified).toBe(false);
    expect(profile.usageFreedom.level).toBe("high");
    expect(profile.alignment.level).toBe("high");
  });
  it("non-commercial licences are low freedom; gated is low openness", () => {
    const profile = describeAlignment(
      metadataFromTags("a/b", [], { license: "cc-by-nc-4.0", gated: true }),
    );
    expect(profile.usageFreedom.level).toBe("low");
    expect(profile.technicalOpenness.level).toBe("low");
  });
});

describe("hub parsing and versions", () => {
  it("parses model info with card data", () => {
    const info = parseModelInfo({
      id: "a/b",
      sha: "abc",
      gated: false,
      tags: ["gguf"],
      cardData: { license: "mit", base_model: ["c/d"] },
    });
    expect(info?.meta.license).toBe("mit");
    expect(info?.meta.baseModel).toBe("c/d");
    expect(info?.meta.gated).toBe(false);
  });
  it("compares revisions", () => {
    expect(compareRevision("ABC", "abc")).toBe("current");
    expect(compareRevision("abc", "def")).toBe("update-available");
    expect(compareRevision("abc", null)).toBe("unknown");
  });
  it("validates repo ids and commits", () => {
    expect(isRepoId("bartowski/Llama-3.2-1B-Instruct-GGUF")).toBe(true);
    expect(isRepoId("../etc")).toBe(false);
    expect(
      parseCommits([{ id: "x", title: "t", date: null }, {}]),
    ).toHaveLength(1);
  });
});

describe("download decisions", () => {
  it("interprets range responses", () => {
    expect(interpretRange(206, 10, 100)).toBe("resume");
    expect(interpretRange(200, 10, 100)).toBe("restart");
    expect(interpretRange(416, 100, 100)).toBe("already-complete");
    expect(interpretRange(500, 0, 100)).toBe("error");
  });
  it("verifies against the LFS oid, git oid or size", () => {
    const lfs = { sha256: "aa", gitOid: null, size: 3 };
    expect(verifyDigest(lfs, 3, "aa", null)).toEqual({
      ok: true,
      kind: "sha256",
    });
    expect(verifyDigest(lfs, 3, "bb", null).ok).toBe(false);
    expect(verifyDigest(lfs, 2, "aa", null).ok).toBe(false);
    expect(
      verifyDigest({ sha256: null, gitOid: "cc", size: 1 }, 1, null, "cc"),
    ).toEqual({ ok: true, kind: "git-sha1" });
  });
});

describe("ollama metrics", () => {
  it("derives tokens per second from ns durations", () => {
    const metrics = computeMetrics(
      { eval_count: 100, eval_duration: 2e9, load_duration: 5e8 },
      320,
    );
    expect(metrics.tokensPerSecond).toBe(50);
    expect(metrics.loadMs).toBe(500);
    expect(metrics.ttftMs).toBe(320);
  });
  it("pull progress and hf names", () => {
    expect(pullFraction({ total: 200, completed: 50 })).toBe(0.25);
    expect(pullFraction({ status: "verifying" })).toBeNull();
    expect(hfPullName("a/b-GGUF", "Q4_K_M")).toBe("hf.co/a/b-GGUF:Q4_K_M");
  });
});
