import { expect, test } from "@playwright/test";

test("opens the local library and a safe document preview", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Desktop journey is covered separately from the mobile shell check",
  );
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Hoy" })).toBeVisible();
  await page.getByRole("link", { name: "Biblioteca local" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Mi biblioteca local" }),
  ).toBeVisible();
  await expect(page.getByText("README.md").first()).toBeVisible();
  await page
    .getByRole("button", { name: /Previsualizar/ })
    .first()
    .click();
  await expect(page.getByText("Documento seleccionado")).toBeVisible();
  await expect(page.getByText(/C:\\/)).toHaveCount(0);
});

test("desktop shell keeps body scrolling disabled", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop-only shell assertion");
  await page.goto("/local-library");
  const overflow = await page
    .locator("body")
    .evaluate((body) => getComputedStyle(body).overflow);
  expect(overflow).toBe("hidden");
});

test("mobile navigation remains usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only assertion");
  await page.goto("/local-library");
  await expect(
    page.getByRole("navigation", { name: "Navegación móvil" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mi biblioteca local" }),
  ).toBeVisible();
});
