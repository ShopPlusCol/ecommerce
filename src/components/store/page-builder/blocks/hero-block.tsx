import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import type { HeroBlock as HeroBlockType } from "@/modules/page-builder/blocks";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Hero editorial. La columna visual deja preparada una zona clara para la
 * fotografía de campaña (modelo o macro de ojos) con un placeholder elegante
 * —no un rectángulo vacío— mientras no exista la imagen definitiva. Cuando el
 * panel permita subir la imagen (Fase 3), reemplaza este placeholder.
 */
export function HeroBlock({ config }: { config: HeroBlockType["config"] }) {
  return (
    <section className="relative overflow-hidden bg-surface">
      <Container className="grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-16">
        <div className="animate-hero-in flex flex-col gap-5 lg:gap-6">
          {config.eyebrow ? (
            <span className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-brand">
              <span className="h-px w-8 bg-brand" aria-hidden="true" />
              {config.eyebrow}
            </span>
          ) : null}
          <h1 className="max-w-[16ch] text-4xl text-text">{config.title}</h1>
          <p className="max-w-prose text-md text-text-muted lg:text-lg">{config.subtitle}</p>
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

        {/* Zona de fotografía (placeholder elegante) */}
        <div className="animate-hero-in relative mx-auto w-full max-w-md lg:max-w-none" style={{ animationDelay: "80ms" }}>
          <div className="tk-photo-placeholder relative aspect-[4/5] w-full rounded-[28px] border border-border shadow-md">
            {/* Insinuación de macro de iris, guiño a la categoría */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-gradient-iris h-40 w-40 rounded-full opacity-90 shadow-brand ring-8 ring-surface/60 lg:h-52 lg:w-52" aria-hidden="true" />
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-2xl bg-surface/80 px-4 py-3 backdrop-blur">
              <Camera className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
              <span className="text-xs text-text-muted">Espacio para la fotografía de campaña</span>
            </div>
          </div>
          {/* Acento flotante sutil */}
          <span
            className="absolute -right-3 -top-3 hidden h-16 w-16 rounded-full bg-accent-rose-soft lg:block"
            aria-hidden="true"
          />
        </div>
      </Container>
    </section>
  );
}
