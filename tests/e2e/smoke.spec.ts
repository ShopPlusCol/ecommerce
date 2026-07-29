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

  await page.locator('a:visible', { hasText: "Amazon Brown" }).first().click();
  await expect(page).toHaveURL(/\/productos\/amazon-brown$/);
  await expect(page.getByRole("heading", { name: "Amazon Brown" })).toBeVisible();
});

test("el panel administrativo exige autenticación", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/acceso-admin/);
  await expect(page.getByRole("heading", { name: "Acceso administrativo" })).toBeVisible();
  await expect(page.getByLabel("Correo")).toBeVisible();
});

test("el propietario inicia y cierra sesión", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_PASSWORD, "Requiere credencial efímera de la base local.");
  await page.goto("/acceso-admin");
  await page.getByLabel("Correo").fill(process.env.E2E_ADMIN_EMAIL ?? "owner@shoppluscol.local");
  await page.getByLabel("Contraseña").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/acceso-admin$/);
});
