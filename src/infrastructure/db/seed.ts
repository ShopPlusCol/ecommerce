import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { eq } from "drizzle-orm";
import { getLocalDb } from "./client";
import {
  adminUsers,
  categories,
  colorFamilies,
  collectionProducts,
  collections,
  coupons,
  faqs,
  inventoryItems,
  productCategories,
  productMedia,
  products,
  roles,
  shippingRules,
  shippingZones,
  userRoles,
} from "./schema";
import { hashPassword, generateRandomPassword } from "@/modules/auth/password";

/**
 * Seed de demostración (sección 42). Todo lo aquí creado es contenido de
 * ejemplo, reemplazable por el administrador: no es dependencia de
 * producción.
 */
async function seed() {
  const sqlitePath = process.env.SQLITE_PATH ?? "./.data/local.db";
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = getLocalDb(sqlitePath);

  const [existingProduct] = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProduct) {
    console.log("La base de datos ya tiene datos de ejemplo sembrados. No se vuelve a sembrar.");
    console.log("Si necesitas datos frescos, borra el archivo SQLite (SQLITE_PATH) y vuelve a migrar.");
    return;
  }

  console.log("Sembrando roles y usuario propietario...");
  const [insertedOwnerRole] = await db
    .insert(roles)
    .values({ name: "Propietario", slug: "owner", description: "Acceso total", isSystemRole: true })
    .onConflictDoNothing()
    .returning();
  const ownerRole = insertedOwnerRole ?? (await db.select().from(roles).where(eq(roles.slug, "owner")))[0];
  await db
    .insert(roles)
    .values([
      { name: "Administrador", slug: "admin", isSystemRole: true },
      { name: "Operaciones", slug: "operations", isSystemRole: true },
      { name: "Editor de contenido", slug: "content_editor", isSystemRole: true },
      { name: "Analista de solo lectura", slug: "read_only_analyst", isSystemRole: true },
    ])
    .onConflictDoNothing();

  const ownerPassword = generateRandomPassword();
  const [owner] = await db
    .insert(adminUsers)
    .values({
      fullName: "Propietario ShopPlusCol",
      email: "owner@shoppluscol.local",
      passwordHash: hashPassword(ownerPassword),
    })
    .onConflictDoNothing()
    .returning();

  if (owner) {
    await db.insert(userRoles).values({ userId: owner.id, roleId: ownerRole.id }).onConflictDoNothing();
    console.log(`Usuario propietario creado: owner@shoppluscol.local / ${ownerPassword}`);
    console.log("Guarda esta contraseña ahora: no se volverá a mostrar. El login real llega en la Fase 3.");
  }

  console.log("Sembrando familias de color y categorías...");
  const colorFamilyRows = await db
    .insert(colorFamilies)
    .values([
      { slug: "miel-cafe", name: "Miel / Café", hexSwatch: "#9a6a3a", order: 1 },
      { slug: "gris", name: "Gris", hexSwatch: "#8b8f94", order: 2 },
      { slug: "verde", name: "Verde", hexSwatch: "#3f7a5a", order: 3 },
      { slug: "azul", name: "Azul", hexSwatch: "#3a6d9a", order: 4 },
      { slug: "halloween", name: "Halloween", hexSwatch: "#87233d", order: 5 },
    ])
    .onConflictDoNothing()
    .returning();

  const [catLentes, catAccesorios, catHalloween] = await db
    .insert(categories)
    .values([
      { slug: "lentes", name: "Lentes de contacto", description: "Lentes cosméticos sin fórmula.", order: 1 },
      { slug: "accesorios", name: "Accesorios", description: "Cuidado diario de tus lentes.", order: 2 },
      { slug: "halloween", name: "Halloween", description: "Tonos de edición limitada.", order: 3 },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("Sembrando productos de ejemplo...");
  const findColorFamily = (slug: string) => colorFamilyRows.find((c) => c.slug === slug)?.id ?? null;

  const productRows = await db
    .insert(products)
    .values([
      {
        slug: "amazon-brown",
        sku: "SPC-LEN-001",
        status: "active",
        name: "Amazon Brown",
        shortDescription: "Un café miel luminoso, perfecto para ojos claros y oscuros.",
        description: "Lente cosmético sin fórmula ni aumento. Efecto natural con difuminado suave.",
        price: 49_000,
        colorFamilyId: findColorFamily("miel-cafe"),
        featured: true,
        publishedAt: new Date(),
      },
      {
        slug: "oslo",
        sku: "SPC-LEN-002",
        status: "active",
        name: "Oslo",
        shortDescription: "Gris ceniza con un anillo definido, ideal para looks editoriales.",
        description: "Lente cosmético sin fórmula ni aumento. Tono gris frío con textura realista.",
        price: 49_000,
        compareAtPrice: 59_000,
        colorFamilyId: findColorFamily("gris"),
        featured: true,
        publishedAt: new Date(),
      },
      {
        slug: "boreal",
        sku: "SPC-LEN-003",
        status: "active",
        name: "Boreal",
        shortDescription: "Verde bosque profundo con reflejos dorados.",
        description: "Lente cosmético sin fórmula ni aumento. Ideal para pieles cálidas.",
        price: 49_000,
        colorFamilyId: findColorFamily("verde"),
        featured: true,
        publishedAt: new Date(),
      },
      {
        slug: "santorini",
        sku: "SPC-LEN-004",
        status: "active",
        name: "Santorini",
        shortDescription: "Azul aguamarina con acabado cristalino.",
        description: "Lente cosmético sin fórmula ni aumento. Efecto luminoso muy natural.",
        price: 49_000,
        colorFamilyId: findColorFamily("azul"),
        publishedAt: new Date(),
      },
      {
        slug: "crimson-eclipse",
        sku: "SPC-LEN-H01",
        status: "active",
        name: "Crimson Eclipse",
        shortDescription: "Rojo intenso de edición Halloween.",
        description: "Lente cosmético de temporada sin fórmula ni aumento.",
        price: 55_000,
        colorFamilyId: findColorFamily("halloween"),
        publishedAt: new Date(),
      },
      {
        slug: "solucion-multiproposito-120ml",
        sku: "SPC-ACC-001",
        status: "active",
        name: "Solución multipropósito 120ml",
        shortDescription: "Limpieza, enjuague y almacenamiento diario.",
        description: "Solución salina para el cuidado diario de lentes de contacto cosméticos.",
        price: 28_000,
        publishedAt: new Date(),
      },
      {
        slug: "pinza-y-aplicador",
        sku: "SPC-ACC-002",
        status: "active",
        name: "Pinza y aplicador",
        shortDescription: "Set de herramientas para poner y quitar tus lentes con higiene.",
        description: "Incluye pinza de punta redondeada y aplicador de succión.",
        price: 15_000,
        publishedAt: new Date(),
      },
    ])
    .onConflictDoNothing()
    .returning();

  await db
    .insert(productMedia)
    .values(
      productRows.map((product) => ({
        productId: product.id,
        url: product.sku.startsWith("SPC-ACC") ? "/demo/accesorio-placeholder.svg" : "/demo/lentes-placeholder.svg",
        altText: product.name,
        order: 0,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(inventoryItems)
    .values(
      productRows.map((product) => ({
        productId: product.id,
        quantityOnHand: product.sku === "SPC-LEN-004" ? 0 : 24,
      })),
    )
    .onConflictDoNothing();

  const lensProductIds = productRows.filter((p) => p.sku.startsWith("SPC-LEN")).map((p) => p.id);
  const accessoryProductIds = productRows.filter((p) => p.sku.startsWith("SPC-ACC")).map((p) => p.id);
  const halloweenProductId = productRows.find((p) => p.sku === "SPC-LEN-H01")?.id;

  if (catLentes && catAccesorios && catHalloween) {
    await db
      .insert(productCategories)
      .values([
        ...lensProductIds.map((productId) => ({ productId, categoryId: catLentes.id })),
        ...accessoryProductIds.map((productId) => ({ productId, categoryId: catAccesorios.id })),
        ...(halloweenProductId ? [{ productId: halloweenProductId, categoryId: catHalloween.id }] : []),
      ])
      .onConflictDoNothing();
  }

  console.log("Sembrando colección 'Más vendidos'...");
  const [bestSellersCollection] = await db
    .insert(collections)
    .values({
      slug: "mas-vendidos",
      name: "Más vendidos",
      description: "Los tonos preferidos por nuestras clientas este mes.",
      type: "manual",
      featured: true,
    })
    .onConflictDoNothing()
    .returning();

  if (bestSellersCollection) {
    const featuredIds = productRows.filter((p) => ["SPC-LEN-001", "SPC-LEN-002", "SPC-LEN-003"].includes(p.sku));
    await db
      .insert(collectionProducts)
      .values(featuredIds.map((product, index) => ({ collectionId: bestSellersCollection.id, productId: product.id, order: index })))
      .onConflictDoNothing();
  }

  console.log("Sembrando FAQ inicial...");
  await db
    .insert(faqs)
    .values([
      {
        question: "¿Necesito fórmula médica para comprar?",
        answer: "No. Todos nuestros lentes son cosméticos, sin fórmula y sin aumento.",
        order: 1,
        status: "published",
      },
      {
        question: "¿El tono se verá igual que en la foto?",
        answer: "El resultado varía según la iluminación, la cámara y el color natural de tu iris.",
        order: 2,
        status: "published",
      },
      {
        question: "¿Cómo pago el envío en Medellín?",
        answer: "En Medellín y el Área Metropolitana puedes pagar contraentrega.",
        order: 3,
        status: "published",
      },
    ])
    .onConflictDoNothing();

  console.log("Sembrando zonas de envío de ejemplo...");
  const [medellinZone, nationalZone] = await db
    .insert(shippingZones)
    .values([
      { name: "Medellín", level: "city", department: "Antioquia", city: "Medellín" },
      { name: "Resto de Colombia", level: "country", country: "CO" },
    ])
    .onConflictDoNothing()
    .returning();

  if (medellinZone) {
    await db
      .insert(shippingRules)
      .values({
        zoneId: medellinZone.id,
        name: "Medellín - contraentrega mismo día",
        fee: 8_000,
        cashOnDeliveryAllowed: true,
        sameDayAvailable: true,
        sameDayCutoffHour: 14,
        estimatedBusinessDaysMin: 0,
        estimatedBusinessDaysMax: 1,
        customerMessage: "Entrega el mismo día pidiendo antes de las 2:00 p.m.",
        status: "active",
      })
      .onConflictDoNothing();
  }

  if (nationalZone) {
    await db
      .insert(shippingRules)
      .values({
        zoneId: nationalZone.id,
        name: "Nacional - envío anticipado",
        fee: 15_000,
        cashOnDeliveryAllowed: false,
        requiresAdvancePayment: true,
        advancePercentage: 100,
        estimatedBusinessDaysMin: 2,
        estimatedBusinessDaysMax: 5,
        customerMessage: "El envío se paga por anticipado; el pedido queda como saldo contraentrega.",
        status: "active",
      })
      .onConflictDoNothing();
  }

  console.log("Sembrando cupón de prueba (desactivado)...");
  await db
    .insert(coupons)
    .values({
      code: "BIENVENIDA10",
      discountType: "percentage",
      discountValue: 10,
      status: "draft",
      internalNotes: "Cupón de ejemplo, desactivado por defecto.",
    })
    .onConflictDoNothing();

  console.log("Seed completado.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error al sembrar la base de datos:", error);
    process.exit(1);
  });
