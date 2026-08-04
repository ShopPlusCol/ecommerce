/**
 * Identidad del entorno en el que corre la aplicación.
 *
 * Existe para que una tienda de pruebas se **vea** como una tienda de
 * pruebas. Validar el flujo completo (pedidos, pagos, correos, eventos)
 * contra algo indistinguible de producción es la forma más fácil de acabar
 * cobrando de verdad, o de tomar por real un pedido que no lo era.
 *
 * Es dominio puro: se puede importar desde componentes de cliente sin
 * arrastrar la base de datos al bundle.
 */
export type AppEnvironment = "production" | "staging" | "development";

export type EnvironmentInfo = {
  environment: AppEnvironment;
  /** true si hay que mostrar el aviso de entorno de pruebas. */
  isTestEnvironment: boolean;
  label: string;
  /** Frase corta que explica las consecuencias, para el aviso. */
  description: string;
};

const LABELS: Record<AppEnvironment, { label: string; description: string }> = {
  production: { label: "Producción", description: "Los pedidos y pagos son reales." },
  staging: {
    label: "Entorno de pruebas",
    description:
      "Base de datos y almacenamiento separados. Los pedidos, pagos y eventos creados aquí no son reales y pueden borrarse.",
  },
  development: {
    label: "Desarrollo local",
    description: "Base de datos local. Nada de lo que ocurra aquí llega a clientes reales.",
  },
};

/**
 * Resuelve el entorno a partir de variables. `APP_ENVIRONMENT` manda; si no
 * está, se deduce de `NODE_ENV`. Ante la duda **no** se asume producción a
 * la ligera: un entorno mal etiquetado como producción solo pierde el
 * aviso, pero uno mal etiquetado como pruebas invitaría a hacer pedidos de
 * mentira contra datos reales.
 */
export function resolveEnvironment(
  env: { APP_ENVIRONMENT?: string; NODE_ENV?: string } = {},
): EnvironmentInfo {
  const explicit = env.APP_ENVIRONMENT?.trim().toLowerCase();
  let environment: AppEnvironment;

  if (explicit === "staging" || explicit === "production" || explicit === "development") {
    environment = explicit;
  } else if (env.NODE_ENV === "production") {
    environment = "production";
  } else {
    environment = "development";
  }

  return {
    environment,
    isTestEnvironment: environment !== "production",
    ...LABELS[environment],
  };
}

/** Prefijo de los pedidos creados en un entorno que no es producción. */
export const TEST_ORDER_PREFIX = "TEST-";

/**
 * Marca el número de pedido para que un pedido de prueba sea reconocible a
 * simple vista en el panel, en los correos y en los exports — sin depender
 * de recordar en qué entorno se creó.
 */
export function applyTestOrderPrefix(orderNumber: string, info: EnvironmentInfo): string {
  if (!info.isTestEnvironment) return orderNumber;
  if (orderNumber.startsWith(TEST_ORDER_PREFIX)) return orderNumber;
  return `${TEST_ORDER_PREFIX}${orderNumber}`;
}

export function isTestOrderNumber(orderNumber: string): boolean {
  return orderNumber.startsWith(TEST_ORDER_PREFIX);
}
