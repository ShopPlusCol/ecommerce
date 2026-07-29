import type { Coupon, RewardRule } from "@/domain/entities/promotions";

/**
 * Puerto de lectura de promociones (cupones y reglas de recompensa). La
 * validación autoritativa (fechas, límites de uso, carreras) vive en el
 * servidor; este puerto solo entrega las definiciones (secciones 12 y 13).
 */
export interface PromotionsRepository {
  findCouponByCode(code: string): Promise<Coupon | null>;
  listActiveRewardRules(): Promise<RewardRule[]>;
}
