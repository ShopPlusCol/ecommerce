export type InventorySnapshot = {
  quantityOnHand: number;
  quantityReserved: number;
};

export function inventoryAvailable(snapshot: InventorySnapshot) {
  return snapshot.quantityOnHand - snapshot.quantityReserved;
}

export function validateInventoryAdjustment(snapshot: InventorySnapshot, delta: number) {
  if (!Number.isSafeInteger(delta) || delta === 0) {
    return { ok: false as const, message: "El ajuste debe ser un entero distinto de cero." };
  }
  const nextOnHand = snapshot.quantityOnHand + delta;
  if (nextOnHand < 0) {
    return { ok: false as const, message: "El ajuste dejaría existencias negativas." };
  }
  if (nextOnHand < snapshot.quantityReserved) {
    return {
      ok: false as const,
      message: "El ajuste dejaría menos existencias que unidades reservadas.",
    };
  }
  return { ok: true as const, nextOnHand };
}
