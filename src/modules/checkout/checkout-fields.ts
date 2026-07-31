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
export type CheckoutFieldId =
  | "fullName"
  | "phone"
  | "email"
  | "location"
  | "addressLine"
  | "addressComplement"
  | "deliveryInstructions"
  | "marketingConsent";

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
