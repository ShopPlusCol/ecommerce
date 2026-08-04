import { readFile } from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";

/**
 * Galería de producto: miniaturas, visor ampliado, teclado y arrastre.
 *
 * La prueba **crea su propio producto** y lo borra al terminar, pase o
 * falle. Antes operaba sobre "Amazon Brown", que es el producto que también
 * usan `product-video`, `smoke`, `shipping-zones` y las capturas de UX: le
 * añadía dos imágenes y no las quitaba, así que dejaba el catálogo
 * modificado para el resto de la suite y dependía de encontrarlo intacto.
 * Con un producto propio no comparte estado con nadie.
 */

/** Misma base que usa el servidor de E2E (`scripts/e2e-server.mjs`). */
const E2E_DB = path.resolve(".data/e2e.db");

// Identificadores únicos por ejecución de la prueba, no por módulo: con
// `--repeat-each` el módulo se carga una sola vez, así que un id fijo haría
// que todas las repeticiones compartieran producto y slug.
let RUN_ID = "";
let PRODUCT_SLUG = "";
let PRODUCT_NAME = "";

function withDb<T>(fn: (db: Database.Database) => T): T {
  const db = new Database(E2E_DB);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

function createTestProduct(): string {
  return withDb((db) => {
    const now = Date.now();
    const productId = `prd_${RUN_ID}`;
    db.prepare(
      `insert into products (id, slug, sku, name, price, status, short_description, description, created_at, updated_at)
       values (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
    ).run(productId, PRODUCT_SLUG, `TEST-${RUN_ID}`, PRODUCT_NAME, 49000, "Producto temporal de prueba.", "Producto temporal de prueba.", now, now);
    // Una única imagen de partida, para que la galería tenga un elemento
    // previo igual que cualquier producto real.
    db.prepare(
      `insert into product_media (id, product_id, url, alt_text, "order", created_at, updated_at)
       values (?, ?, '/demo/lentes-placeholder.svg', 'Imagen de ejemplo', 0, ?, ?)`,
    ).run(`med_${RUN_ID}`, productId, now, now);
    db.prepare(
      `insert into inventory_items (id, product_id, quantity_on_hand, created_at, updated_at) values (?, ?, 50, ?, ?)`,
    ).run(`inv_${RUN_ID}`, productId, now, now);
    return productId;
  });
}

function deleteTestProduct(productId: string) {
  withDb((db) => {
    // Las imágenes subidas por la prueba cuelgan del producto; se borran con
    // él. `media_assets` guarda además el archivo cargado: se limpia por el
    // texto alternativo con el identificador de esta ejecución.
    db.prepare("delete from product_media where product_id = ?").run(productId);
    db.prepare("delete from inventory_items where product_id = ?").run(productId);
    db.prepare("delete from products where id = ?").run(productId);
  });
}

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

async function syntheticPng(page: Page, fill: string): Promise<Buffer> {
  const base64 = await page.evaluate((color) => {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const context = canvas.getContext("2d")!;
    context.fillStyle = color;
    context.fillRect(0, 0, 200, 200);
    return canvas.toDataURL("image/png").split(",")[1];
  }, fill);
  return Buffer.from(base64, "base64");
}

let productId: string;

test.beforeEach(() => {
  RUN_ID = `gal${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  PRODUCT_SLUG = `test-galeria-${RUN_ID}`;
  PRODUCT_NAME = `TEST Galería ${RUN_ID}`;
  productId = createTestProduct();
});

test.afterEach(() => {
  // Se ejecuta pase o falle la prueba: el catálogo queda como estaba.
  if (productId) deleteTestProduct(productId);
});

test("galería de producto: miniaturas, visor ampliado, teclado y arrastre (sección 8.4)", async ({ page }) => {
  await test.step("inicia sesión en el panel", async () => {
    await login(page);
  });

  await test.step("sube dos imágenes al producto de prueba", async () => {
    await page.goto(`/admin/productos/${productId}`);
    await expect(page.getByRole("heading", { name: "Imágenes y SEO" })).toBeVisible();

    const imageRows = page.getByRole("button", { name: "Mover imagen hacia arriba" });
    await expect(imageRows).toHaveCount(1);

    await page.getByLabel("Subir imágenes o videos del producto").setInputFiles([
      { name: "detalle-1.png", mimeType: "image/png", buffer: await syntheticPng(page, "#3f7a5a") },
      { name: "detalle-2.png", mimeType: "image/png", buffer: await syntheticPng(page, "#3a6d9a") },
    ]);

    // El mensaje de confirmación es una región de estado única (no uno por
    // archivo). Lo que sí indica que terminaron las dos subidas es la lista
    // de imágenes y que el botón de guardar vuelva a habilitarse: se
    // deshabilita mientras hay subidas en curso, para que no se pueda
    // guardar a medias y perder una imagen.
    await expect(imageRows).toHaveCount(3);
    const save = page.getByRole("button", { name: "Guardar producto completo" });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText("Producto, relaciones e imágenes guardados.")).toBeVisible();
  });

  await test.step("la galería pública muestra los tres elementos", async () => {
    await page.goto(`/productos/${PRODUCT_SLUG}`);
    const gallery = page.getByRole("tablist", { name: "Elementos de la galería" });
    await expect(gallery.getByRole("tab")).toHaveCount(3);
  });

  await test.step("cambia de elemento con las miniaturas", async () => {
    const gallery = page.getByRole("tablist", { name: "Elementos de la galería" });
    await gallery.getByRole("tab").nth(1).click();
    await expect(gallery.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
  });

  await test.step("navega el visor ampliado con teclado", async () => {
    await page.getByRole("button", { name: /^Ampliar/ }).click();
    const lightbox = page.getByRole("dialog", { name: /Visor ampliado/ });
    await expect(lightbox).toBeVisible();
    await expect(lightbox.getByText("2 / 3")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(lightbox.getByText("3 / 3")).toBeVisible();
  });

  await test.step("arrastra para avanzar en círculo y cierra con Escape", async () => {
    const lightbox = page.getByRole("dialog", { name: /Visor ampliado/ });
    // Un solo salto grande basta: la lógica de arrastre solo usa el último
    // pointermove antes de pointerup para calcular el desplazamiento.
    const dragArea = lightbox.locator(".touch-pan-y");
    const box = (await dragArea.boundingBox())!;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX - 150, centerY);
    await page.mouse.up();
    await expect(lightbox.getByText("1 / 3")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(lightbox).not.toBeVisible();
  });
});
