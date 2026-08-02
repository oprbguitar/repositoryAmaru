import { describe, expect, it } from "vitest";
import { normalizeFacebookVideos } from "../lib/external/facebook-videos";
import {
  INTEGRATION_BINDINGS,
  INTEGRATIONS,
} from "../lib/integrations/catalog";

const page = { id: "1234", name: "Observatorio AMARU" };

describe("Meta Graph API videos", () => {
  it("normaliza los campos oficiales y resuelve el enlace permanente", () => {
    const videos = normalizeFacebookVideos(
      {
        data: [
          {
            id: "999",
            title: "Presentación del observatorio",
            description: "Resumen de la sesión",
            created_time: "2026-07-30T15:04:05+0000",
            permalink_url: "/AmaruAI/videos/999/",
            picture: "https://scontent.xx.fbcdn.net/v/t15/999.jpg",
            length: 754.32,
            views: 1200,
          },
        ],
      },
      page,
    );
    expect(videos).toHaveLength(1);
    expect(videos[0]).toMatchObject({
      platform: "facebook",
      externalId: "999",
      title: "Presentación del observatorio",
      pageName: "Observatorio AMARU",
      watchUrl: "https://www.facebook.com/AmaruAI/videos/999/",
      durationSeconds: 754,
      viewCount: 1200,
    });
    expect(videos[0].publishedAt).toBe("2026-07-30T15:04:05.000Z");
  });

  it("no inventa métricas ausentes y cae al primer renglón de la descripción", () => {
    const videos = normalizeFacebookVideos(
      { data: [{ id: "1", description: "Demo en vivo\nsegunda línea" }] },
      page,
    );
    expect(videos[0].title).toBe("Demo en vivo");
    expect(videos[0].viewCount).toBeNull();
    expect(videos[0].durationSeconds).toBeNull();
    expect(videos[0].publishedAt).toBeNull();
    expect(videos[0].thumbnailUrl).toBeNull();
    expect(videos[0].watchUrl).toBe("https://www.facebook.com/watch/?v=1");
  });

  it("devuelve vacío ante una respuesta que no cumple el contrato", () => {
    expect(normalizeFacebookVideos({ error: "invalid token" }, page)).toEqual(
      [],
    );
  });
});

describe("catálogo de integraciones", () => {
  it("no repite bindings y todas las entradas enlazan a su origen", () => {
    expect(new Set(INTEGRATION_BINDINGS).size).toBe(
      INTEGRATION_BINDINGS.length,
    );
    for (const integration of INTEGRATIONS) {
      expect(integration.apiKeyUrl.startsWith("https://")).toBe(true);
      expect(integration.documentationUrl.startsWith("https://")).toBe(true);
    }
  });

  it("las pruebas de conexión no filtran la credencial en texto plano", () => {
    for (const integration of INTEGRATIONS) {
      if (!integration.probe) continue;
      const url = integration.probe.url("clave con espacios/&raros");
      // Si la clave viaja en la URL debe ir codificada; si no, va en cabecera.
      expect(url).not.toContain("clave con espacios/&raros");
    }
  });
});
