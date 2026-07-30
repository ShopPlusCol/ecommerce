import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

function syntheticMp4(): Buffer {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32BE(0x18, 0);
  bytes.write("ftyp", 4, "ascii");
  bytes.write("isom", 8, "ascii");
  return bytes;
}

test("el editor de producto acepta subir un video y lo muestra en la galería (sección 8.5)", async ({ page }) => {
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

  const uploadInput = page.getByLabel("Subir imágenes o videos del producto");
  await uploadInput.setInputFiles({ name: "clip.mp4", mimeType: "video/mp4", buffer: syntheticMp4() });

  await expect(page.getByText("Video", { exact: true })).toBeVisible();
  await expect(page.locator("video")).toBeVisible();
});
