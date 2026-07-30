"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderFinancialSummary } from "@/components/store/checkout/order-financial-summary";
import { useCart } from "@/modules/cart/cart-context";
import { useAnalytics } from "@/modules/analytics/analytics-context";
import { computeOrderSummary, computeSubtotal, totalUnits as sumUnits } from "@/domain/services/cart-pricing";
import { evaluateRewards } from "@/domain/services/rewards";
import { PAYMENT_METHOD_LABELS, type PaymentMethodId } from "@/domain/services/payments";
import { formatMoney } from "@/domain/value-objects/money";
import type { ShippingQuote } from "@/application/ports/shipping-rate-resolver";
import { COLOMBIA_DEPARTMENTS } from "@/lib/colombia-departments";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { quoteShippingAction, createDemoOrderAction } from "@/app/(store)/actions";
import { listShippingCitiesAction, listShippingNeighborhoodsAction } from "@/app/(store)/shipping-location-actions";
import { LAST_ORDER_KEY, resolveCheckoutDestination } from "@/modules/checkout/last-order";

type Contact = { fullName: string; phone: string; email: string };
type LocationForm = {
  department: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  addressComplement: string;
  deliveryInstructions: string;
};

const EMPTY_LOCATION: LocationForm = {
  department: "",
  city: "",
  neighborhood: "",
  addressLine: "",
  addressComplement: "",
  deliveryInstructions: "",
};

