import type { Coupon, RewardRule } from "@/domain/entities/promotions";
import type { PromotionsRepository } from "@/application/ports/promotions-repository";
import { normalizeCouponCode } from "@/domain/services/coupons";
import { coupons, rewardRules } from "@/infrastructure/demo/demo-dataset";

export class DemoPromotionsRepository implements PromotionsRepository {
  async findCouponByCode(code: string): Promise<Coupon | null> {
    const normalized = normalizeCouponCode(code);
    return coupons.find((c) => c.code === normalized) ?? null;
  }

  async listActiveRewardRules(): Promise<RewardRule[]> {
    return rewardRules.filter((r) => r.status === "active");
  }
}
