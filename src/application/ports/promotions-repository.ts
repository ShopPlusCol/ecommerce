import type { Coupon, Popup, RewardRule } from "@/domain/entities/promotions";

/**
 * Puerto de lectura de promociones (cupones, reglas de recompensa y
 * pop-ups). La validación autoritativa (fechas, límites de uso, carreras)
 * vive en el servidor; este puerto solo entrega las definiciones (secciones
 * 12, 13 y 14).
 */
export interface PromotionsRepository {
  findCouponByCode(code: string): Promise<Coupon | null>;
  listActiveRewardRules(): Promise<RewardRule[]>;
  listActivePopups(): Promise<Popup[]>;
}
