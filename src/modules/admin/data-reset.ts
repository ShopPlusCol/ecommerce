export type ResetTarget = "orders" | "customers";

const confirmations: Record<ResetTarget, string> = {
  orders: "BORRAR TODOS LOS PEDIDOS",
  customers: "BORRAR TODOS LOS CLIENTES",
};

export function resetConfirmation(target: ResetTarget) {
  return confirmations[target];
}

export function validateResetConfirmation(target: ResetTarget, value: unknown, acknowledged: unknown) {
  if (acknowledged !== "on") {
    throw new Error("Confirma que comprendes que la recuperación solo será posible desde un backup.");
  }
  if (value !== confirmations[target]) {
    throw new Error(`Escribe exactamente “${confirmations[target]}” para continuar.`);
  }
}
