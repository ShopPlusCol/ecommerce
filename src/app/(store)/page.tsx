import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/store/product-card";
import { demoColorFamilies, demoFaqs, demoProducts, demoTestimonials } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Lentes de contacto cosméticos sin fórmula",
};

export default function HomePage() {
  const bestSellers = demoProducts.filter((p) => p.categoryIds.includes("cat-lentes")).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <Section spacing="lg" tone="raised" className="border-b border-border">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              Nueva colección de temporada
            </span>
            <h1 className="text-3xl text-text">
              Cambia tu mirada, sin complicarte.
            </h1>
            <p className="max-w-prose text-lg text-text-muted">
              Lentes de contacto cosméticos sin fórmula, en tonos que se ven naturales en cualquier
              color de ojos. Entrega el mismo día en Medellín.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogo">
                <Button size="lg">
                  Ver catálogo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cuidados">
                <Button size="lg" variant="secondary">
                  Cómo elegir mi tono
                </Button>
              </Link>
            </div>
          </div>
          <div className="aspect-[4/3] w-full rounded-xl bg-linear-to-br from-[var(--tk-cherry-100)] to-[var(--tk-cream-200)]" />
        </Container>
      </Section>

      {/* Accesos rápidos por familia de color */}
      <Section spacing="sm">
        <Container>
          <h2 className="text-xl text-text">Elige por tono</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {demoColorFamilies.map((family) => (
              <Link
                key={family.id}
                href={`/categoria/${family.slug}`}
                className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-raised p-4 text-center transition-shadow duration-base hover:shadow-md"
              >
                <span
                  className="h-12 w-12 rounded-full border border-border-strong"
                  style={{ backgroundColor: family.hexSwatch ?? undefined }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-text">{family.name}</span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Más vendidos */}
      <Section spacing="sm" tone="sunken">
        <Container>
          <div className="flex items-end justify-between">
            <h2 className="text-xl text-text">Más vendidos</h2>
            <Link href="/catalogo" className="text-sm font-medium text-brand hover:text-brand-hover">
              Ver todo
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Beneficios / confianza */}
      <Section spacing="sm">
        <Container className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Entrega el mismo día", body: "En Medellín y el Área Metropolitana, pidiendo antes de la hora límite." },
            { title: "Pago contraentrega", body: "Paga en efectivo o datáfono cuando recibas tu pedido en Medellín." },
            { title: "Cuidado guiado", body: "Guía de uso e higiene incluida con cada compra." },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent>
                <p className="font-display text-md font-semibold text-text">{item.title}</p>
                <p className="mt-1 text-sm text-text-muted">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </Container>
      </Section>

      {/* Testimonios */}
      <Section spacing="sm" tone="sunken">
        <Container>
          <h2 className="text-xl text-text">Lo que dicen nuestras clientas</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {demoTestimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent>
                  <p className="text-sm text-text">“{testimonial.quote}”</p>
                  <p className="mt-3 text-xs font-medium text-text-muted">
                    {testimonial.name} · {testimonial.city}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ breve */}
      <Section spacing="sm">
        <Container narrow>
          <h2 className="text-xl text-text">Preguntas frecuentes</h2>
          <div className="mt-6 flex flex-col divide-y divide-border">
            {demoFaqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-text marker:content-none">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
          <Link
            href="/preguntas-frecuentes"
            className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand-hover"
          >
            Ver todas las preguntas
          </Link>
        </Container>
      </Section>

      {/* CTA final */}
      <Section spacing="sm" tone="raised" className="border-t border-border">
        <Container className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-xl text-text">¿Lista para encontrar tu tono?</h2>
          <Link href="/catalogo">
            <Button size="lg">
              Explorar catálogo <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Container>
      </Section>
    </>
  );
}
