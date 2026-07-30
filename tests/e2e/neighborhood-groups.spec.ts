import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  const credentials = JSON.parse(await readFile(path.resolve(".data/e2e-credentials.json"), "utf8")) as {
    email: string;
    password: string;
  };
  await page.goto("/admin");
  await page.getByLabel("Correo").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function addToCartAndGoToCheckout(page: Page) {
  await page.goto("/productos/amazon-brown");
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

test("grupos de barrios: crear grupo, pegar barrios, fijar tarifa y verse en checkout (sección 17.5)", async ({ page }) => {
  await login(page);
  await page.goto("/admin/envios");
  const board = page.locator('[data-city="Medellín"]');
  await expect(board).toBeVisible();

  await board.getByPlaceholder("Nuevo grupo…").fill("Zona Oriente");
  await board.getByRole("button", { name: "+ Grupo" }).click();
  await expect(board.getByText("Grupo “Zona Oriente” creado.")).toBeVisible();

  await board.getByRole("tab", { name: /Zona Oriente/ }).click();
  await board.getByPlaceholder("Guayabal, Castropol").fill("Guayabal, Castropol");
  await board.getByRole("button", { name: "Añadir" }).click();
  await expect(board.getByRole("button", { name: "Quitar Guayabal" })).toBeVisible();
  await expect(board.getByRole("button", { name: "Quitar Castropol" })).toBeVisible();

  await board.locator('input[name="fee"]').fill("7000");
  await board.getByRole("button", { name: "Guardar tarifa" }).click();
  await expect(board.getByText("Tarifa del grupo guardada.")).toBeVisible();

  await addToCartAndGoToCheckout(page);
  await page.getByLabel("Departamento").selectOption({ label: "Antioquia" });
  await page.getByLabel("Ciudad o municipio").selectOption({ label: "Medellín" });
  // El desplegable de barrios llega vía fetch async tras elegir la ciudad;
  // se espera específicamente el <select> (rol "combobox"), no el <input>
  // de texto libre que se muestra brevemente mientras carga.
  const neighborhoodSelect = page.getByRole("combobox", { name: "Barrio o sector" });
  await expect(neighborhoodSelect).toBeVisible();
  await neighborhoodSelect.selectOption({ label: "Guayabal" });
  await expect(page.getByText("Envío: $7.000")).toBeVisible();
});

test("arrastrar una pastilla mueve el barrio a otro grupo", async ({ page }) => {
  await login(page);
  await page.goto("/admin/envios");
  const board = page.locator('[data-city="Medellín"]');

  await board.getByPlaceholder("Nuevo grupo…").fill("Zona Sur");
  await board.getByRole("button", { name: "+ Grupo" }).click();
  await board.getByRole("tab", { name: /Zona Sur/ }).click();
  await board.getByPlaceholder("Guayabal, Castropol").fill("Belén");
  await board.getByRole("button", { name: "Añadir" }).click();
  await expect(board.getByRole("button", { name: "Quitar Belén" })).toBeVisible();
  await expect(board.getByRole("tab", { name: /Zona Sur/ })).toContainText("1");

  const pill = board.getByTestId("neighborhood-pill").filter({ hasText: "Belén" });
  await pill.dragTo(board.getByRole("tab", { name: "Sin grupo" }));

  await expect(board.getByRole("button", { name: "Quitar Belén" })).toHaveCount(0);
  await board.getByRole("tab", { name: "Sin grupo" }).click();
  await expect(board.getByRole("button", { name: "Quitar Belén" })).toBeVisible();
});

test("sin cobertura: el barrio no se ofrece en el checkout", async ({ page }) => {
  await login(page);
  await page.goto("/admin/envios");
  const board = page.locator('[data-city="Medellín"]');
  await board.getByRole("tab", { name: "Sin cobertura" }).click();
  await board.getByPlaceholder("Guayabal, Castropol").fill("Zona Rural Lejana");
  await board.getByRole("button", { name: "Añadir" }).click();
  await expect(board.getByRole("button", { name: "Quitar Zona Rural Lejana" })).toBeVisible();

  await addToCartAndGoToCheckout(page);
  await page.getByLabel("Departamento").selectOption({ label: "Antioquia" });
  await page.getByLabel("Ciudad o municipio").selectOption({ label: "Medellín" });
  const neighborhoodSelect = page.getByRole("combobox", { name: "Barrio o sector" });
  await expect(neighborhoodSelect).toBeVisible();
  const options = await neighborhoodSelect.locator("option").allTextContents();
  expect(options).not.toContain("Zona Rural Lejana");
});

test("ciudad sin barrios configurados exige el barrio como texto obligatorio", async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  await page.getByLabel("Departamento").selectOption({ label: "Antioquia" });
  await page.getByLabel("Ciudad o municipio").selectOption({ label: "Bello" });
  const neighborhoodField = page.getByRole("textbox", { name: "Barrio o sector" });
  await expect(neighborhoodField).toBeVisible();
  await page.getByLabel("Nombre completo").fill("Cliente de prueba");
  await page.getByLabel("Teléfono").fill("3001234567");
  await page.getByLabel("Dirección").fill("Calle 1 # 2-3");
  await page.getByLabel(/Acepto los términos/).check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page.getByText("Escribe tu barrio o sector.")).toBeVisible();
});
