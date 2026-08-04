import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Check, Truck, X } from "lucide-react";
import type { HeroBlock as HeroBlockType } from "@/modules/page-builder/blocks";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatMoney } from "@/domain/value-objects/money";
import { getStoreOffer } from "@/modules/storefront/offer";

/**
 * Hero comercial. El primer pantallazo tiene que responder en segundos qué
 * se vende, a qué precio, qué incluye y bajo qué condición se entrega — por
 * eso el precio y la promesa de entrega no son texto fijo del bloque:
 *
 * - El precio sale del catálogo real (`{precio}` en `offerLabel`), así no
 *   puede quedar desincronizado con los productos.
 * - La promesa de "mismo día" solo se muestra si alguna ciudad la tiene
 *   configurada y la hora límite todavía no pasó, y siempre acompañada de
 *   su aclaración. Fuera de eso, la línea sencillamente no se renderiza.
 */
export async function HeroBlock({ config }: { config: HeroBlockType["config"] }) {
  const offer = await getStoreOffer();

  const priceText = offer.fromPrice ? formatMoney(offer.fromPrice) : null;
  const offerLabel =
    config.offerLabel && (priceText || !config.offerLabel.includes("{precio}"))
      ? config.offerLabel.replace("{precio}", priceText ?? "")
      : null;

  const hasImage = Boolean(config.imageUrl);

  return (
    <section className="relative overflow-hidden bg-surface">
      <Container className="grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-16">
        <div className="animate-hero-in flex flex-col gap-4 lg:gap-5">
          {config.eyebrow ? (
            <span className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-brand">
              <span className="h-px w-8 bg-brand" aria-hidden="true" />
              {config.eyebrow}
            </span>
          ) : null}

          <h1 className="max-w-[16ch] text-4xl text-text">{config.title}</h1>

          {offerLabel ? (
            <p className="text-2xl font-semibold text-text sm:text-3xl">{offerLabel}</p>
          ) : null}

          <p className="max-w-prose text-md text-text-muted lg:text-lg">{config.subtitle}</p>

          {/* Qué incluye y qué no: la duda que más consultas genera por WhatsApp. */}
          {config.includesNote || config.excludesNote ? (
            <ul className="flex flex-col gap-1.5 text-sm text-text-muted">
              {config.includesNote ? (
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-text">Incluye:</span> {config.includesNote}
                  </span>
                </li>
              ) : null}
              {config.excludesNote ? (
                <li className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-text">No incluye:</span> {config.excludesNote}
                  </span>
                </li>
              ) : null}
            </ul>
          ) : null}

          {offer.sameDayLabel ? (
            <p className="flex items-start gap-2 text-sm text-text-muted">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <span>
                {offer.sameDayLabel}
                <span className="text-text-subtle">
                  {" "}
                  — según zona, disponibilidad, día y hora del pedido
                  {offer.sameDay.earliestCutoffHour !== null
                    ? ` (antes de las ${offer.sameDay.earliestCutoffHour}:00)`
                    : ""}
                  .
                </span>
              </span>
            </p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link href={config.ctaHref}>
              <Button size="lg">
                {config.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {config.secondaryLabel && config.secondaryHref ? (
              <Link
                href={config.secondaryHref}
                className="text-sm font-medium text-text underline-offset-4 transition-colors hover:text-brand hover:underline"
              >
                {config.secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="animate-hero-in relative mx-auto w-full max-w-md lg:max-w-none" style={{ animationDelay: "80ms" }}>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-border shadow-md">
            {hasImage ? (
              <Image
                src={config.imageUrl as string}
                alt={config.imageAlt?.trim() || config.title}
                fill
                // Única imagen del primer pantallazo: se precarga, el resto
                // de la portada queda en carga diferida.
                priority
                fetchPriority="high"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : (
              /* Sin fotografía aprobada se mantiene un marcador honesto: no
                 se inventa una imagen que tergiverse el tono real del lente. */
              <div className="tk-photo-placeholder absolute inset-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="bg-gradient-iris h-40 w-40 rounded-full opacity-90 shadow-brand ring-8 ring-surface/60 lg:h-52 lg:w-52"
                    aria-hidden="true"
                  />
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-2xl bg-surface/80 px-4 py-3 backdrop-blur">
                  <Camera className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
                  <span className="text-xs text-text-muted">Espacio para la fotografía de campaña</span>
                </div>
              </div>
            )}
          </div>
          <span
            className="absolute -right-3 -top-3 hidden h-16 w-16 rounded-full bg-accent-rose-soft lg:block"
            aria-hidden="true"
          />
        </div>
      </Container>
    </section>
  );
}
