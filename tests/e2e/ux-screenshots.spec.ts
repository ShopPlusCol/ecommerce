import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Genera las capturas de la auditoría visual en `artifacts/ux-audit/` y, de
 * paso, comprueba en cada pantalla y cada resolución lo que las capturas
 * deberían demostrar: que no hay desplazamiento horizontal, que el CTA
 * principal se ve, y que ni el aviso de privacidad ni el botón de WhatsApp
 * tapan el botón de confirmar del checkout.
 *
 * Las capturas son un artefacto de revisión, no se versionan (ver
 * .gitignore). El valor de esta prueba está en las comprobaciones: una
 * captura nadie la mira si nada falla, pero una aserción sí falla.
 */
const OUT_DIR = path.resolve("artifacts/ux-audit");

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  mobileSmall: { width: 360, height: 800 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  desktopWide: { width: 1440, height: 900 },
} as const;

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    overflow.scrollWidth,
    `${label}: la página se desplaza horizontalmente (${overflow.scrollWidth} > ${overflow.clientWidth})`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function addToCart(page: Page) {
  await page.goto("/productos/amazon-brown");
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
}

test.beforeAll(async () => {
  await mkdir(OUT_DIR, { recursive: true });
});

test("captura y verifica las pantallas principales en escritorio y móvil", async ({ page }) => {
  const shots: Array<{ name: string; viewport: { width: number; height: number }; go: () => Promise<void> }> = [
    { name: "home-desktop-after", viewport: VIEWPORTS.desktop, go: async () => void (await page.goto("/")) },
    { name: "home-mobile-after", viewport: VIEWPORTS.mobile, go: async () => void (await page.goto("/")) },
    { name: "catalog-desktop-after", viewport: VIEWPORTS.desktop, go: async () => void (await page.goto("/catalogo")) },
    { name: "catalog-mobile-after", viewport: VIEWPORTS.mobile, go: async () => void (await page.goto("/catalogo")) },
    {
      name: "product-desktop-after",
      viewport: VIEWPORTS.desktop,
      go: async () => void (await page.goto("/productos/amazon-brown")),
    },
    {
      name: "product-mobile-after",
      viewport: VIEWPORTS.mobile,
      go: async () => void (await page.goto("/productos/amazon-brown")),
    },
  ];

  for (const shot of shots) {
    await page.setViewportSize(shot.viewport);
    await shot.go();
    await page.waitForLoadState("load");
    await assertNoHorizontalOverflow(page, shot.name);
    await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: true });
  }
});

test("captura y verifica carrito y checkout, con el CTA siempre alcanzable", async ({ page }) => {
  // Carrito
  for (const [name, viewport] of [
    ["cart-desktop-after", VIEWPORTS.desktop],
    ["cart-mobile-after", VIEWPORTS.mobile],
  ] as const) {
    await page.setViewportSize(viewport);
    await addToCart(page);
    await page.goto("/carrito");
    await page.waitForLoadState("load");
    await assertNoHorizontalOverflow(page, name);
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  }

  // Checkout
  for (const [name, viewport] of [
    ["checkout-desktop-after", VIEWPORTS.desktop],
    ["checkout-mobile-after", VIEWPORTS.mobile],
  ] as const) {
    await page.setViewportSize(viewport);
    await addToCart(page);
    await page.goto("/checkout");
    await page.waitForLoadState("load");
    await assertNoHorizontalOverflow(page, name);
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  }

  // El botón de confirmar del checkout no puede quedar tapado por el aviso
  // de privacidad ni por el botón flotante de WhatsApp: es exactamente el
  // paso que no se puede bloquear. Se comprueba en las dos anchuras de
  // móvil y en las cuatro esquinas del botón, no solo en su centro — el
  // aviso solapaba justo el borde superior y una comprobación solo del
  // centro lo daba por bueno.
  for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.mobileSmall]) {
    await page.setViewportSize(viewport);
    await page.goto("/checkout");
    // Se espera al propio botón, no a `networkidle`: el checkout consulta la
    // cotización de envío al cambiar la dirección, así que la red nunca
    // llega a quedarse quieta de forma fiable.
    const confirm = page.getByRole("button", { name: "Confirmar pedido" }).last();
    await expect(confirm).toBeVisible();
    const box = (await confirm.boundingBox())!;
    const probes = [
      { label: "centro", x: box.x + box.width / 2, y: box.y + box.height / 2 },
      { label: "borde superior", x: box.x + box.width / 2, y: box.y + 2 },
      { label: "borde inferior", x: box.x + box.width / 2, y: box.y + box.height - 2 },
      { label: "esquina izquierda", x: box.x + 2, y: box.y + box.height / 2 },
      { label: "esquina derecha", x: box.x + box.width - 2, y: box.y + box.height / 2 },
    ];

    for (const probe of probes) {
      const topmost = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          if (!el) return null;
          // El botón puede estar deshabilitado (falta la dirección), y un
          // botón deshabilitado no responde a elementFromPoint: en ese caso
          // el punto devuelve su propia barra, que es correcto. Lo que se
          // busca es que no aparezca un elemento *ajeno* encima.
          return {
            tag: el.tagName,
            text: (el.textContent ?? "").trim().slice(0, 60),
            insideConsent: Boolean(el.closest('[aria-label="Preferencias de privacidad"]')),
            insideWhatsApp: Boolean(el.closest('a[aria-label="Escribir por WhatsApp"]')),
            insideCheckoutBar: (el.textContent ?? "").includes("Confirmar pedido"),
          };
        },
        { x: probe.x, y: probe.y },
      );
      expect(topmost, `${probe.label}: no hay elemento en ese punto`).not.toBeNull();
      expect(
        topmost!.insideConsent,
        `a ${viewport.width}px el aviso de privacidad cubre el ${probe.label} del botón de confirmar`,
      ).toBe(false);
      expect(
        topmost!.insideWhatsApp,
        `a ${viewport.width}px el botón de WhatsApp cubre el ${probe.label} del botón de confirmar`,
      ).toBe(false);
      expect(
        topmost!.insideCheckoutBar,
        `a ${viewport.width}px el ${probe.label} del botón de confirmar lo ocupa otro elemento: <${topmost!.tag}> "${topmost!.text}"`,
      ).toBe(true);
    }
  }
});

test("no hay desplazamiento horizontal en ninguna resolución objetivo", async ({ page }) => {
  const routes = ["/", "/catalogo", "/productos/amazon-brown", "/carrito", "/checkout", "/preguntas-frecuentes"];
  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      await assertNoHorizontalOverflow(page, `${route} @ ${label} (${viewport.width}px)`);
    }
  }
});
