import { expect, test } from "@playwright/test";

test("Developer Lab keeps the desktop shell fixed and exposes its workbench", async ({
  page,
}) => {
  await page.goto("/developer-lab");
  await expect(
    page.getByRole("heading", { name: "Laboratorio de APIs" }),
  ).toBeVisible();
  await expect(page.locator(".developer-provider-card")).toHaveCount(25);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        body: document.body.scrollHeight === document.body.clientHeight,
        horizontal:
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
      })),
    )
    .toEqual({ body: true, horizontal: true });

  await page.getByRole("button", { name: "Banco de pruebas" }).click();
  await expect(page.getByText("Área de resultado en vivo")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ejecutar prueba" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Dos laboratorios, dos propósitos"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Ocultar inspector" }).click();
  await expect(
    page.getByRole("button", { name: "Mostrar inspector" }),
  ).toBeVisible();
});

test("Developer Lab is usable in a mobile viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile project only");
  await page.goto("/developer-lab");
  await expect(page.locator(".developer-provider-card")).toHaveCount(25);
  await expect(
    page.getByRole("navigation", { name: "Navegación móvil" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        body: document.body.scrollHeight === document.body.clientHeight,
        horizontal:
          document.documentElement.scrollWidth ===
          document.documentElement.clientWidth,
        directoryScrolls: (() => {
          const element = document.querySelector(".developer-directory");
          return element ? element.scrollHeight > element.clientHeight : false;
        })(),
      })),
    )
    .toEqual({ body: true, horizontal: true, directoryScrolls: true });
});
