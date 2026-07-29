"use server";

import { z } from "zod";
import { money } from "@/domain/value-objects/money";
import {
  PAYMENT_METHOD_LABELS,
  availablePaymentMethods,
  type PaymentMethodId,
} from "@/domain/services/payments";
import { shippingResolver } from "@/lib/container";
import { requirePermission } from "@/modules/auth/session";

export type AdminShippingQuoteState = {
  status: "idle" | "success" | "error";
  message: string;
  quote?: {
    ruleId: string;
    ruleLevel: string;
    fee: number;
    freeShippingThreshold: number | null;
    methods: Array<{ id: PaymentMethodId; label: string }>;
    requiresAdvancePayment: boolean;
    advancePercentage: number | null;
    estimatedBusinessDaysMin: number;
    estimatedBusinessDaysMax: number;
    customerMessage: string;
  };
};

const schema = z.object({
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  department: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().max(120),
  cartTotal: z.coerce.number().int().nonnegative(),
});

export async function quoteShippingAdminAction(
  _state: AdminShippingQuoteState,
  formData: FormData,
): Promise<AdminShippingQuoteState> {
  try {
    await requirePermission("shipping", "read");
    const input = schema.parse(Object.fromEntries(formData));
    const quote = await shippingResolver.resolve(
      {
        country: input.country,
        department: input.department,
        city: input.city,
        neighborhood: input.neighborhood || null,
      },
      money(input.cartTotal),
    );
    if (!quote) {
      return {
        status: "error",
        message:
          "Ninguna regla activa coincide con el destino, vigencia y valor del pedido. Se requiere cotización manual.",
      };
    }
    const methods = availablePaymentMethods(quote);
    return {
      status: "success",
      message: "Cotización resuelta con el mismo motor utilizado por el checkout.",
      quote: {
        ruleId: quote.ruleId,
        ruleLevel: quote.ruleLevel,
        fee: quote.fee.amount,
        freeShippingThreshold: quote.freeShippingThreshold?.amount ?? null,
        methods: methods.map((id) => ({ id, label: PAYMENT_METHOD_LABELS[id] })),
        requiresAdvancePayment: quote.requiresAdvancePayment,
        advancePercentage: quote.advancePercentage,
        estimatedBusinessDaysMin: quote.estimatedBusinessDaysMin,
        estimatedBusinessDaysMax: quote.estimatedBusinessDaysMax,
        customerMessage: quote.customerMessage,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible simular la tarifa.",
    };
  }
}
