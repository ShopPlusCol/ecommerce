-- Precarga los 32 departamentos de Colombia + Bogotá D.C. como zonas de
-- nivel "department" (status activo, sin padre), para que el panel de
-- envíos los muestre todos listos para configurar tarifa individual sin
-- tener que darlos de alta uno por uno. "Antioquia" ya existe (creado en
-- rondas anteriores) y se omite por el WHERE NOT EXISTS. La lista de
-- nombres es la misma de src/lib/colombia-departments.ts (COLOMBIA_DEPARTMENTS).
INSERT INTO shipping_zones (id, name, level, country, status, created_at, updated_at)
SELECT lower(hex(randomblob(12))), v.name, 'department', 'CO', 'active', (unixepoch() * 1000), (unixepoch() * 1000)
FROM (SELECT column1 AS name FROM (VALUES
  ('Amazonas'),
  ('Antioquia'),
  ('Arauca'),
  ('Atlántico'),
  ('Bogotá D.C.'),
  ('Bolívar'),
  ('Boyacá'),
  ('Caldas'),
  ('Caquetá'),
  ('Casanare'),
  ('Cauca'),
  ('Cesar'),
  ('Chocó'),
  ('Córdoba'),
  ('Cundinamarca'),
  ('Guainía'),
  ('Guaviare'),
  ('Huila'),
  ('La Guajira'),
  ('Magdalena'),
  ('Meta'),
  ('Nariño'),
  ('Norte de Santander'),
  ('Putumayo'),
  ('Quindío'),
  ('Risaralda'),
  ('San Andrés y Providencia'),
  ('Santander'),
  ('Sucre'),
  ('Tolima'),
  ('Valle del Cauca'),
  ('Vaupés'),
  ('Vichada')
)) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_zones z WHERE z.level = 'department' AND z.name = v.name
);