import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getDeveloperLabProvider,
  providerChatBaseUrl,
} from "../lib/developer-lab/registry";
import {
  applyPiece,
  computeCost,
  computeMetrics,
  createAccumulator,
  decodeLabEvent,
  encodeSseEvent,
  NdjsonDecoder,
  parseNdjsonLine,
  parseSseMessage,
  SseDecoder,
  type StreamProtocol,
  streamProtocolFor,
} from "../lib/developer-lab/streaming";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", "developer-lab", name), "utf8");

/** Feeds a fixture in awkward 7-byte chunks to exercise split framing. */
function runSse(name: string, protocol: Exclude<StreamProtocol, "ollama">) {
  const text = fixture(name);
  const decoder = new SseDecoder();
  const acc = createAccumulator(0);
  let clock = 0;
  for (let index = 0; index < text.length; index += 7) {
    for (const message of decoder.push(text.slice(index, index + 7)))
      for (const piece of parseSseMessage(protocol, message))
        applyPiece(acc, piece, (clock += 10));
  }
  for (const message of decoder.flush())
    for (const piece of parseSseMessage(protocol, message))
      applyPiece(acc, piece, (clock += 10));
  return acc;
}

describe("SseDecoder", () => {
  it("handles CRLF, comments, multi-line data and missing trailing blank line", () => {
    const decoder = new SseDecoder();
    const out = [
      ...decoder.push(": keep-alive\r\nevent: a\r\ndata: one\r\n"),
      ...decoder.push("data: two\r\n\r\ndata: tail"),
      ...decoder.flush(),
    ];
    expect(out).toEqual([
      { event: "a", data: "one\ntwo" },
      { event: null, data: "tail" },
    ]);
  });
});

describe("OpenAI-compatible parsers (recorded fixtures)", () => {
  it("parses OpenRouter reasoning, text and provider cost", () => {
    const acc = runSse("openrouter.usage-option.sse.txt", "openai");
    expect(acc.reasoning.length).toBeGreaterThan(0);
    expect(acc.finishReason).toBe("length");
    expect(acc.usage.inputTokens).toBe(15);
    expect(acc.usage.outputTokens).toBe(40);
    expect(acc.usage.providerCostUsd).toBe(0);
    expect(acc.error).toBeNull();
  });

  it("parses Groq usage (sent twice) without double counting", () => {
    for (const name of ["groq.plain.sse.txt", "groq.usage-option.sse.txt"]) {
      const acc = runSse(name, "openai");
      expect(acc.usage).toMatchObject({
        inputTokens: 81,
        outputTokens: 40,
        reasoningTokens: 38,
      });
      expect(acc.finishReason).toBe("length");
      expect(acc.reasoning).toContain("The");
    }
  });

  it("parses Cohere compat text and only reports usage when requested", () => {
    const plain = runSse("cohere.plain.sse.txt", "openai");
    expect(plain.text.startsWith("¡H")).toBe(true);
    expect(plain.text.endsWith("laboratorio!")).toBe(true);
    expect(plain.usage.outputTokens).toBeNull();
    expect(plain.finishReason).toBe("stop");
    const withUsage = runSse("cohere.usage-option.sse.txt", "openai");
    expect(withUsage.usage).toMatchObject({
      inputTokens: 11,
      outputTokens: 27,
    });
  });
});

describe("Gemini parser", () => {
  it("concatenates parts and keeps the last cumulative usage", () => {
    const acc = runSse("gemini.sse.txt", "gemini");
    expect(acc.text.startsWith("hola mundo desde el laboratorio.")).toBe(true);
    expect(acc.text.endsWith("treinta")).toBe(true);
    expect(acc.usage).toMatchObject({ inputTokens: 23, outputTokens: 113 });
    expect(acc.finishReason).toBe("STOP");
  });
});

describe("Anthropic parser (synthetic fixture per documented format)", () => {
  it("reads message_start/message_delta usage and text deltas", () => {
    const acc = runSse("anthropic.synthetic.sse.txt", "anthropic");
    expect(acc.text).toBe("Hola desde el laboratorio.");
    expect(acc.usage).toMatchObject({ inputTokens: 21, outputTokens: 9 });
    expect(acc.finishReason).toBe("end_turn");
  });

  it("surfaces error events", () => {
    const pieces = parseSseMessage("anthropic", {
      event: "error",
      data: '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}',
    });
    expect(pieces).toEqual([{ kind: "error", message: "Overloaded" }]);
  });
});