export function CheckoutClient() {
  const { cart, lines, coupon, rewards, rewardRules, totals, clearCart, isHydrated } = useCart();
  const { track, consent: analyticsConsent } = useAnalytics();
  const idempotencyKey = React.useRef(crypto.randomUUID());

  const [contact, setContact] = React.useState<Contact>({ fullName: "", phone: "", email: "" });
  const [location, setLocation] = React.useState<LocationForm>(EMPTY_LOCATION);
  const [quote, setQuote] = React.useState<ShippingQuote | null>(null);
  const [methods, setMethods] = React.useState<PaymentMethodId[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodId | null>(null);
  const [quoteStatus, setQuoteStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [quoteError, setQuoteError] = React.useState<string | null>(null);
  const [cities, setCities] = React.useState<string[]>([]);
  const [configuredNeighborhoods, setConfiguredNeighborhoods] = React.useState<string[]>([]);
  const [consent, setConsent] = React.useState({ terms: false, marketing: false });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const initiatedRef = React.useRef(false);
  React.useEffect(() => {
    if (initiatedRef.current || lines.length === 0) return;
    initiatedRef.current = true;
    track("InitiateCheckout", {
      value: totals.productsTotal.amount,
      currency: "COP",
      contentIds: lines.map((l) => l.productId),
      contentType: "product",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  // Ciudades/municipios configurados y activos para el departamento elegido
  // (sección 17.3): si el departamento no tiene ninguna, el checkout no pide
  // ciudad y usa directamente la configuración del departamento.
  React.useEffect(() => {
    if (!location.department) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia la lista al cambiar de departamento
      setCities([]);
      return;
    }
    let cancelled = false;
    listShippingCitiesAction(location.department).then((names) => {
      if (!cancelled) setCities(names);
    });
    return () => {
      cancelled = true;
    };
  }, [location.department]);

  const cityRequired = cities.length > 0;

  // Cotización de envío cuando hay departamento (y ciudad, si el
  // departamento tiene ciudades configuradas) — sección 17.
  const subtotalAmount = computeSubtotal(cart).amount;
  React.useEffect(() => {
    // Efecto de obtención de datos: cotiza el envío en el servidor (sistema
    // externo) y refleja los estados de carga/resultado. El "setState" en el
    // cuerpo es intencional para el estado de carga inmediato.
    if (!location.department || (cityRequired && !location.city)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset del estado de cotización externa
      setQuote(null);
      setQuoteStatus("idle");
      return;
    }
    let cancelled = false;
    setQuoteStatus("loading");
    setQuoteError(null);
    quoteShippingAction({
      destination: {
        country: "CO",
        department: location.department,
        city: location.city,
        neighborhood: location.neighborhood || null,
      },
      productsTotal: subtotalAmount,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setQuote(result.quote);
        setMethods(result.methods);
        setPaymentMethod((prev) => (prev && result.methods.includes(prev) ? prev : result.methods[0] ?? null));
        setQuoteStatus("ready");
      } else {
        setQuote(null);
        setMethods([]);
        setPaymentMethod(null);
        setQuoteStatus("error");
        setQuoteError(result.reason);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.department, location.city, location.neighborhood, cityRequired, subtotalAmount]);

  // Barrios configurados y activos para la ciudad elegida (sección 17.3).
  React.useEffect(() => {
    if (!location.city) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia la lista al cambiar de ciudad
      setConfiguredNeighborhoods([]);
      return;
    }
    let cancelled = false;
    listShippingNeighborhoodsAction(location.department, location.city).then((names) => {
      if (!cancelled) setConfiguredNeighborhoods(names);
    });
    return () => {
      cancelled = true;
    };
  }, [location.department, location.city]);

  // Con destino conocido, las recompensas se recalculan con las zonas que
  // cubren la dirección (sección 12): un envío gratis restringido a zonas
  // solo se confirma aquí, nunca antes de tener una cotización real.
  const zoneAwareRewards = React.useMemo(() => {
    if (!quote) return rewards;
    return evaluateRewards(rewardRules, {
      subtotal: computeSubtotal(cart),
      totalUnits: sumUnits(cart),
      zoneIds: quote.matchingZoneIds,
    });
  }, [cart, rewardRules, rewards, quote]);

  const summary = React.useMemo(() => {
    if (!quote || !paymentMethod) return null;
    return computeOrderSummary(cart, { coupon, rewards: zoneAwareRewards, shippingQuote: quote, paymentMethod });
  }, [cart, coupon, zoneAwareRewards, quote, paymentMethod]);

  if (!isHydrated) {
    return <p className="text-sm text-text-muted">Cargando…</p>;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title="Tu carrito está vacío"
        description="Agrega productos antes de continuar al pago."
        action={
          <Link href="/catalogo">
            <Button>Ir al catálogo</Button>
          </Link>
        }
      />
    );
  }

  const neighborhoodOptions = configuredNeighborhoods;
  const showNeighborhoodSelect = neighborhoodOptions.length > 0;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (contact.fullName.trim().length < 2) next.fullName = "Ingresa tu nombre completo.";
    if (contact.phone.replace(/\D/g, "").length < 7) next.phone = "Ingresa un teléfono válido.";
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) next.email = "Correo inválido.";
    if (!location.department) next.department = "Selecciona el departamento.";
    if (cityRequired && !location.city) next.city = "Selecciona la ciudad o municipio.";
    if (!showNeighborhoodSelect && location.neighborhood.trim().length < 2) next.neighborhood = "Escribe tu barrio o sector.";
    if (location.addressLine.trim().length < 3) next.addressLine = "Ingresa la dirección.";
    if (!quote) next.quote = "Necesitamos una dirección con cobertura para calcular el envío.";
    if (!paymentMethod) next.paymentMethod = "Selecciona un método de pago.";
    if (!consent.terms) next.terms = "Debes aceptar los términos y la política de privacidad.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate() || !paymentMethod) return;

    setSubmitting(true);
    const result = await createDemoOrderAction({
      idempotencyKey: idempotencyKey.current,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      couponCode: coupon?.code ?? null,
      destination: {
        country: "CO",
        department: location.department,
        city: location.city,
        neighborhood: location.neighborhood || null,
      },
      paymentMethod,
      contact: {
        fullName: contact.fullName.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        addressLine: location.addressLine.trim(),
        addressComplement: location.addressComplement.trim(),
        deliveryInstructions: location.deliveryInstructions.trim(),
      },
      consent: { ...consent, analytics: analyticsConsent.analytics },
    });
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    try {
      window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(result.order));
    } catch {
      // Si no hay sessionStorage, la confirmación mostrará un estado genérico.
    }
    clearCart();
    window.location.assign(resolveCheckoutDestination(result.order.checkoutUrl));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        {/* Contacto */}
        <Card>
          <CardContent className="flex flex-col gap-4">
            <StepHeading step={1} title="Contacto" />
            <Input
              label="Nombre completo"
              required
              value={contact.fullName}
              onChange={(e) => setContact((c) => ({ ...c, fullName: e.target.value }))}
              error={errors.fullName}
              autoComplete="name"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Teléfono"
                required
                type="tel"
                inputMode="tel"
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                error={errors.phone}
                autoComplete="tel"
              />
              <Input
                label="Correo (opcional)"
                type="email"
                inputMode="email"
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                error={errors.email}
                helperText="Para enviarte la confirmación."
                autoComplete="email"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ubicación y entrega */}
        <Card>
          <CardContent className="flex flex-col gap-4">
            <StepHeading step={2} title="Ubicación y entrega" />
            <div className="grid gap-4 sm:grid-cols-2">
              <SearchableSelect
                label="Departamento"
                required
                value={location.department}
                error={errors.department}
                onChange={(value) => setLocation((l) => ({ ...l, department: value, city: "", neighborhood: "" }))}
                options={COLOMBIA_DEPARTMENTS}
                placeholder="Escribe para buscar…"
              />
              {cityRequired ? (
                <SearchableSelect
                  label="Ciudad o municipio"
                  required
                  value={location.city}
                  error={errors.city}
                  onChange={(value) => setLocation((l) => ({ ...l, city: value, neighborhood: "" }))}
                  options={cities}
                  placeholder="Escribe para buscar…"
                />
              ) : null}
            </div>

            {showNeighborhoodSelect ? (
              <SearchableSelect
                label="Barrio o sector"
                value={location.neighborhood}
                onChange={(value) => setLocation((l) => ({ ...l, neighborhood: value }))}
                options={neighborhoodOptions}
                placeholder="Escribe para buscar…"
              />
            ) : (
              <Input
                label="Barrio o sector"
                required
                value={location.neighborhood}
                onChange={(e) => setLocation((l) => ({ ...l, neighborhood: e.target.value }))}
                error={errors.neighborhood}
              />
            )}

            <Input
              label="Dirección"
              required
              placeholder="Calle 10 # 20-30"
              value={location.addressLine}
              onChange={(e) => setLocation((l) => ({ ...l, addressLine: e.target.value }))}
              error={errors.addressLine}
              autoComplete="street-address"
            />
            <Input
              label="Apartamento, torre, bloque (opcional)"
              value={location.addressComplement}
              onChange={(e) => setLocation((l) => ({ ...l, addressComplement: e.target.value }))}
            />
            <Input
              label="Indicaciones de entrega (opcional)"
              value={location.deliveryInstructions}
              onChange={(e) => setLocation((l) => ({ ...l, deliveryInstructions: e.target.value }))}
            />

            {quoteStatus === "loading" ? (
              <p className="flex items-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Calculando envío…
              </p>
            ) : null}
            {quoteStatus === "error" ? (
              <p className="rounded-md bg-warning-soft p-3 text-sm text-warning" role="alert">
                {quoteError}
              </p>
            ) : null}
            {quote ? (
              <div className="rounded-md bg-surface-sunken p-3 text-sm text-text-muted">
                <p className="font-medium text-text">
                  Envío: {quote.fee.amount === 0 ? "Gratis" : formatMoney(quote.fee)}
                </p>
                <p>{quote.customerMessage}</p>
                <p className="text-xs text-text-subtle">
                  Entrega estimada: {quote.estimatedBusinessDaysMin === 0 ? "hoy" : `${quote.estimatedBusinessDaysMin}`}
                  {quote.estimatedBusinessDaysMax > quote.estimatedBusinessDaysMin
                    ? ` a ${quote.estimatedBusinessDaysMax} días hábiles`
                    : quote.estimatedBusinessDaysMin === 0
                      ? ""
                      : " día(s) hábil(es)"}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Pago */}
        <Card>
          <CardContent className="flex flex-col gap-4">
            <StepHeading step={3} title="Método de pago" />
            {methods.length === 0 ? (
              <p className="text-sm text-text-muted">
                Completa tu dirección para ver los métodos de pago disponibles en tu zona.
              </p>
            ) : (
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Método de pago">
                {methods.map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                      paymentMethod === method ? "border-brand bg-brand-soft/50" : "border-border-strong hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => {
                        setPaymentMethod(method);
                        track("AddPaymentInfo", { extra: { method } });
                      }}
                      className="mt-0.5 accent-[var(--tk-cherry-500)]"
                    />
                    <span className="text-text">{PAYMENT_METHOD_LABELS[method]}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.paymentMethod ? (
              <p className="text-sm text-danger" role="alert">
                {errors.paymentMethod}
              </p>
            ) : null}
            <p className="rounded-md bg-info-soft p-3 text-xs text-info">
              El pedido se registra al confirmar. Mercado Pago solo aparece cuando está configurado;
              las transferencias quedan pendientes de revisión y un comprobante no equivale a pago aprobado.
            </p>
          </CardContent>
        </Card>

        {/* Consentimiento */}
        <Card>
          <CardContent className="flex flex-col gap-3">
            <label className="flex items-start gap-3 text-sm text-text">
              <input
                type="checkbox"
                checked={consent.terms}
                onChange={(e) => setConsent((c) => ({ ...c, terms: e.target.checked }))}
                className="mt-0.5 accent-[var(--tk-cherry-500)]"
              />
              <span>
                Acepto los{" "}
                <Link href="/terminos" className="text-brand hover:text-brand-hover">
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="text-brand hover:text-brand-hover">
                  política de privacidad
                </Link>
                .
              </span>
            </label>
            {errors.terms ? (
              <p className="text-sm text-danger" role="alert">
                {errors.terms}
              </p>
            ) : null}
            <label className="flex items-start gap-3 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent((c) => ({ ...c, marketing: e.target.checked }))}
                className="mt-0.5 accent-[var(--tk-cherry-500)]"
              />
              <span>Quiero recibir novedades y promociones (opcional).</span>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="font-display text-md font-semibold text-text">Resumen del pedido</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {lines.map((line) => (
                <li key={`${line.productId}:${line.variantId ?? ""}`} className="flex justify-between gap-2">
                  <span className="text-text-muted">
                    {line.quantity} × {line.name}
                  </span>
                  <span className="tabular-nums text-text">{formatMoney({ amount: line.unitPrice.amount * line.quantity, currency: "COP" })}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3">
              {summary ? (
                <OrderFinancialSummary summary={summary} />
              ) : (
                <p className="text-sm text-text-muted">
                  Completa tu dirección y método de pago para ver qué pagas ahora y qué pagas al recibir.
                </p>
              )}
            </div>
            {submitError ? (
              <p className="rounded-md bg-danger-soft p-3 text-sm text-danger" role="alert">
                {submitError}
              </p>
            ) : null}
            <Button type="submit" size="lg" fullWidth isLoading={submitting} disabled={!summary}>
              Confirmar pedido
            </Button>
            <p className="text-center text-xs text-text-subtle">
              Los precios, descuentos, envío, método y stock se validan nuevamente en el servidor.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-contrast tabular-nums">
        {step}
      </span>
      <h2 className="font-display text-md font-semibold text-text">{title}</h2>
    </div>
  );
}

