import { z } from "zod";

/**
 * Campos del checkout que el propietario puede activar/desactivar, marcar
 * obligatorios u opcionales, y reordenar (dominio puro, sin acceso a datos,
 * para poder importarse desde componentes de cliente sin arrastrar el
 * driver de base de datos — ver modules/settings/checkout-fields.ts para la
 * lectura persistida).
 *
 * Nombre, teléfono, la ubicación (departamento/ciudad/barrio) y la
 * dirección son estructuralmente necesarios — el envío no se puede cotizar
 * sin ubicación, y el teléfono es la clave con la que se identifica al
 * cliente — así que quedan "bloqueados" (siempre activos y obligatorios)
 * aunque sí se pueden reordenar. El resto es genuinamente opcional hoy y
 * puede desactivarse sin romper el pedido.
 */
export const CHECKOUT_FIELD_ID_VALUES = [
  "fullName",
  "phone",
  "email",
  "location",
  "addressLine",
  "addressComplement",
  "deliveryInstructions",
  "marketingConsent",
] as const;

export type CheckoutFieldId = (typeof CHECKOUT_FIELD_ID_VALUES)[number];

export const LOCKED_CHECKOUT_FIELDS: readonly CheckoutFieldId[] = ["fullName", "phone", "location", "addressLine"];
// La casilla de marketing es opt-in por diseño: nunca se puede forzar a "obligatoria".
export const NO_REQUIRED_TOGGLE_FIELDS: readonly CheckoutFieldId[] = ["marketingConsent"];

export const CHECKOUT_FIELD_LABELS: Record<CheckoutFieldId, string> = {
  fullName: "Nombre completo",
  phone: "Teléfono",
  email: "Correo electrónico",
  location: "Departamento, ciudad y barrio",
  addressLine: "Dirección",
  addressComplement: "Apartamento, torre o bloque",
  deliveryInstructions: "Indicaciones de entrega",
  marketingConsent: "Casilla de novedades y promociones",
};

export type CheckoutFieldConfig = { id: CheckoutFieldId; enabled: boolean; required: boolean; order: number };

export const DEFAULT_CHECKOUT_FIELDS: CheckoutFieldConfig[] = [
  { id: "fullName", enabled: true, required: true, order: 0 },
  { id: "phone", enabled: true, required: true, order: 1 },
  { id: "email", enabled: true, required: false, order: 2 },
  { id: "location", enabled: true, required: true, order: 3 },
  { id: "addressLine", enabled: true, required: true, order: 4 },
  { id: "addressComplement", enabled: true, required: false, order: 5 },
  { id: "deliveryInstructions", enabled: true, required: false, order: 6 },
  { id: "marketingConsent", enabled: true, required: false, order: 7 },
];

/**
 * Validación estructural única, compartida entre lectura y escritura
 * (sección de checkout autoritativo): un solo campo por id, sin ids
 * desconocidos, sin ids faltantes, `order` numérico único por campo.
 * Rechaza cualquier forma que no calce exactamente — no intenta adivinar
 * ni reparar una forma parcialmente inválida, solo decide si confiar o no
 * en el JSON almacenado.
 */
const checkoutFieldConfigItemSchema = z
  .object({
    id: z.enum(CHECKOUT_FIELD_ID_VALUES),
    enabled: z.boolean(),
    required: z.boolean(),
    order: z.number().int().min(0),
  })
  .strict();

export const checkoutFieldsConfigSchema = z
  .array(checkoutFieldConfigItemSchema)
  .length(CHECKOUT_FIELD_ID_VALUES.length)
  .superRefine((fields, ctx) => {
    const ids = fields.map((field) => field.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "IDs de campo duplicados." });
    }
    for (const id of CHECKOUT_FIELD_ID_VALUES) {
      if (!ids.includes(id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Falta el campo obligatorio "${id}".` });
      }
    }
    const orders = fields.map((field) => field.order);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valores de \"order\" repetidos." });
    }
  });

/**
 * Fuerza los invariantes estructurales del checkout (campos bloqueados
 * siempre activos/obligatorios; la casilla de promociones nunca
 * obligatoria) independientemente de lo que diga el JSON validado — mismo
 * criterio que ya aplicaban `isFieldEnabled`/`isFieldRequired` en el
 * cliente, ahora también autoritativo en servidor. Nunca falla: normaliza.
 */
function normalizeCheckoutFields(fields: CheckoutFieldConfig[]): CheckoutFieldConfig[] {
  return [...fields]
    .sort((a, b) => a.order - b.order)
    .map((field) => ({
      ...field,
      enabled: LOCKED_CHECKOUT_FIELDS.includes(field.id) ? true : field.enabled,
      required: LOCKED_CHECKOUT_FIELDS.includes(field.id)
        ? true
        : NO_REQUIRED_TOGGLE_FIELDS.includes(field.id)
          ? false
          : field.required,
    }));
}

/**
 * Punto único de verdad para interpretar `checkout_fields` sin importar de
 * dónde venga el JSON (lectura de `settings`, una migración vieja, un
 * registro corrupto a mano). Si no calza con el esquema, cae de forma
 * segura y predecible a `DEFAULT_CHECKOUT_FIELDS` en vez de dejar el
 * checkout roto o con reglas incoherentes — el llamador decide si además
 * quiere registrar el motivo del fallback.
 */
export function parseCheckoutFieldsConfig(raw: unknown): { fields: CheckoutFieldConfig[]; usedFallback: boolean; issues?: string[] } {
  const result = checkoutFieldsConfigSchema.safeParse(raw);
  if (!result.success) {
    return {
      fields: normalizeCheckoutFields(DEFAULT_CHECKOUT_FIELDS),
      usedFallback: true,
      issues: result.error.issues.map((issue) => issue.message),
    };
  }
  return { fields: normalizeCheckoutFields(result.data), usedFallback: false };
}
