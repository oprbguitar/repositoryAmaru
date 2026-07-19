import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { LocalLibraryPage } from "../src/features/local-library/LocalLibraryPage";

const server = setupServer(
  http.get("/api/status", () =>
    HttpResponse.json({
      data: {
        discovered: 0,
        processed: 0,
        rejected: 0,
        warnings: 0,
        unsupported: 0,
        lastScanAt: null,
        directoryAlias: "Biblioteca local",
        databaseStatus: "ready",
        objectStorageStatus: "ready",
        cacheStatus: "ready",
        types: [],
      },
      meta: { requestId: "test", generatedAt: "2026-07-18T00:00:00.000Z" },
    }),
  ),
  http.get("/api/local-library", () =>
    HttpResponse.json({
      data: [],
      meta: {
        requestId: "test",
        generatedAt: "2026-07-18T00:00:00.000Z",
        total: 0,
      },
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderLibrary() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/local-library"]}>
        <Routes>
          <Route path="/local-library" element={<LocalLibraryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("local library UI", () => {
  it("shows an honest empty state and preserves search in the URL-backed control", async () => {
    renderLibrary();
    expect(
      await screen.findByText("Aún no hay documentos indexados"),
    ).toBeInTheDocument();
    const search = screen.getByLabelText("Buscar archivos");
    fireEvent.change(search, { target: { value: "Perú" } });
    await waitFor(() => expect(search).toHaveValue("Perú"));
  });
});
