import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

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

test("galería de producto: miniaturas, visor ampliado, teclado y arrastre (sección 8.4)", async ({ page }) => {
  const credentials = JSON.parse(await readFile(path.resolve(".data/e2e-credentials.json"), "utf8")) as {
    email: string;
    password: string;
  };
  await page.goto("/admin");
  await page.getByLabel("Correo").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/productos");
  await page.getByRole("link", { name: "Amazon Brown" }).click();
  await expect(page.getByRole("heading", { name: "Imágenes y SEO" })).toBeVisible();

  // Cuántas imágenes tiene el producto ANTES de tocar nada. La prueba daba
  // por hecho que Amazon Brown empieza con exactamente una, pero ella misma
  // le añade dos y no las quita: repetida sobre la misma base fallaba
  // siempre (7 de 8 repeticiones), y en la suite completa quedaba a merced
  // de que nadie más hubiera tocado ese producto antes. Todo lo que sigue
  // se mide en relación a este número.
  const imageRows = page.getByRole("button", { name: "Mover imagen hacia arriba" });
  const initialImages = await imageRows.count();

  const uploadInput = page.getByLabel("Subir imágenes o videos del producto");
  await uploadInput.setInputFiles([
    { name: "detalle-1.png", mimeType: "image/png", buffer: await syntheticPng(page, "#3f7a5a") },
    { name: "detalle-2.png", mimeType: "image/png", buffer: await syntheticPng(page, "#3a6d9a") },
  ]);
  // El mensaje de confirmación es una región de estado única (no uno por
  // archivo), así que no sirve para saber si terminaron las dos subidas.
  // Lo que sí lo dice es la propia lista de imágenes del editor, y el botón
  // de guardar, que se deshabilita mientras hay subidas en curso para que
  // no se pueda guardar a medias.
  await expect(page.getByText("Imagen cargada y seleccionada.")).toBeVisible();
  await expect(imageRows).toHaveCount(initialImages + 2);
  const save = page.getByRole("button", { name: "Guardar producto completo" });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText("Producto, relaciones e imágenes guardados.")).toBeVisible();

  await page.goto("/productos/amazon-brown");
  const gallery = page.getByRole("tablist", { name: "Elementos de la galería" });
  const totalItems = initialImages + 2;
  await expect(gallery.getByRole("tab")).toHaveCount(totalItems);

  // Cambiar de elemento haciendo clic en una miniatura.
  await gallery.getByRole("tab").nth(1).click();
  await expect(gallery.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");

  // Abrir el visor ampliado y navegar con teclado.
  await page.getByRole("button", { name: /^Ampliar/ }).click();
  const lightbox = page.getByRole("dialog", { name: /Visor ampliado/ });
  await expect(lightbox).toBeVisible();
  await expect(lightbox.getByText(`2 / ${totalItems}`)).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(lightbox.getByText(`3 / ${totalItems}`)).toBeVisible();

  // Arrastrar hacia la izquierda avanza un elemento, en círculo. Se calcula
  // cuál toca en vez de fijar "1 / 3": con otro número de imágenes el
  // avance desde la 3 no vuelve al principio.
  const afterDrag = 3 + 1 > totalItems ? 1 : 4;
  const dragArea = lightbox.locator(".touch-pan-y");
  const box = (await dragArea.boundingBox())!;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX - 150, centerY);
  await page.mouse.up();
  await expect(lightbox.getByText(`${afterDrag} / ${totalItems}`)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(lightbox).not.toBeVisible();
});
