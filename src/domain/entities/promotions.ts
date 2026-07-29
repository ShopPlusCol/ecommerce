import type { Money } from "@/domain/value-objects/money";

/**
 * Formas del dominio para cupones y reglas de recompensa. Coinciden con las
 * tablas `coupons` y `reward_rules` (docs/DATA_MODEL.md) pero solo exponen
 * lo que necesitan los motores de cálculo. La validación de fechas, límites
 * de uso y carreras se hace en servidor (secciones 12 y 13).
 */
export type CouponDiscountType = "fixed" | "percentage" | "free_shipping" | "gift";

export type Coupon = {
  code: string;
  discountType: CouponDiscountType;
  /** Monto en COP para "fixed", porcentaje 0-100 para "percentage". */
  discountValue: number;
  startsAt: string | null;
  endsAt: string | null;
  minPurchaseAmount: Money | null;
  minQuantity: number | null;
  status: "draft" | "scheduled" | "active" | "paused" | "expired";
};

export type RewardConditionType = "cart_amount" | "item_count";
export type RewardType = "free_shipping" | "free_product" | "fixed_discount" | "percentage_discount";

export type RewardRule = {
  id: string;
  name: string;
  progressMessage: string;
  unlockedMessage: string;
  conditionType: RewardConditionType;
  /** Monto objetivo en COP (cart_amount) o número de unidades (item_count). */
  targetValue: number;
  rewardType: RewardType;
  /** Monto/porcentaje según rewardType; null para free_shipping/free_product. */
  rewardValue: number | null;
  rewardProductId: string | null;
  priority: number;
  status: "draft" | "active" | "paused";
};
