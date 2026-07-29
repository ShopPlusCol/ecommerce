import Link from "next/link";
import type { ColorFamiliesBlock as ColorFamiliesBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { catalogRepository } from "@/lib/container";

export async function ColorFamiliesBlock({ config }: { config: ColorFamiliesBlockType["config"] }) {
  const [families, all] = await Promise.all([
    catalogRepository.listColorFamilies(),
    catalogRepository.listProducts({ pageSize: 200 }),
  ]);

  const countBySlug = new Map<string, number>();
  for (const product of all.products) {
    const slug = product.colorFamily?.slug;
    if (slug) countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
  }

  return (
    <Section spacing="sm">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Descubre por color</p>
            <h2 className="mt-1 text-2xl text-text">{config.title}</h2>
          </div>
          <Link href="/catalogo" className="hidden shrink-0 text-sm font-medium text-brand hover:text-brand-hover sm:block">
            Ver todo
          </Link>
        </div>

        {/* Fila con desplazamiento horizontal en móvil, cuadrícula en pantallas grandes */}
        <div className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
          {families.map((family, index) => {
            const count = countBySlug.get(family.slug) ?? 0;
            return (
              <Reveal
                key={family.id}
                delayMs={index * 60}
                className="min-w-[42%] snap-start sm:min-w-0"
              >
                <Link
                  href={`/categoria/${family.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-raised p-5 text-center transition-[transform,box-shadow] duration-base ease-standard hover:-translate-y-1 hover:shadow-md"
                >
                  <span
                    className="h-16 w-16 rounded-full ring-1 ring-black/5 transition-transform duration-base group-hover:scale-105"
                    style={{
                      background: family.hexSwatch
                        ? `radial-gradient(circle at 34% 30%, color-mix(in srgb, ${family.hexSwatch} 55%, white), ${family.hexSwatch} 78%)`
                        : undefined,
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-display text-base font-semibold text-text">{family.name}</span>
                  {count > 0 ? (
                    <span className="text-xs text-text-subtle">
                      {count} {count === 1 ? "tono" : "tonos"}
                    </span>
                  ) : null}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
