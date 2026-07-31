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

async function selectSearchable(page: Page, label: string, optionName: string) {
  // Usa el rol "combobox" (no getByLabel a secas): "Barrio o sector" alterna
  // entre un <input> de texto libre y un combobox con buscador según si la
  // ciudad tiene barrios configurados, y ese cambio puede llegar después de
  // que el resto del formulario ya está listo.
  const field = page.getByRole("combobox", { name: label });
  await field.waitFor({ state: "visible" });
  await field.fill(optionName);
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

test.describe.serial("árbol de zonas de envío (Departamento → Ciudad → Barrio, sección 17)", () => {
  const suffix = Date.now().toString(36);
  const departmentName = `Depto E2E ${suffix}`;
  const cityName = `Ciudad E2E ${suffix}`;
  const neighborhoodName = `Barrio E2E ${suffix}`;
  const blockedNeighborhoodName = `Sin Cobertura E2E ${suffix}`;

  test("el admin crea departamento, ciudad y barrio con tarifa propia", async ({ page }) => {
    await login(page);
    await page.goto("/admin/envios");

    await page.getByLabel("Nombre del departamento").fill(departmentName);
    await page.getByRole("button", { name: "Agregar" }).first().click();
    await expect(page.getByText(`Departamento "${departmentName}" creada.`)).toBeVisible();

    const departmentCard = page.locator(`[data-zone-name="${departmentName}"]`);
    await departmentCard.getByRole("link", { name: /Ver ciudades/ }).click();
    await expect(page.getByRole("heading", { name: departmentName })).toBeVisible();

    await page.getByLabel("Nombre de la ciudad/municipio").fill(cityName);
    await page.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByText(`Ciudad/Municipio "${cityName}" creada.`)).toBeVisible();

    await page.getByRole("link", { name: "Ver barrios (0) ›" }).click();
    await expect(page.getByRole("heading", { name: cityName })).toBeVisible();

    await page.getByLabel("Nombre del barrio").fill(neighborhoodName);
    await page.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByText(`Barrio "${neighborhoodName}" creada.`)).toBeVisible();

    // Barrio adicional que se marcará "sin cobertura" en la prueba siguiente.
    await page.getByLabel("Nombre del barrio").fill(blockedNeighborhoodName);
    await page.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByText(`Barrio "${blockedNeighborhoodName}" creada.`)).toBeVisible();

    // Ambos barrios nacen en el grupo "Con cobertura" del tablero de
    // pastillas (sección 2 de la Ronda 4). Configura primero la tarifa
    // compartida del grupo "Precio especial"...
    // El panel de "Precio especial" empieza abierto (a diferencia de "Sin
    // cobertura"), así que no hace falta hacer clic en "Configurar grupo".
    const specialPriceColumn = page.locator('[data-group="special_price"]');
    await specialPriceColumn.locator('input[name="fee"]').fill("7000");
    await specialPriceColumn.getByLabel("Mercado Pago").check();
    await specialPriceColumn.getByRole("button", { name: /Guardar y aplicar/ }).click();
    await expect(specialPriceColumn.getByText(/Configuración de "Precio especial" guardada/)).toBeVisible();

    // ...y mueve el barrio principal a ese grupo con su selector accesible.
    await page.getByRole("combobox", { name: `Mover "${neighborhoodName}" a otro grupo` }).selectOption("special_price");
    await expect(page.getByText(`"${neighborhoodName}" movido a "Precio especial".`)).toBeVisible();

    // El grupo "Sin cobertura" no requiere configuración previa para recibir barrios.
    await page.getByRole("combobox", { name: `Mover "${blockedNeighborhoodName}" a otro grupo` }).selectOption("no_coverage");
    await expect(page.getByText(`"${blockedNeighborhoodName}" movido a "Sin cobertura".`)).toBeVisible();
  });

  test("el checkout cotiza exactamente la tarifa propia configurada para el barrio", async ({ page }) => {
    await addToCartAndGoToCheckout(page);
    await selectSearchable(page, "Departamento", departmentName);
    await selectSearchable(page, "Ciudad o municipio", cityName);
    await selectSearchable(page, "Barrio o sector", neighborhoodName);
    await expect(page.getByText("Envío: $7.000")).toBeVisible();
  });

  test("un barrio marcado sin cobertura no cotiza, aunque siga siendo seleccionable", async ({ page }) => {
    await addToCartAndGoToCheckout(page);
    await selectSearchable(page, "Departamento", departmentName);
    await selectSearchable(page, "Ciudad o municipio", cityName);
    await selectSearchable(page, "Barrio o sector", blockedNeighborhoodName);
    // Mensaje global personalizable de "sin cobertura" (sección de Ronda 4),
    // que incluye el nombre del lugar resuelto.
    await expect(page.getByText(new RegExp(`cobertura.*${blockedNeighborhoodName}`, "i"))).toBeVisible();
  });

  test("limpieza: elimina el departamento de prueba y sus zonas hijas", async ({ page }) => {
    await login(page);
    await page.goto("/admin/envios");
    page.once("dialog", (dialog) => dialog.accept());
    const deptCard = page.locator(`[data-zone-name="${departmentName}"]`);
    await deptCard.getByRole("button", { name: "Eliminar zona" }).click();
    // El mensaje de éxito es transitorio (la revalidación puede reemplazarlo
    // casi de inmediato); lo que importa es que la zona ya no esté.
    await expect(page.getByRole("heading", { name: departmentName })).toHaveCount(0, { timeout: 10_000 });
  });
});

test("departamento sin ciudades configuradas: el checkout no pide ciudad y usa el barrio como texto libre", async ({ page }) => {
  await addToCartAndGoToCheckout(page);
  await selectSearchable(page, "Departamento", "Bogotá D.C.");
  await expect(page.getByLabel("Ciudad o municipio")).toHaveCount(0);
  const neighborhoodField = page.getByRole("textbox", { name: "Barrio o sector" });
  await expect(neighborhoodField).toBeVisible();
  await neighborhoodField.fill("Chapinero");
});
