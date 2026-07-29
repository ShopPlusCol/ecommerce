import { eq } from "drizzle-orm";
import type { PromotionsRepository } from "@/application/ports/promotions-repository";
import type { Coupon, RewardRule } from "@/domain/entities/promotions";
import { money } from "@/domain/value-objects/money";
import { normalizeCouponCode } from "@/domain/services/coupons";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { coupons, rewardRules } from "@/infrastructure/db/schema";

export class DrizzlePromotionsRepository implements PromotionsRepository {
  async findCouponByCode(code: string): Promise<Coupon | null> {
    const db = await getRuntimeDb();
    const [row] = await db.select().from(coupons).where(eq(coupons.code, normalizeCouponCode(code))).limit(1);
    if (!row) return null;
    return {
      code: row.code,
      discountType: row.discountType,
      discountValue: row.discountValue,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      minPurchaseAmount: row.minPurchaseAmount === null ? null : money(row.minPurchaseAmount),
      minQuantity: row.minQuantity,
      status: row.status,
    };
  }
  async listActiveRewardRules(): Promise<RewardRule[]> {
    const db = await getRuntimeDb();
    const rows = await db.select().from(rewardRules).where(eq(rewardRules.status, "active"));
    return rows
      .filter((row) => row.conditionType === "cart_amount" || row.conditionType === "item_count")
      .map((row) => ({
        id: row.id,
        name: row.name,
        progressMessage: row.progressMessage,
        unlockedMessage: row.unlockedMessage,
        conditionType: row.conditionType as RewardRule["conditionType"],
        targetValue: row.targetValue,
        rewardType: row.rewardType,
        rewardValue: row.rewardValue,
        rewardProductId: row.rewardProductId,
        priority: row.priority,
        status: row.status,
      }));
  }
}
