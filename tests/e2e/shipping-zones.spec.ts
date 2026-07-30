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
  await page.getByLabel(label).fill(optionName);
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

    const departmentCard = page.locator("div", { has: page.getByRole("heading", { name: departmentName, exact: true }) }).first();
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

    // Tarifa propia en el barrio principal.
    const barrioCard = page.locator("div", { has: page.getByRole("heading", { name: neighborhoodName, exact: true }) }).first();
    await barrioCard.getByText("Configurar").click();
    const feeForm = barrioCard.locator('form:has(input[name="fee_mode"])');
    await feeForm.locator('input[name="fee_mode"][value="custom"]').check();
    await feeForm.locator('input[name="fee"]').fill("7000");
    await feeForm.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(feeForm.getByText(`"${neighborhoodName}" guardada.`)).toBeVisible();

    // Sin cobertura en el barrio bloqueado.
    const blockedCard = page.locator("div", { has: page.getByRole("heading", { name: blockedNeighborhoodName, exact: true }) }).first();
    await blockedCard.getByText("Configurar").click();
    const coverageForm = blockedCard.locator('form:has(input[name="fee_mode"])');
    await coverageForm.locator('input[name="coverage_mode"][value="custom"]').check();
    await coverageForm.locator('select[name="coverage"]').selectOption("unavailable");
    await coverageForm.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(coverageForm.getByText(`"${blockedNeighborhoodName}" guardada.`)).toBeVisible();
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
    await expect(page.getByText(/Cotización requerida/)).toBeVisible();
  });

  test("limpieza: elimina el departamento de prueba y sus zonas hijas", async ({ page }) => {
    await page.goto("/admin/envios");
    page.once("dialog", (dialog) => dialog.accept());
    const deptCard = page.locator("div", { has: page.getByRole("heading", { name: departmentName, exact: true }) }).first();
    await deptCard.getByRole("button", { name: "Eliminar zona" }).click();
    await expect(page.getByRole("heading", { name: departmentName })).toHaveCount(0);
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
