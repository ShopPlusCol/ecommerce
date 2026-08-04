/**
 * Borra los datos generados durante una validación, sin tocar datos reales.
 *
 *   node scripts/clean-test-data.mjs --dry-run    # muestra qué borraría
 *   node scripts/clean-test-data.mjs              # borra
 *
 * Qué considera "de prueba" — y solo eso:
 * - Pedidos cuyo número empieza por `TEST-` (los crea así cualquier entorno
 *   que no sea producción) y todo lo que cuelga de ellos.
 * - Clientes que quedan sin ningún pedido después de ese borrado.
 * - Eventos de analítica asociados a esos pedidos.
 * - Productos creados por las pruebas E2E (`TEST-` en el SKU).
 *
 * Salvaguardas: por defecto opera sobre `.data/staging.db`, y se **niega a
 * ejecutarse** sobre otra base salvo que se pase `--database` explícito.
 * Un borrado "de prueba" apuntando por error a la base real sería
 * exactamente el accidente que este script debe evitar.
 */
import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const explicitDb = args.find((a) => a.startsWith("--database="))?.split("=")[1];
const DB_PATH = path.resolve(explicitDb ?? ".data/staging.db");

if (!existsSync(DB_PATH)) {
  console.error(`No existe la base ${DB_PATH}. ¿Ejecutaste 'npm run staging:seed'?`);
  process.exit(1);
}
if (!explicitDb && !DB_PATH.endsWith("staging.db")) {
  console.error("Por seguridad solo se opera sobre .data/staging.db. Usa --database=<ruta> si de verdad quieres otra.");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const testOrders = db.prepare("select id, order_number, customer_id from orders where order_number like 'TEST-%'").all();
const testProducts = db.prepare("select id, name from products where sku like 'TEST-%'").all();

const orderIds = testOrders.map((o) => o.id);
const placeholders = orderIds.map(() => "?").join(",");

let analyticsCount = 0;
if (orderIds.length) {
  analyticsCount = db
    .prepare(`select count(*) c from analytics_events where order_id in (${placeholders})`)
    .get(...orderIds).c;
}

// Clientes que se quedarían sin ningún pedido tras borrar los de prueba.
const orphanCustomers = orderIds.length
  ? db
      .prepare(
        `select c.id, c.full_name from customers c
         where c.id in (select distinct customer_id from orders where order_number like 'TEST-%' and customer_id is not null)
           and not exists (
             select 1 from orders o where o.customer_id = c.id and o.order_number not like 'TEST-%'
           )`,
      )
      .all()
  : [];

const plan = {
  database: DB_PATH,
  dryRun: DRY_RUN,
  orders: testOrders.map((o) => o.order_number),
  analyticsEvents: analyticsCount,
  customers: orphanCustomers.map((c) => c.full_name),
  products: testProducts.map((p) => p.name),
};

if (!DRY_RUN) {
  const run = db.transaction(() => {
    if (orderIds.length) {
      // `orders` borra en cascada order_items/status_history/payments/
      // consent_records; analytics_events no tiene cascada, va aparte.
      db.prepare(`delete from analytics_events where order_id in (${placeholders})`).run(...orderIds);
      db.prepare(`delete from orders where id in (${placeholders})`).run(...orderIds);
    }
    for (const customer of orphanCustomers) {
      db.prepare("delete from customers where id = ?").run(customer.id);
    }
    for (const product of testProducts) {
      db.prepare("delete from product_media where product_id = ?").run(product.id);
      db.prepare("delete from inventory_items where product_id = ?").run(product.id);
      db.prepare("delete from products where id = ?").run(product.id);
    }
  });
  run();
}

console.log(JSON.stringify(plan, null, 2));
console.log(
  DRY_RUN
    ? "\nSimulación: no se borró nada. Vuelve a ejecutar sin --dry-run para aplicar."
    : "\nDatos de prueba eliminados.",
);
db.close();
