import { BadgeCheck } from "lucide-react";
import type { TestimonialsBlock as TestimonialsBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * Testimonios. Publicar reseñas inventadas no es una decisión de diseño sino
 * un problema de honestidad comercial (y de riesgo legal), así que la regla
 * la aplica el componente, no la disciplina de quien edita:
 *
 * - En producción solo se renderizan los testimonios con `verified: true`.
 *   Si no queda ninguno, la sección entera desaparece en vez de mostrar un
 *   encabezado vacío.
 * - En desarrollo sí se ven los no verificados, marcados como EJEMPLO, para
 *   poder trabajar el diseño sin que ese contenido llegue nunca a la tienda.
 */
export function TestimonialsBlock({ config }: { config: TestimonialsBlockType["config"] }) {
  const isProduction = process.env.NODE_ENV === "production";
  const items = isProduction ? config.items.filter((item) => item.verified === true) : config.items;

  if (items.length === 0) return null;

  return (
    <Section spacing="sm" tone="sunken">
      <Container>
        <h2 className="text-center text-2xl text-text">{config.title}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {items.map((testimonial, index) => (
            <Reveal
              key={`${testimonial.name}-${testimonial.city}`}
              delayMs={index * 80}
              className="flex flex-col gap-4 rounded-xl bg-surface-raised p-6 shadow-xs"
            >
              <span className="font-display text-3xl leading-none text-brand" aria-hidden="true">
                &ldquo;
              </span>
              <p className="text-md text-text">{testimonial.quote}</p>
              <div className="mt-auto flex flex-col gap-1">
                <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {testimonial.name} · {testimonial.city}
                  {testimonial.product ? ` · ${testimonial.product}` : ""}
                </p>
                {testimonial.verified ? (
                  <span className="flex items-center gap-1 text-xs text-brand">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Compra verificada
                  </span>
                ) : (
                  <span className="w-fit rounded bg-accent-rose-soft px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text">
                    Ejemplo · no se publica
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
