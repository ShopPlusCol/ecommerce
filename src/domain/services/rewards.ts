import type { RewardRule } from "@/domain/entities/promotions";
import { type Money, money, percentageOf, add, ZERO_COP } from "@/domain/value-objects/money";

export type RewardContext = {
  subtotal: Money;
  totalUnits: number;
};

export type UnlockedReward = {
  rule: RewardRule;
  freeShipping: boolean;
  discount: Money;
  giftProductId: string | null;
};

export type NextReward = {
  rule: RewardRule;
  /** Cuánto falta: monto en COP (cart_amount) o unidades (item_count). */
  remaining: number;
  /** Progreso 0..1 hacia el objetivo. */
  progress: number;
};

export type RewardEvaluation = {
  unlocked: UnlockedReward[];
  totalDiscount: Money;
  freeShipping: boolean;
  giftProductIds: string[];
  /** La siguiente recompensa más cercana aún no desbloqueada, para la barra de progreso. */
  next: NextReward | null;
};

function currentValueFor(rule: RewardRule, ctx: RewardContext): number {
  return rule.conditionType === "cart_amount" ? ctx.subtotal.amount : ctx.totalUnits;
}

function isUnlocked(rule: RewardRule, ctx: RewardContext): boolean {
  return currentValueFor(rule, ctx) >= rule.targetValue;
}

/**
 * Evalúa las reglas de recompensa de forma determinista (sección 12). Aplica
 * en orden de prioridad; el cálculo es idéntico en cliente (respuesta
 * inmediata) y servidor (verificación antes de confirmar).
 */
export function evaluateRewards(rules: RewardRule[], ctx: RewardContext): RewardEvaluation {
  const active = rules
    .filter((rule) => rule.status === "active")
    .sort((a, b) => b.priority - a.priority);

  const unlocked: UnlockedReward[] = [];
  let totalDiscount = ZERO_COP;
  let freeShipping = false;
  const giftProductIds: string[] = [];

  for (const rule of active) {
    if (!isUnlocked(rule, ctx)) continue;

    let discount = ZERO_COP;
    let ruleFreeShipping = false;
    let giftProductId: string | null = null;

    switch (rule.rewardType) {
      case "free_shipping":
        ruleFreeShipping = true;
        freeShipping = true;
        break;
      case "fixed_discount":
        discount = money(Math.max(0, Math.round(rule.rewardValue ?? 0)));
        totalDiscount = add(totalDiscount, discount);
        break;
      case "percentage_discount":
        discount = percentageOf(ctx.subtotal, rule.rewardValue ?? 0);
        totalDiscount = add(totalDiscount, discount);
        break;
      case "free_product":
        giftProductId = rule.rewardProductId;
        if (giftProductId) giftProductIds.push(giftProductId);
        break;
    }

    unlocked.push({ rule, freeShipping: ruleFreeShipping, discount, giftProductId });
  }

  // Siguiente recompensa: la regla no desbloqueada con el objetivo más cercano por alcanzar.
  const pending = active
    .filter((rule) => !isUnlocked(rule, ctx))
    .map((rule) => {
      const current = currentValueFor(rule, ctx);
      const remaining = Math.max(0, rule.targetValue - current);
      const progress = rule.targetValue > 0 ? Math.min(1, current / rule.targetValue) : 1;
      return { rule, remaining, progress };
    })
    .sort((a, b) => a.remaining - b.remaining);

  return {
    unlocked,
    totalDiscount,
    freeShipping,
    giftProductIds,
    next: pending[0] ?? null,
  };
}
