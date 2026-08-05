import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Ficha administrativa del pedido: origen (UTM), bloque copiable y cambio
 * directo de estado.
 *
 * Crea su propio pedido desde la tienda con parámetros de campaña, así que
 * no depende de que exista ninguno previo ni deja a otras pruebas
 * condicionadas.
 */
const CAMPAIGN = "prueba_validacion";
const UTM_URL = `/?utm_source=facebook&utm_medium=cpc&utm_campaign=${CAMPAIGN}&utm_content=anuncio1`;

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

/** Crea un pedido contraentrega llegando desde una URL con campaña. */
async function createOrderFromCampaign(page: Page, customerName: string) {
  await page.goto(UTM_URL);
  await page.goto("/productos/amazon-brown");
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByLabel("Nombre completo").fill(customerName);
  await page.getByLabel("Teléfono").fill("3001234567");
  await page.getByLabel("Departamento").fill("Antioquia");
  await page.getByRole("option", { name: "Antioquia" }).click();
  await page.getByLabel("Ciudad o municipio").fill("Medellín");
  await page.getByRole("option", { name: "Medellín" }).click();
  await page.getByLabel("Barrio o sector").fill("Laureles");
  await page.getByLabel("Dirección").fill("Calle 10 # 20-30");
  await expect(page.getByText(/Envío:/).first()).toBeVisible();
  await page.getByLabel(/Acepto los términos/).check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page).toHaveURL(/\/checkout\/confirmacion$/);
}

async function openOrderInAdmin(page: Page, customerName: string) {
  await login(page);
  await page.goto("/admin/pedidos");
  // Se busca por enlace al detalle, no por el número: el prefijo `TEST-`
  // solo lo añaden los entornos que no son producción, y el arnés de E2E
  // corre como producción sobre su propia base.
  await page.locator('a[href^="/admin/pedidos/"]').first().click();
  await expect(page).toHaveURL(/\/admin\/pedidos\/.+/);
  await expect(page.getByText(customerName).first()).toBeVisible();
}

test("la ficha muestra el origen del pedido y la información lista para copiar", async ({ page }) => {
  const customer = `Cliente Origen ${Date.now().toString(36)}`;

  await test.step("crea el pedido llegando desde una campaña", async () => {
    await createOrderFromCampaign(page, customer);
  });

  await test.step("abre el pedido en el panel", async () => {
    await openOrderInAdmin(page, customer);
  });

  await test.step("el origen de la campaña se ve en lenguaje humano", async () => {
    const origin = page.locator("section", { hasText: "Origen del pedido" }).first();
    await expect(origin).toBeVisible();
    await expect(origin).toContainText("Campaña");
    await expect(origin).toContainText(CAMPAIGN);
    await expect(origin).toContainText("facebook");
    // Nada de JSON crudo ni nombres de columna.
    await expect(origin).not.toContainText("utm_campaign");
    await expect(origin).not.toContainText("{");
  });

  await test.step("el bloque copiable respeta el orden y el formato", async () => {
    const copyArea = page.getByLabel("Información del pedido lista para copiar");
    await expect(copyArea).toBeVisible();
    const text = await copyArea.inputValue();

    const lines = text.split("\n");
    expect(lines[0]).toContain("Nombre completo:");
    expect(lines[1]).toContain("Teléfono:");
    expect(lines[2]).toContain("Dirección:");
    expect(lines[3]).toContain("Apartamento, torre, bloque:");
    expect(lines[4]).toContain("Barrio o sector:");
    expect(lines[5]).toContain("Ciudad o municipio, Departamento:");

    expect(text).toContain("Resumen del pedido:");
    expect(text).toContain("Total a pagar: $");
    expect(text).toContain("Pago ahora: $");
    expect(text).toContain("Pago al recibir: $");
    // Sin códigos técnicos.
    expect(text).not.toContain("cash_on_delivery");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
  });

  await test.step("el botón confirma visualmente que copió", async () => {
    await page.getByRole("button", { name: "Copiar información del pedido" }).click();
    // Sin permisos de portapapeles el componente cae al respaldo; en ambos
    // casos la persona recibe una respuesta, nunca silencio.
    await expect(
      page.getByRole("button", { name: "Información copiada" }).or(page.getByRole("alert")),
    ).toBeVisible();
  });
});

test("el estado del pedido salta directamente sin exigir una nota", async ({ page }) => {
  const customer = `Cliente Estado ${Date.now().toString(36)}`;
  await createOrderFromCampaign(page, customer);
  await openOrderInAdmin(page, customer);

  await test.step("el selector ofrece muchos estados, no solo el siguiente", async () => {
    const select = page.getByLabel("Nuevo estado");
    await expect(select).toBeVisible();
    const count = await select.locator("option").count();
    expect(count, "debe ofrecerse todo el catálogo de estados válidos").toBeGreaterThan(5);
    await expect(select.locator("option", { hasText: "Entregado" })).toHaveCount(1);
  });

  await test.step("no hay ningún campo de nota obligatorio", async () => {
    await expect(page.locator("textarea[name='note'][required]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Añadir una nota/ })).toBeVisible();
  });

  await test.step("salta de un estado inicial directamente a Entregado", async () => {
    // "Entregado" es delicado: confirma con un clic, sin pedir texto.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByLabel("Nuevo estado").selectOption({ label: "Entregado" });
    await page.getByRole("button", { name: "Guardar estado" }).click();

    await expect(page.getByText("Entregado").first()).toBeVisible();
  });

  await test.step("el historial registra el cambio con usuario y fecha", async () => {
    // `AdminRecordList` no envuelve en <section>; se ancla al encabezado.
    await expect(page.getByRole("heading", { name: "Historial de estados" })).toBeVisible();
    const row = page.locator("tr", { hasText: "Entregado" }).first();
    await expect(row).toBeVisible();
    // El usuario se muestra por nombre, no por identificador interno.
    await expect(row).not.toContainText(/\b[a-z0-9]{20,}\b/);
  });
});

test("la ficha del pedido es usable en móvil", async ({ page }) => {
  const customer = `Cliente Movil ${Date.now().toString(36)}`;
  await createOrderFromCampaign(page, customer);
  await openOrderInAdmin(page, customer);

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      overflow.scrollWidth,
      `la ficha del pedido se desplaza horizontalmente a ${viewport.width}px`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);

    await expect(page.getByRole("button", { name: "Copiar información del pedido" })).toBeVisible();
    await expect(page.getByLabel("Nuevo estado")).toBeVisible();
  }
});