describe("Ollama NDJSON parser (synthetic fixture)", () => {
  it("parses deltas and final counters across split lines", () => {
    const text = fixture("ollama.synthetic.ndjson.txt");
    const decoder = new NdjsonDecoder();
    const acc = createAccumulator(0);
    for (let index = 0; index < text.length; index += 11)
      for (const line of decoder.push(text.slice(index, index + 11)))
        for (const piece of parseNdjsonLine(line)) applyPiece(acc, piece, 5);
    for (const line of decoder.flush())
      for (const piece of parseNdjsonLine(line)) applyPiece(acc, piece, 5);
    expect(acc.text).toBe("Hola mundo");
    expect(acc.usage).toMatchObject({ inputTokens: 12, outputTokens: 3 });
    expect(acc.finishReason).toBe("stop");
  });
});

describe("metrics and cost", () => {
  it("computes TTFT and tokens/s from reported usage", () => {
    const acc = createAccumulator(1000);
    applyPiece(acc, { kind: "delta", channel: "text", text: "hola" }, 1250);
    applyPiece(
      acc,
      {
        kind: "usage",
        usage: {
          inputTokens: 10,
          outputTokens: 100,
          reasoningTokens: null,
          providerCostUsd: null,
        },
      },
      3000,
    );
    const metrics = computeMetrics(acc, 3250);
    expect(metrics).toEqual({
      latencyMs: 2250,
      ttftMs: 250,
      outputTokens: 100,
      tokensPerSecond: 50,
      estimated: false,
    });
  });

  it("marks chars/4 estimates while usage is unknown", () => {
    const acc = createAccumulator(0);
    applyPiece(
      acc,
      { kind: "delta", channel: "text", text: "x".repeat(40) },
      100,
    );
    expect(computeMetrics(acc, 1100)).toMatchObject({
      outputTokens: 10,
      tokensPerSecond: 10,
      estimated: true,
    });
  });

  it("prefers provider cost, then indexed prices, else explains", () => {
    const usage = {
      inputTokens: 1000,
      outputTokens: 2000,
      reasoningTokens: null,
      providerCostUsd: null,
    };
    expect(computeCost(usage, { input: 1, output: 2 }).costUsd).toBe(0.005);
    expect(
      computeCost({ ...usage, providerCostUsd: 0.42 }, { input: 1, output: 2 })
        .costUsd,
    ).toBe(0.42);
    expect(computeCost(usage, { input: null, output: 2 }).costUsd).toBeNull();
    expect(
      computeCost(usage, { input: null, output: null }, true).costUsd,
    ).toBe(0);
  });

  it("round-trips normalized events", () => {
    const encoded = encodeSseEvent({
      type: "delta",
      channel: "text",
      text: "a\nb",
    });
    const [message] = new SseDecoder().push(encoded);
    expect(decodeLabEvent(message)).toEqual({
      type: "delta",
      channel: "text",
      text: "a\nb",
    });
  });
});

describe("provider registry", () => {
  it("maps protocols and resolves chat base URLs", () => {
    expect(streamProtocolFor("anthropic")).toBe("anthropic");
    expect(streamProtocolFor("google-gemini")).toBe("gemini");
    expect(streamProtocolFor("ollama")).toBe("ollama");
    expect(streamProtocolFor("lm-studio")).toBe("openai");
    expect(streamProtocolFor("stability")).toBeNull();
    const cases: Record<string, string> = {
      perplexity: "https://api.perplexity.ai",
      zai: "https://api.z.ai/api/paas/v4",
      "dashscope-intl":
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      cohere: "https://api.cohere.ai/compatibility/v1",
      nebius: "https://api.tokenfactory.nebius.com/v1",
      "huggingface-router": "https://router.huggingface.co/v1",
    };
    for (const [id, base] of Object.entries(cases)) {
      const provider = getDeveloperLabProvider(id);
      expect(provider, id).not.toBeNull();
      if (provider) expect(providerChatBaseUrl(provider)).toBe(base);
      expect(streamProtocolFor(id)).toBe("openai");
    }
  });
});
