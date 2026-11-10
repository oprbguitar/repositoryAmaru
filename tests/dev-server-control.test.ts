import { describe, expect, it } from "vitest";
import {
  evaluateShutdownRequest,
  isLoopbackAddress,
} from "../scripts/dev-server-control";

const valid = {
  method: "POST",
  remoteAddress: "127.0.0.1",
  headers: { "x-amaru-csrf": "local-ui", origin: "http://127.0.0.1:5174" },
};

describe("isLoopbackAddress", () => {
  it("accepts IPv4, IPv6 and IPv4-mapped loopback", () => {
    expect(isLoopbackAddress("127.0.0.1")).toBe(true);
    expect(isLoopbackAddress("::1")).toBe(true);
    expect(isLoopbackAddress("::ffff:127.0.0.1")).toBe(true);
  });

  it("rejects LAN, public and missing addresses", () => {
    expect(isLoopbackAddress("192.168.1.20")).toBe(false);
    expect(isLoopbackAddress("8.8.8.8")).toBe(false);
    expect(isLoopbackAddress("127.0.0.1.evil")).toBe(false);
    expect(isLoopbackAddress(undefined)).toBe(false);
    expect(isLoopbackAddress(null)).toBe(false);
  });
});

describe("evaluateShutdownRequest", () => {
  it("allows a local POST from the UI", () => {
    expect(evaluateShutdownRequest(valid)).toEqual({ allowed: true });
    expect(
      evaluateShutdownRequest({
        ...valid,
        remoteAddress: "::1",
        headers: { "x-amaru-csrf": "local-ui" },
      }),
    ).toEqual({ allowed: true });
  });

  it("only accepts POST", () => {
    expect(evaluateShutdownRequest({ ...valid, method: "GET" })).toMatchObject({
      allowed: false,
      status: 405,
    });
  });

  it("rejects non-loopback peers", () => {
    expect(
      evaluateShutdownRequest({ ...valid, remoteAddress: "10.0.0.5" }),
    ).toMatchObject({ allowed: false, reason: "not_loopback" });
  });

  it("requires the CSRF header with the exact value", () => {
    expect(evaluateShutdownRequest({ ...valid, headers: {} })).toMatchObject({
      allowed: false,
      reason: "missing_csrf_header",
    });
    expect(
      evaluateShutdownRequest({
        ...valid,
        headers: { "x-amaru-csrf": "other" },
      }),
    ).toMatchObject({ allowed: false, reason: "missing_csrf_header" });
  });

  it("rejects requests forwarded by the share proxy or any proxy", () => {
    for (const header of [
      "x-amaru-via-share",
      "x-forwarded-for",
      "forwarded",
    ]) {
      expect(
        evaluateShutdownRequest({
          ...valid,
          headers: { ...valid.headers, [header]: "1" },
        }),
      ).toMatchObject({ allowed: false, reason: "proxied_request" });
    }
  });

  it("rejects a foreign browser origin", () => {
    expect(
      evaluateShutdownRequest({
        ...valid,
        headers: { ...valid.headers, origin: "https://evil.example" },
      }),
    ).toMatchObject({ allowed: false, reason: "foreign_origin" });
    expect(
      evaluateShutdownRequest({
        ...valid,
        headers: { ...valid.headers, origin: "http://localhost:5174" },
      }),
    ).toEqual({ allowed: true });
  });
});
