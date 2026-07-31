import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { getLocalDb } from "./client";
import {
  adminUsers,
  authAccounts,
  categories,
  colorFamilies,
  collectionProducts,
  collections,
  coupons,
  faqs,
  inventoryItems,
  pageSections,
  pages,
  pageVersions,
  productCategories,
  productMedia,
  products,
  permissions,
  rolePermissions,
  roles,
  shippingRules,
  shippingZones,
  userRoles,
} from "./schema";
import { generateRandomPassword } from "@/modules/auth/password";
import { demoHomePage } from "@/infrastructure/demo/demo-home-page";

/**
 * Seed de demostración (sección 42). Todo lo aquí creado es contenido de
 * ejemplo, reemplazable por el administrador: no es dependencia de
 * producción.
 */
async function seed() {
  const sqlitePath = process.env.SQLITE_PATH ?? "./.data/local.db";
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = getLocalDb(sqlitePath);

  console.log("Sembrando identidad administrativa...");
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

  const allRoles = await db.select().from(roles);
  const permissionDefinitions = [
    ...["dashboard", "catalog", "inventory", "orders", "customers", "shipping", "payments", "promotions", "content", "media", "integrations", "users", "settings", "audit"].flatMap(
      (resource) => ["read", "create", "update", "delete", "export"].map((action) => ({ resource, action })),
    ),
  ];
  await db.insert(permissions).values(permissionDefinitions).onConflictDoNothing();
  const allPermissions = await db.select().from(permissions);
  const roleBySlug = new Map(allRoles.map((role) => [role.slug, role]));
  const grants: Record<string, (permission: (typeof allPermissions)[number]) => boolean> = {
    owner: () => true,
    admin: (permission) => permission.resource !== "users" || permission.action !== "delete",
    operations: (permission) =>
      ["dashboard", "inventory", "orders", "customers", "shipping", "payments"].includes(permission.resource),
    content_editor: (permission) =>
      ["catalog", "promotions", "content", "media"].includes(permission.resource),
    read_only_analyst: (permission) => ["read", "export"].includes(permission.action),
  };
  for (const [roleSlug, allows] of Object.entries(grants)) {
    const role = roleBySlug.get(roleSlug);
    if (!role) continue;
    const values = allPermissions
      .filter(allows)
      .map((permission) => ({ roleId: role.id, permissionId: permission.id }));
    if (values.length) await db.insert(rolePermissions).values(values).onConflictDoNothing();
  }

  const ownerEmail = (process.env.ADMIN_OWNER_EMAIL ?? "owner@shoppluscol.local").trim().toLowerCase();
  const ownerName = process.env.ADMIN_OWNER_NAME ?? "Propietario ShopPlusCol";
  let [owner] = await db.select().from(adminUsers).where(eq(adminUsers.email, ownerEmail)).limit(1);
  if (!owner) {
    [owner] = await db
      .insert(adminUsers)
      .values({ fullName: ownerName, email: ownerEmail, passwordHash: "pending-auth-account" })
      .returning();
  }
  await db.insert(userRoles).values({ userId: owner.id, roleId: ownerRole.id }).onConflictDoNothing();

  const [credential] = await db
    .select({ id: authAccounts.id })
    .from(authAccounts)
    .where(and(eq(authAccounts.providerId, "credential"), eq(authAccounts.userId, owner.id)))
    .limit(1);
  if (!credential) {
    const ownerPassword = process.env.ADMIN_OWNER_PASSWORD || generateRandomPassword();
    const passwordHash = await hashPassword(ownerPassword);
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, owner.id));
    await db.insert(authAccounts).values({
      accountId: owner.id,
      providerId: "credential",
      userId: owner.id,
      password: passwordHash,
    });
    console.log(`Usuario propietario habilitado: ${ownerEmail} / ${ownerPassword}`);
    console.log("Guarda esta contraseña ahora: no se volverá a mostrar.");
  }

  let [homePage] = await db.select().from(pages).where(eq(pages.slug, demoHomePage.slug)).limit(1);
  if (!homePage) {
    [homePage] = await db
      .insert(pages)
      .values({ slug: demoHomePage.slug, title: demoHomePage.title, isHome: true })
      .returning();
  }
  if (!homePage.publishedVersionId) {
    const [version] = await db
      .insert(pageVersions)
      .values({ pageId: homePage.id, versionNumber: 1, publishedAt: new Date() })
      .returning();
    await db.insert(pageSections).values(
      demoHomePage.blocks.map((block, order) => ({
        id: block.id,
        pageVersionId: version.id,
        blockType: block.type,
        order,
        config: block.config,
        visibleOnMobile: block.visibleOnMobile,
        visibleOnDesktop: block.visibleOnDesktop,
      })),
    );
    await db
      .update(pages)
      .set({ publishedVersionId: version.id, status: "published" })
      .where(eq(pages.id, homePage.id));
  }

  const [existingProduct] = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProduct) {
    console.log("Identidad actualizada; los datos comerciales de ejemplo ya existían.");
    return;
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
  // `onConflictDoNothing()` no evita duplicados aquí: el id es aleatorio y
  // nunca choca, así que busca primero por nombre/nivel (p. ej. el
  // departamento "Antioquia" que ya precarga la migración 0016) antes de
  // insertar, para que sembrar dos veces (o sembrar sobre una base ya
  // migrada) no cree zonas repetidas.
  async function findOrCreateZone(values: { name: string; level: "department" | "city" | "country"; parentZoneId?: string; country: string; status: "active" }) {
    const [existing] = await db
      .select()
      .from(shippingZones)
      .where(
        and(
          eq(shippingZones.name, values.name),
          eq(shippingZones.level, values.level),
          values.parentZoneId ? eq(shippingZones.parentZoneId, values.parentZoneId) : isNull(shippingZones.parentZoneId),
        ),
      )
      .limit(1);
    if (existing) return existing;
    const [created] = await db.insert(shippingZones).values(values).returning();
    return created;
  }

  const antioquiaZone = await findOrCreateZone({ name: "Antioquia", level: "department", country: "CO", status: "active" });
  const nationalZone = await findOrCreateZone({ name: "Resto de Colombia", level: "country", country: "CO", status: "active" });
  const medellinZone = await findOrCreateZone({ name: "Medellín", level: "city", parentZoneId: antioquiaZone.id, country: "CO", status: "active" });

  if (medellinZone) {
    await db
      .insert(shippingRules)
      .values({
        zoneId: medellinZone.id,
        fee: 8_000,
        cashOnDeliveryAllowed: true,
        sameDayAvailable: true,
        sameDayCutoffHour: 14,
        estimatedBusinessDaysMin: 0,
        estimatedBusinessDaysMax: 1,
        customerMessage: "Entrega el mismo día pidiendo antes de las 2:00 p.m.",
      })
      .onConflictDoNothing();
  }

  if (nationalZone) {
    await db
      .insert(shippingRules)
      .values({
        zoneId: nationalZone.id,
        fee: 15_000,
        cashOnDeliveryAllowed: false,
        requiresAdvancePayment: true,
        advancePercentage: 100,
        estimatedBusinessDaysMin: 2,
        estimatedBusinessDaysMax: 5,
        customerMessage: "El envío se paga por anticipado; el pedido queda como saldo contraentrega.",
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
