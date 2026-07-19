import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExternalEnv, SourceRow } from "../worker/external";
import { credentialConfigured, runAdapter } from "../worker/external";

const source = (values: Partial<SourceRow>): SourceRow => ({
  id: "openrouter",
  name: "OpenRouter",
  base_url: "https://openrouter.ai",
  endpoint: "https://openrouter.ai/api/v1/models",
  authentication_type: "none",
  secret_binding_name: null,
  adapter_name: "openrouter",
  status: "ready",
  ...values,
});

afterEach(() => vi.unstubAllGlobals());

describe("external adapters", () => {
  it("validates a real-shaped OpenRouter response through the fetch adapter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ id: "openai/test" }] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-ratelimit-remaining": "50",
          },
        }),
      ),
    );
    const result = await runAdapter(
      source({}),
      "2026-07-19T00:00:00.000Z",
      {} as ExternalEnv,
    );
    expect(result.records[0].externalId).toBe("openai/test");
    expect(result.rateLimitRemaining).toBe(50);
  });

  it("reports key-based sources as unconfigured when their binding is absent", () => {
    const keySource = source({
      id: "openai-api",
      authentication_type: "bearer",
      secret_binding_name: "OPENAI_API_KEY",
      adapter_name: "openai-api",
    });
    expect(credentialConfigured(keySource, {} as ExternalEnv)).toBe(false);
    expect(
      credentialConfigured(keySource, {
        OPENAI_API_KEY: "test",
      } as ExternalEnv),
    ).toBe(true);
  });

  it("surfaces rate-limit responses instead of converting them to empty success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("limited", {
          status: 429,
          headers: { "x-ratelimit-remaining": "0" },
        }),
      ),
    );
    await expect(
      runAdapter(source({}), "2026-07-19T00:00:00.000Z", {} as ExternalEnv),
    ).rejects.toMatchObject({ status: 429, rateLimitRemaining: 0 });
  });
});
