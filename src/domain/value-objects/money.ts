/**
 * Dinero como entero en pesos colombianos (COP no tiene subunidad de uso
 * práctico), para evitar errores de punto flotante en cálculos de negocio.
 * Toda cifra monetaria del dominio debe pasar por este tipo.
 */
export type Money = { readonly amount: number; readonly currency: "COP" };

export class InvalidMoneyError extends Error {
  constructor(value: unknown) {
    super(`Monto inválido: ${String(value)}. Debe ser un entero >= 0.`);
    this.name = "InvalidMoneyError";
  }
}

function assertValidAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new InvalidMoneyError(amount);
  }
}

export function money(amount: number, currency: "COP" = "COP"): Money {
  assertValidAmount(amount);
  return { amount, currency };
}

export const ZERO_COP: Money = { amount: 0, currency: "COP" };

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`No se pueden operar monedas distintas: ${a.currency} vs ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(Math.max(0, a.amount - b.amount), a.currency);
}

export function multiply(a: Money, factor: number): Money {
  return money(Math.round(a.amount * factor), a.currency);
}

export function percentageOf(a: Money, percentage: number): Money {
  if (percentage < 0 || percentage > 100) {
    throw new Error(`Porcentaje fuera de rango: ${percentage}`);
  }
  return money(Math.round((a.amount * percentage) / 100), a.currency);
}

export function isZero(a: Money): boolean {
  return a.amount === 0;
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.amount === b.amount) return 0;
  return a.amount > b.amount ? 1 : -1;
}

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formatea como "$49.000" (es-CO agrupa miles con punto). */
export function formatMoney(a: Money): string {
  return COP_FORMATTER.format(a.amount).replace(/\s/g, "");
}
