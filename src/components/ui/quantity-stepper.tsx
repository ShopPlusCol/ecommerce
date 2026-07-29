"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuantityStepperProps = {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
};

/**
 * Control -/cantidad/+ reutilizable entre tarjeta de producto, página de
 * producto, carrito y checkout (sección 8.2). Presentacional: el estado y la
 * sincronización con el carrito se conectan en fases posteriores.
 */
export function QuantityStepper({
  quantity,
  min = 0,
  max = 99,
  onChange,
  size = "md",
  className,
  label = "Cantidad",
}: QuantityStepperProps) {
  const decrease = () => onChange(Math.max(min, quantity - 1));
  const increase = () => onChange(Math.min(max, quantity + 1));
  const height = size === "sm" ? "h-control-sm" : "h-control-md";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border-strong bg-surface-raised",
        height,
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={decrease}
        disabled={quantity <= min}
        aria-label="Disminuir cantidad"
        className="flex h-full w-9 items-center justify-center text-text disabled:opacity-40"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={quantity >= max}
        aria-label="Aumentar cantidad"
        className="flex h-full w-9 items-center justify-center text-text disabled:opacity-40"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
