import { describe, expect, it } from "vitest";
import {
  buildSummaryPrompt,
  extractCardSections,
  mentionTerm,
} from "../lib/models/review";

const CARD = `---
license: apache-2.0
---
[![badge](https://img.shields.io/x.svg)](https://x)

# OLMo 2

OLMo 2 is a family of fully open language models trained by the Allen Institute for AI, released with data, code and weights.

## Uses

The model is intended for research on language models and for chat applications after fine-tuning.

## Training Data

Trained on the Dolma and OLMo-mix datasets, about 4 trillion tokens of English web, code and academic text.

## Evaluation

| Benchmark | Score |
|---|---|
| MMLU | 61 |

Results are reported against Llama 3.1 8B on standard academic benchmarks with comparable settings.

## Bias, Risks, and Limitations

Like any base language model, OLMo can produce harmful or factually incorrect output without safety tuning.
`;

describe("extractCardSections", () => {
  it("finds overview, uses, training, evaluation and limits", () => {
    const sections = extractCardSections(CARD);
    const keys = sections.map((s) => s.key);
    expect(keys).toEqual([
      "overview",
      "intended",
      "training",
      "evaluation",
      "outOfScope",
    ]);
    expect(sections[0].excerpt).toContain("fully open language models");
    expect(sections.find((s) => s.key === "evaluation")?.excerpt).not.toContain(
      "|",
    );
  });

  it("returns nothing for an empty card", () => {
    expect(extractCardSections("---\nlicense: mit\n---\n")).toEqual([]);
  });
});

describe("mention terms and prompt", () => {
  it("derives a family term", () => {
    expect(mentionTerm("OLMo-2-1124-7B-Instruct")).toBe("OLMo-2");
    expect(mentionTerm("phi-4")).toBe("phi-4");
    expect(mentionTerm("Qwen3.5-4B")).toBe("Qwen-3.5");
    expect(mentionTerm("7B")).toBeNull();
  });

  it("grounds the prompt in the card only", () => {
    const prompt = buildSummaryPrompt({
      id: "allenai/OLMo-2",
      pipelineTag: "text-generation",
      parameters: null,
      license: "apache-2.0",
      sections: extractCardSections(CARD),
    });
    expect(prompt).toContain("Texto de la ficha publicada por el autor");
    expect(prompt).toContain("Dolma");
  });
});
