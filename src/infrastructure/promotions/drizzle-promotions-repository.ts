import { eq } from "drizzle-orm";
import type { PromotionsRepository } from "@/application/ports/promotions-repository";
import type { Coupon, Popup, RewardRule } from "@/domain/entities/promotions";
import { money } from "@/domain/value-objects/money";
import { normalizeCouponCode } from "@/domain/services/coupons";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { coupons, popups, rewardRules } from "@/infrastructure/db/schema";

export class DrizzlePromotionsRepository implements PromotionsRepository {
  async findCouponByCode(code: string): Promise<Coupon | null> {
    const db = await getRuntimeDb();
    const [row] = await db.select().from(coupons).where(eq(coupons.code, normalizeCouponCode(code))).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      discountType: row.discountType,
      discountValue: row.discountValue,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      minPurchaseAmount: row.minPurchaseAmount === null ? null : money(row.minPurchaseAmount),
      minQuantity: row.minQuantity,
      usageLimitTotal: row.usageLimitTotal,
      usageLimitPerCustomer: row.usageLimitPerCustomer,
      firstOrderOnly: row.firstOrderOnly,
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
        eligibleZoneIds: row.eligibleZoneIds ?? null,
        priority: row.priority,
        status: row.status,
      }));
  }
  async listActivePopups(): Promise<Popup[]> {
    const db = await getRuntimeDb();
    const rows = await db
      .select({ popup: popups, couponCode: coupons.code })
      .from(popups)
      .leftJoin(coupons, eq(coupons.id, popups.couponId))
      .where(eq(popups.status, "active"));
    const now = Date.now();
    return rows
      .filter(
        ({ popup }) =>
          (!popup.startsAt || popup.startsAt.getTime() <= now) &&
          (!popup.endsAt || popup.endsAt.getTime() >= now),
      )
      .map(({ popup, couponCode }) => ({
        id: popup.id,
        imageUrlMobile: popup.imageUrlMobile,
        imageUrlDesktop: popup.imageUrlDesktop,
        title: popup.title,
        body: popup.body,
        ctaLabel: popup.ctaLabel,
        ctaHref: popup.ctaHref,
        couponCode: couponCode ?? null,
        includedPaths: popup.includedPaths ?? [],
        excludedPaths: popup.excludedPaths ?? [],
        frequency: popup.frequency,
        delaySeconds: popup.delaySeconds,
        triggerOnScrollPercent: popup.triggerOnScrollPercent,
        triggerOnExitIntent: popup.triggerOnExitIntent,
        priority: popup.priority,
      }))
      .sort((a, b) => b.priority - a.priority);
  }
}
