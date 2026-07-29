import { readFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function syntheticPng(page: Page, size = 640) {
  const base64 = await page.evaluate((canvasSize) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#ead5c5";
    context.fillRect(0, 0, canvasSize, canvasSize);
    context.fillStyle = "#49352d";
    context.beginPath();
    context.arc(canvasSize * 0.38, canvasSize * 0.43, canvasSize * 0.035, 0, Math.PI * 2);
    context.arc(canvasSize * 0.62, canvasSize * 0.43, canvasSize * 0.035, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#6b3b35";
    context.lineWidth = 8;
    context.beginPath();
    context.arc(canvasSize * 0.5, canvasSize * 0.57, canvasSize * 0.12, 0.2, Math.PI - 0.2);
    context.stroke();
    return canvas.toDataURL("image/png").split(",")[1];
  }, size);
  return Buffer.from(base64, "base64");
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("shoppluscol.e2e.initialized")) {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.sessionStorage.setItem("shoppluscol.e2e.initialized", "true");
      window.localStorage.setItem(
        "shoppluscol.consent.v1",
        JSON.stringify({ analytics: false, marketing: false }),
      );
    }
  });
});

test("navega del inicio al catálogo y a un producto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Ver catálogo" }).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await page.locator("a:visible", { hasText: "Amazon Brown" }).first().click();
  await expect(page).toHaveURL(/\/productos\/amazon-brown$/);
  await expect(page.getByRole("heading", { name: "Amazon Brown" })).toBeVisible();
});

test("crea un pedido y adjunta un comprobante sin perder la confirmación", async ({ page }) => {
  await page.goto("/productos/amazon-brown");
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByLabel("Nombre completo").fill("Cliente Prueba");
  await page.getByLabel("Teléfono").fill("3001234567");
  await page.getByLabel("Correo (opcional)").fill("cliente@example.test");
  await page.getByLabel("Departamento").selectOption({ label: "Cundinamarca" });
  await page.getByLabel("Ciudad o municipio").selectOption({ label: "Bogotá" });
  await page.getByLabel("Dirección").fill("Calle 10 # 20-30");
  await expect(page.getByText(/Envío:/).first()).toBeVisible();
  await page.getByLabel(/Acepto los términos/).check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmacion$/);
  await expect(page.getByRole("heading", { name: "¡Gracias por tu pedido!" })).toBeVisible();
  await expect(page.getByText("Pedido registrado")).toBeVisible();
  const proof = await syntheticPng(page, 64);
  await page.locator('input[name="proof"]').setInputFiles({
    name: "comprobante-e2e.png",
    mimeType: "image/png",
    buffer: proof,
  });
  await page.getByRole("button", { name: "Enviar comprobante" }).click();
  await expect(page.getByText(/Comprobante recibido/).last()).toBeVisible();
  await expect(page.getByRole("heading", { name: "¡Gracias por tu pedido!" })).toBeVisible();
});

test("el simulador exige consentimiento, procesa localmente y permite eliminar la foto", async ({
  page,
}) => {
  await page.route("**/face_landmarker.task", (route) => route.abort());
  await page.goto("/productos/amazon-brown");
  await page.getByRole("button", { name: "Abrir simulador" }).click();
  await expect(page.getByRole("heading", { name: "Simulador por fotografía" })).toBeVisible();

  const input = page.locator('input[type="file"][accept*="image/jpeg"]');
  await expect(input).toBeDisabled();
  await page.getByLabel(/Autorizo el procesamiento temporal/).check();
  await expect(input).toBeEnabled();
  const photo = await syntheticPng(page);
  await input.setInputFiles({ name: "rostro-local.png", mimeType: "image/png", buffer: photo });
  await expect(page.locator("canvas")).toBeVisible();
  const processingStatus = page.locator('p[role="status"][aria-live="polite"]');
  await expect(processingStatus).not.toContainText("Procesando", { timeout: 30_000 });
  await page.getByRole("button", { name: "Eliminar foto" }).click();
  await expect(processingStatus).toContainText("Foto eliminada del navegador");
  await expect(page.getByText("Subir o tomar una foto frontal")).toBeVisible();
});

test("la accesibilidad de los flujos públicos no tiene violaciones axe serias o críticas", async ({
  page,
}) => {
  for (const route of ["/", "/catalogo", "/productos/amazon-brown", "/privacidad"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = result.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    expect(blocking, `${route}: ${blocking.map((violation) => violation.id).join(", ")}`).toEqual([]);
  }
});

test("la tienda no desborda horizontalmente en móvil ni escritorio", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/catalogo", "/productos/amazon-brown", "/checkout"]) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} a ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("el administrador no desborda en las resoluciones operativas", async ({ page }) => {
  test.setTimeout(180_000);
  const credentials = JSON.parse(
    await readFile(path.resolve(".data/e2e-credentials.json"), "utf8"),
  ) as { email: string; password: string };
  await page.goto("/admin");
  await page.getByLabel("Correo").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  const routes = [
    "/admin",
    "/admin/productos/edicion-masiva",
    "/admin/inventario",
    "/admin/envios",
    "/admin/editor",
    "/admin/analitica",
    "/admin/integraciones",
    "/admin/usuarios",
    "/admin/auditoria",
    "/admin/configuracion",
    "/admin/estado",
    "/admin/simulador",
  ];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} a ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("el administrador inicia sesión, consulta estado y exporta datos", async ({ page }) => {
  const credentials = JSON.parse(
    await readFile(path.resolve(".data/e2e-credentials.json"), "utf8"),
  ) as { email: string; password: string };
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/acceso-admin/);
  await page.getByLabel("Correo").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/estado");
  await expect(page.getByRole("heading", { name: "Estado del sistema" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.goto("/admin/configuracion");
  await page.getByRole("link", { name: "Exportar datos de negocio" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^shoppluscol-export-\d{4}-\d{2}-\d{2}\.json$/);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/acceso-admin$/, { timeout: 10_000 });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/acceso-admin$/);
});

test("el propietario puede restablecer pedidos y clientes con confirmación reforzada", async ({ page }) => {
  const credentials = JSON.parse(
    await readFile(path.resolve(".data/e2e-credentials.json"), "utf8"),
  ) as { email: string; password: string };
  await page.goto("/admin");
  await page.getByLabel("Correo").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/pedidos");
  await expect(page.getByRole("button", { name: "Limpiar todos los pedidos" })).toBeDisabled();
  await page.getByLabel("Escribe BORRAR TODOS LOS PEDIDOS para confirmar").fill("BORRAR TODOS LOS PEDIDOS");
  await page.getByLabel(/Comprendo que estos datos/).check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Limpiar todos los pedidos" }).click();
  await expect(page.getByText(/pedido\(s\) eliminados/)).toBeVisible();
  await expect(page.getByText("0 pedidos reales.")).toBeVisible();

  await page.goto("/admin/clientes");
  await expect(page.getByRole("button", { name: "Limpiar todos los clientes" })).toBeDisabled();
  await page.getByLabel("Escribe BORRAR TODOS LOS CLIENTES para confirmar").fill("BORRAR TODOS LOS CLIENTES");
  await page.getByLabel(/Comprendo que estos datos/).check();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Limpiar todos los clientes" }).click();
  await expect(page.getByText(/cliente\(s\).*eliminados/)).toBeVisible();
  await expect(page.getByText("Todavía no hay clientes.")).toBeVisible();
});
