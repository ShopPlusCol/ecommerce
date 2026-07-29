import { test, expect } from "@playwright/test";

/**
 * Prueba de humo de la Fase 1: confirma que la tienda navega entre las
 * páginas base. Los flujos críticos de compra (sección 41.3) se añaden en
 * la Fase 2, cuando exista carrito y checkout reales.
 */
test("navega del inicio al catálogo y a un producto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Ver catálogo" }).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);

  await page.getByRole("link", { name: "Amazon Brown" }).click();
  await expect(page).toHaveURL(/\/productos\/amazon-brown$/);
  await expect(page.getByRole("heading", { name: "Amazon Brown" })).toBeVisible();
});

test("el panel administrativo carga con navegación lateral", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pedidos" })).toBeVisible();
});
