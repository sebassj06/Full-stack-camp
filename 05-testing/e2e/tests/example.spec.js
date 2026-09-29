// @ts-check
import { test, expect } from "@playwright/test";

// Lo mas recomendable es usar Roles
// etiquetas de texto, placeholders, nombres
// data-testid
// selectores de css como ultimo recurso
test("Buscar empleo y aplicar a una oferta", async ({ page }) => {
  await page.goto("http:localhost:5173");

  const searchInput = page.getByRole("searchbox");
  await searchInput.fill("react");
  await page.getByRole("button", { name: "Buscar" }).click();

  const jobCards = page.locator(".job-card");
  await expect(jobCards.first()).toBeVisible();

  const firstJobTitle = jobCards.first().locator("h3");
  await expect(firstJobTitle).toHaveText("Desarrollador de Software Senior");

  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  const applyButton = page.getByRole("button", { name: "Aplicar" }).first();
  await applyButton.click();

  page.getByRole("button", { name: "Aplicado" }).first();
});
