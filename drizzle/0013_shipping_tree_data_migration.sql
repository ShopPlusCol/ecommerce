-- Migración de datos: de zonas planas por texto + grupos de barrios en un
-- arreglo, a un árbol real Departamento -> Ciudad -> Barrio vía
-- parent_zone_id (sección 17). Se ejecuta con las columnas viejas todavía
-- presentes (se eliminan en la siguiente migración de limpieza de esquema).

-- 1) Las reglas que nunca estuvieron realmente vigentes (borrador/inactiva)
-- no deben migrarse como si fueran configuración propia real.
DELETE FROM shipping_rules WHERE status != 'active';
--> statement-breakpoint

-- 2) Crea una zona de departamento por cada valor distinto de `department`
-- usado por zonas de ciudad existentes, si todavía no existe.
INSERT INTO shipping_zones (id, name, level, parent_zone_id, country, status, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  d.department,
  'department',
  NULL,
  'CO',
  'active',
  strftime('%s','now')*1000,
  strftime('%s','now')*1000
FROM (SELECT DISTINCT department FROM shipping_zones WHERE level = 'city' AND department IS NOT NULL) d
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_zones dep WHERE dep.level = 'department' AND lower(dep.name) = lower(d.department)
);
--> statement-breakpoint

-- 3) Enlaza cada ciudad existente a su zona de departamento.
UPDATE shipping_zones
SET parent_zone_id = (
      SELECT dep.id FROM shipping_zones dep
      WHERE dep.level = 'department' AND lower(dep.name) = lower(shipping_zones.department)
      LIMIT 1
    ),
    updated_at = strftime('%s','now')*1000
WHERE level = 'city' AND department IS NOT NULL;
--> statement-breakpoint

-- 4) Expande cada "grupo" de barrios (arreglo neighborhood_names en una
-- sola fila) en filas individuales de barrio, hijas de la ciudad del grupo.
INSERT INTO shipping_zones (id, name, level, parent_zone_id, country, status, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  je.value,
  'neighborhood',
  (SELECT c.id FROM shipping_zones c WHERE c.level = 'city' AND lower(c.name) = lower(g.city) LIMIT 1),
  'CO',
  'active',
  strftime('%s','now')*1000,
  strftime('%s','now')*1000
FROM shipping_zones g, json_each(g.neighborhood_names) je
WHERE g.level = 'neighborhood' AND g.neighborhood_names IS NOT NULL AND json_array_length(g.neighborhood_names) > 0;
--> statement-breakpoint

-- 5) Copia la configuración propia del grupo a cada barrio recién creado.
-- Los grupos "unassigned" (Sin grupo) no tienen regla que copiar a
-- propósito: sus barrios quedan heredando todo de la ciudad. Los grupos
-- "no_coverage" (Sin cobertura) fuerzan coverage='unavailable' aunque el
-- valor viejo de blocks_delivery no estuviera marcado.
INSERT INTO shipping_rules (
  id, zone_id, name, fee, free_shipping_threshold, coverage, cash_on_delivery_allowed,
  requires_advance_payment, advance_percentage, same_day_available, same_day_cutoff_hour,
  estimated_business_days_min, estimated_business_days_max, allowed_payment_methods,
  customer_message, created_at, updated_at
)
SELECT
  lower(hex(randomblob(16))),
  z.id,
  z.name,
  r.fee,
  r.free_shipping_threshold,
  CASE WHEN g.group_kind = 'no_coverage' THEN 'unavailable' WHEN r.blocks_delivery = 1 THEN 'unavailable' ELSE NULL END,
  r.cash_on_delivery_allowed,
  r.requires_advance_payment,
  r.advance_percentage,
  r.same_day_available,
  r.same_day_cutoff_hour,
  r.estimated_business_days_min,
  r.estimated_business_days_max,
  r.allowed_payment_methods,
  r.customer_message,
  strftime('%s','now')*1000,
  strftime('%s','now')*1000
FROM shipping_zones g
JOIN shipping_rules r ON r.zone_id = g.id
JOIN json_each(g.neighborhood_names) je
JOIN shipping_zones z
  ON z.name = je.value
 AND z.level = 'neighborhood'
 AND z.parent_zone_id = (SELECT c.id FROM shipping_zones c WHERE c.level = 'city' AND lower(c.name) = lower(g.city) LIMIT 1)
WHERE g.level = 'neighborhood' AND g.neighborhood_names IS NOT NULL AND g.group_kind IN ('custom', 'no_coverage');
--> statement-breakpoint

-- 6) Los grupos en sí ya cumplieron su función (sus barrios ahora son filas
-- propias); se retiran junto con su regla. Se identifican por tener
-- `neighborhood_names` NO NULO (aunque sea un arreglo vacío, como "Sin
-- grupo"/"Sin cobertura"): las filas de barrio recién creadas en el paso 4
-- NUNCA tienen ese campo poblado (queda NULL), así que no se ven afectadas
-- aunque `group_kind` por defecto también sea 'custom' en ellas.
DELETE FROM shipping_rules WHERE zone_id IN (
  SELECT id FROM shipping_zones WHERE level = 'neighborhood' AND neighborhood_names IS NOT NULL
);
--> statement-breakpoint

DELETE FROM shipping_zones WHERE level = 'neighborhood' AND neighborhood_names IS NOT NULL;
