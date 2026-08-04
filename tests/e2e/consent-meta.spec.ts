import { expect, test } from "@playwright/test";

/**
 * El consentimiento es la única barrera entre la tienda y los rastreadores
 * de terceros, así que se prueba en el navegador real y no solo por
 * unidades: lo que importa es que el script de Meta no llegue a existir en
 * la página, no que una función interna devuelva `false`.
 */
test("no se carga ningún rastreador de Meta antes de aceptar marketing", async ({ page }) => {
  await page.goto("/");

  const state = await page.evaluate(() => ({
    fbq: typeof (window as unknown as { fbq?: unknown }).fbq !== "undefined",
    script: Boolean(document.getElementById("meta-pixel-script")),
    facebookScripts: [...document.scripts].filter((s) => s.src.includes("facebook")).length,
    consentCookie: document.cookie.includes("shoppluscol_consent"),
  }));

  expect(state.fbq).toBe(false);
  expect(state.script).toBe(false);
  expect(state.facebookScripts).toBe(0);
  expect(state.consentCookie).toBe(false);
});

test("la decisión de privacidad se guarda y deja de preguntar", async ({ page }) => {
  await page.goto("/");

  const banner = page.getByRole("dialog", { name: "Preferencias de privacidad" });
  await expect(banner).toBeVisible();

  await banner.getByRole("button", { name: "Rechazar opcionales" }).click();
  await expect(banner).toBeHidden();

  // La cookie es lo que permite al servidor comprobar el consentimiento sin
  // fiarse de lo que diga el cliente.
  const cookie = await page.evaluate(() =>
    document.cookie.split("; ").find((c) => c.startsWith("shoppluscol_consent=")) ?? null,
  );
  expect(cookie).toContain("marketing");
  expect(decodeURIComponent(cookie ?? "")).toContain('"marketing":false');

  // Tras recargar no vuelve a preguntar, y sigue sin cargar nada de Meta.
  await page.reload();
  await expect(banner).toBeHidden();
  expect(await page.evaluate(() => Boolean(document.getElementById("meta-pixel-script")))).toBe(false);
});

test("se puede cambiar la decisión después, con categorías separadas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("dialog", { name: "Preferencias de privacidad" })
    .getByRole("button", { name: "Rechazar opcionales" })
    .click();

  await page.getByRole("button", { name: "Privacidad" }).click();
  const banner = page.getByRole("dialog", { name: "Preferencias de privacidad" });
  await expect(banner).toBeVisible();

  await banner.getByRole("button", { name: "Configurar" }).click();

  // Tres categorías separadas, y la necesaria siempre activa y no
  // desmarcable: es la diferencia entre un consentimiento real y un
  // "aceptar todo" disfrazado.
  const checkboxes = banner.getByRole("checkbox");
  await expect(checkboxes).toHaveCount(3);
  await expect(checkboxes.first()).toBeChecked();
  await expect(checkboxes.first()).toBeDisabled();
  await expect(banner.getByRole("button", { name: "Guardar preferencias" })).toBeVisible();
});
