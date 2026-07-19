import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEVELOPER_LAB_PROVIDERS } from "../lib/developer-lab/registry";
import { DeveloperLabPage } from "../src/features/developer-lab/DeveloperLabPage";

const provider = {
  id: "groq",
  name: "Groq",
  location: "cloud" as const,
  categories: ["text" as const, "reasoning" as const],
  credentialBinding: "GROQ_API_KEY",
  credential: {
    providerId: "groq",
    alias: "GROQ_API_KEY",
    lastFour: "1234",
    state: "configured" as const,
    storage: "environment" as const,
    verifiedAt: null,
    lastTestedAt: null,
    createdAt: null,
    updatedAt: null,
  },
  modelCount: 0,
  lastSuccessfulTest: null,
  supports: {
    modelDiscovery: true,
    streaming: true,
    usageMetadata: true,
    quotaInspection: false,
    fileUpload: false,
    asyncJobs: false,
  },
  links: {
    documentation: "https://console.groq.com/docs",
    pricing: "https://groq.com/pricing/",
    apiKey: "https://console.groq.com/keys",
  },
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DeveloperLabPage />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("Developer Lab foundation", () => {
  it("registers every provider once and never uses browser-visible secret bindings", () => {
    const ids = DEVELOPER_LAB_PROVIDERS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of DEVELOPER_LAB_PROVIDERS) {
      expect(item.credentialBinding ?? "").not.toMatch(
        /^(VITE_|PUBLIC_|NEXT_PUBLIC_)/,
      );
      expect(item.documentationUrl).toMatch(/^https:\/\//);
    }
  });

  it("shows only masked credential metadata and switches to the workbench", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [provider],
          meta: { requestId: "test", generatedAt: "2026-07-19T00:00:00Z" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    renderPage();
    expect(await screen.findByText("Groq")).toBeInTheDocument();
    expect(screen.getByText("•••• 1234")).toBeInTheDocument();
    expect(screen.queryByText(/gsk-/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Banco de pruebas/i }));
    expect(screen.getByText("Área de resultado en vivo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ejecutar prueba/i }),
    ).toBeDisabled();
  });

  it("tests a configured provider only after an explicit click", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [provider],
            meta: { requestId: "list", generatedAt: "2026-07-19T00:00:00Z" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              providerId: "groq",
              state: "connection_verified",
              ok: true,
              httpStatus: 200,
              latencyMs: 42,
              modelCount: 3,
              requestId: "connection",
              testedAt: "2026-07-19T00:00:00Z",
              message: "Conexión verificada; 3 modelos visibles.",
            },
            meta: { requestId: "test", generatedAt: "2026-07-19T00:00:00Z" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [provider],
            meta: { requestId: "refresh", generatedAt: "2026-07-19T00:00:00Z" },
          }),
          { status: 200 },
        ),
      );
    renderPage();
    const button = await screen.findByRole("button", {
      name: /Probar conexión/i,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/groq/test");
  });
});
