/**
 * Auditoría de contenido comercial: detecta lo que hace que la tienda
 * prometa o muestre algo que no corresponde. Es de SOLO LECTURA — reporta,
 * nunca corrige, porque casi todos estos hallazgos necesitan una decisión
 * humana (qué tono es realmente ese lente, qué fotografía le corresponde).
 *
 *   node scripts/audit-content.mjs [--json]
 *
 * Sale con código 1 si hay hallazgos de severidad "alta", para poder
 * usarlo como control antes de publicar.
 */
import Database from "better-sqlite3";
import { resolve } from "node:path";

const AS_JSON = process.argv.includes("--json");
const DB_PATH = process.env.DATABASE_PATH ?? resolve(".data/local.db");
const PLACEHOLDER = /\/demo\/|placeholder/i;

const db = new Database(DB_PATH, { readonly: true });
const findings = [];

function add(severity, kind, subject, detail) {
  findings.push({ severity, kind, subject, detail });
}

const products = db
  .prepare(
    `select p.id, p.name, p.slug, p.status, p.price, p.compare_at_price,
            cf.name as family,
            (select count(*) from product_media m where m.product_id = p.id) as image_count,
            (select group_concat(m.url) from product_media m where m.product_id = p.id) as urls
     from products p
     left join color_families cf on cf.id = p.color_family_id`,
  )
  .all();

const families = db.prepare("select name from color_families").all().map((f) => f.name);

// Cuenta cuántos productos distintos usan cada imagen: una misma foto en
// varios productos casi siempre significa que faltan fotos reales.
const urlUsage = new Map();
for (const product of products) {
  for (const url of (product.urls ?? "").split(",").filter(Boolean)) {
    if (!urlUsage.has(url)) urlUsage.set(url, []);
    urlUsage.get(url).push(product.name);
  }
}

for (const product of products) {
  const urls = (product.urls ?? "").split(",").filter(Boolean);

  if (product.image_count === 0) {
    add("alta", "producto_sin_imagen", product.name, "No tiene ninguna imagen cargada.");
  } else if (urls.every((url) => PLACEHOLDER.test(url))) {
    add(
      "alta",
      "producto_solo_placeholder",
      product.name,
      `Solo tiene imagen de ejemplo (${urls.join(", ")}). Se muestra como si fuera el producto real.`,
    );
  }

  // Slug que no describe el producto (p. ej. quedó un número al crearlo).
  if (/^\d+$/.test(product.slug)) {
    add(
      "alta",
      "slug_invalido",
      product.name,
      `Su URL es "/productos/${product.slug}", que no describe el producto y perjudica el SEO y los enlaces de anuncios.`,
    );
  }

  // El nombre menciona un tono distinto al de su familia asignada.
  if (product.family) {
    const name = product.name.toLowerCase();
    const mentioned = families.filter((family) => {
      const token = family.split("/")[0].trim().toLowerCase();
      return token.length > 3 && name.includes(token);
    });
    if (mentioned.length && !mentioned.some((f) => f === product.family)) {
      add(
        "alta",
        "nombre_vs_familia",
        product.name,
        `Su nombre sugiere "${mentioned.join(", ")}" pero está clasificado en "${product.family}". Requiere confirmación humana: no se deduce el tono automáticamente.`,
      );
    }
  }

  // Un precio "antes" que no supera al actual sería un descuento inventado.
  if (product.compare_at_price !== null && product.compare_at_price <= product.price) {
    add(
      "alta",
      "descuento_invalido",
      product.name,
      `Precio anterior (${product.compare_at_price}) no es mayor que el actual (${product.price}): el descuento mostrado sería falso.`,
    );
  }
}

for (const [url, users] of urlUsage) {
  if (users.length > 1) {
    add(
      PLACEHOLDER.test(url) ? "alta" : "media",
      "imagen_reutilizada",
      url,
      `La misma imagen se usa en ${users.length} productos: ${users.join(", ")}.`,
    );
  }
}

for (const category of db.prepare("select name, image_url from categories").all()) {
  if (!category.image_url) {
    add("media", "categoria_sin_imagen", category.name, "Sin fotografía propia; se muestra el respaldo genérico.");
  }
}

// Testimonios sin verificar: no se publican, pero conviene saber cuántos
// están esperando reemplazo por testimonios reales.
for (const section of db.prepare("select config from page_sections where block_type = 'testimonials'").all()) {
  let config;
  try {
    config = JSON.parse(section.config);
  } catch {
    continue;
  }
  const pending = (config.items ?? []).filter((item) => item.verified !== true);
  if (pending.length) {
    add(
      "media",
      "testimonios_sin_verificar",
      config.title ?? "Testimonios",
      `${pending.length} testimonio(s) sin verificar: no se publican en producción hasta marcarlos como verificados.`,
    );
  }
}

db.close();

const high = findings.filter((f) => f.severity === "alta");

if (AS_JSON) {
  console.log(JSON.stringify({ findings, counts: { alta: high.length, total: findings.length } }, null, 2));
} else {
  if (findings.length === 0) {
    console.log("Sin hallazgos de contenido.");
  } else {
    for (const severity of ["alta", "media"]) {
      const group = findings.filter((f) => f.severity === severity);
      if (!group.length) continue;
      console.log(`\n## Severidad ${severity} (${group.length})\n`);
      for (const f of group) console.log(`- [${f.kind}] ${f.subject}: ${f.detail}`);
    }
    console.log(`\nTotal: ${findings.length} hallazgo(s), ${high.length} de severidad alta.`);
  }
}

process.exit(high.length > 0 ? 1 : 0);
