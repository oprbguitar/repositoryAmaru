import { describe, expect, it } from "vitest";
import { isAdmin, needsAdmin } from "../worker/admin";
import { sanitizeSettings } from "../worker/public-ai";

const req = (method: string, path: string, headers?: HeadersInit) =>
  new Request(`https://amaru.test${path}`, { method, headers });

describe("admin gate", () => {
  it("keeps reading public and protects spending or writing", () => {
    const check = (method: string, path: string) =>
      needsAdmin(req(method, path), new URL(`https://amaru.test${path}`));
    expect(check("GET", "/api/models/rankings")).toBe(false);
    expect(check("GET", "/api/public-ai/status")).toBe(false);
    expect(check("POST", "/api/public-ai/chat")).toBe(false);
    expect(check("POST", "/api/admin/login")).toBe(false);
    expect(check("GET", "/api/admin/session")).toBe(false);
    expect(check("GET", "/api/admin/public-ai")).toBe(true);
    expect(check("GET", "/api/integrations")).toBe(true);
    expect(check("GET", "/api/developer-lab/providers")).toBe(true);
    expect(check("POST", "/api/sync")).toBe(true);
    expect(check("DELETE", "/api/laboratory/projects/x")).toBe(true);
  });

  it("treats local development as administrator and production as closed", async () => {
    const kv = {} as KVNamespace;
    expect(
      await isAdmin(req("GET", "/"), { APP_ENV: "development", CACHE: kv }),
    ).toBe(true);
    expect(
      await isAdmin(req("GET", "/"), {
        APP_ENV: "production",
        CACHE: kv,
        ADMIN_SESSION_SECRET: "s",
      }),
    ).toBe(false);
    expect(
      await isAdmin(
        req("GET", "/", { cookie: "amaru_admin=9999999999.forged" }),
        {
          APP_ENV: "production",
          CACHE: kv,
          ADMIN_SESSION_SECRET: "s",
        },
      ),
    ).toBe(false);
  });
});

describe("public AI settings", () => {
  it("clamps limits and rejects unknown models", () => {
    const settings = sanitizeSettings({
      dailyLimit: 999,
      globalDailyCap: -5,
      model: "@cf/evil/model",
      enabled: "yes",
    });
    expect(settings.dailyLimit).toBe(20);
    expect(settings.globalDailyCap).toBe(0);
    expect(settings.model).toBe("@cf/meta/llama-3.2-3b-instruct");
    expect(settings.enabled).toBe(true);
  });
});
