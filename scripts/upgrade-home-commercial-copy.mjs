/**
 * Lleva el contenido comercial nuevo (precio en el hero, qué incluye/no
 * incluye, promesa de entrega calificada, testimonios marcados como no
 * verificados) a una base que ya tiene la portada guardada.
 *
 * Es conservador a propósito: solo rellena campos que faltan y solo
 * reemplaza textos que siguen siendo exactamente los del contenido de
 * ejemplo original. Si el propietario ya editó un texto desde el panel, se
 * respeta su versión y no se toca.
 *
 * Idempotente: correrlo dos veces no cambia nada la segunda vez.
 *
 *   node scripts/upgrade-home-commercial-copy.mjs [--dry-run]
 */
import Database from "better-sqlite3";
import { resolve } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const DB_PATH = process.env.DATABASE_PATH ?? resolve(".data/local.db");

const ORIGINAL_HERO_TITLE = "Cambia tu mirada, sin complicarte.";
const ORIGINAL_HERO_SUBTITLE =
  "Lentes de contacto cosméticos sin fórmula, en tonos que se ven naturales en cualquier color de ojos. Entrega el mismo día en Medellín.";
const ORIGINAL_BENEFIT_SAMEDAY = "En Medellín y el Área Metropolitana, pidiendo antes de la hora límite.";
const ORIGINAL_BENEFIT_COD = "Paga en efectivo o datáfono cuando recibas tu pedido en Medellín.";

const db = new Database(DB_PATH);
const changes = [];

const sections = db
  .prepare("select id, block_type, config from page_sections where block_type in ('hero','testimonials','benefits')")
  .all();

for (const section of sections) {
  let config;
  try {
    config = JSON.parse(section.config);
  } catch {
    continue;
  }
  const before = JSON.stringify(config);

  if (section.block_type === "hero") {
    // Campos nuevos: solo se agregan si no existen todavía.
    if (config.offerLabel === undefined) config.offerLabel = "Lentes + estuche desde {precio}";
    if (config.includesNote === undefined) config.includesNote = "par de lentes + estuche sencillo";
    if (config.excludesNote === undefined) config.excludesNote = "líquido ni domicilio";
    if (config.imageUrl === undefined) config.imageUrl = null;
    if (config.imageAlt === undefined) config.imageAlt = "";

    // Textos: solo si siguen siendo los de ejemplo.
    if (config.title === ORIGINAL_HERO_TITLE) config.title = "Transforma tu mirada con el tono perfecto";
    if (config.subtitle === ORIGINAL_HERO_SUBTITLE) {
      config.subtitle =
        "Explora tonos cafés, grises, verdes y azules con fotografías reales. Lentes cosméticos sin fórmula ni aumento.";
    }
    if (config.eyebrow === "Nueva colección de temporada") config.eyebrow = "Lentes cosméticos sin fórmula";
    if (config.ctaLabel === "Ver catálogo") config.ctaLabel = "Ver todos los tonos";
  }

  if (section.block_type === "testimonials" && Array.isArray(config.items)) {
    // Sin marca explícita un testimonio se considera no verificado y deja
    // de publicarse; marcarlo aquí hace visible esa decisión en los datos.
    for (const item of config.items) {
      if (item.verified === undefined) item.verified = false;
    }
  }

  if (section.block_type === "benefits" && Array.isArray(config.items)) {
    for (const item of config.items) {
      if (item.body === ORIGINAL_BENEFIT_SAMEDAY) {
        item.title = "Entrega rápida en zonas habilitadas";
        item.body =
          "El mismo día donde la zona lo permita, pidiendo antes de la hora límite. Confírmalo en el checkout con tu dirección.";
      }
      if (item.body === ORIGINAL_BENEFIT_COD) {
        item.body = "Disponible en las zonas habilitadas: pagas cuando recibes el pedido.";
      }
    }
  }

  const after = JSON.stringify(config);
  if (after !== before) {
    changes.push({ id: section.id, type: section.block_type });
    if (!DRY_RUN) {
      db.prepare("update page_sections set config = ? where id = ?").run(after, section.id);
    }
  }
}

console.log(
  JSON.stringify(
    { ok: true, dryRun: DRY_RUN, database: DB_PATH, sectionsInspected: sections.length, sectionsUpdated: changes },
    null,
    2,
  ),
);
db.close();
