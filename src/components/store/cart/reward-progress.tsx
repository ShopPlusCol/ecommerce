"use client";

import { Gift, Check } from "lucide-react";
import type { RewardEvaluation } from "@/domain/services/rewards";
import { formatMoney, money } from "@/domain/value-objects/money";

function formatRemaining(conditionType: "cart_amount" | "item_count", remaining: number): string {
  return conditionType === "cart_amount" ? formatMoney(money(remaining)) : `${remaining} producto(s)`;
}

/** Barra de progreso hacia la siguiente recompensa (sección 12). */
export function RewardProgress({ rewards }: { rewards: RewardEvaluation }) {
  const unlockedFreeShipping = rewards.unlocked.find((u) => u.freeShipping);

  if (rewards.next) {
    const { rule, remaining, progress } = rewards.next;
    const message = rule.progressMessage.replace(
      "{remaining}",
      formatRemaining(rule.conditionType, remaining),
    );
    return (
      <div className="rounded-xl bg-brand-soft/60 p-3.5">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Gift className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          <span>{message}</span>
        </div>
        <div
          className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-raised"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-brand to-accent-rose transition-[width] duration-slow ease-emphasized"
            style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }}
          />
        </div>
      </div>
    );
  }

  if (unlockedFreeShipping) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-success-soft p-3.5 text-sm font-medium text-success">
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{unlockedFreeShipping.rule.unlockedMessage}</span>
      </div>
    );
  }

  return null;
}
