import type { TestimonialsBlock as TestimonialsBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export function TestimonialsBlock({ config }: { config: TestimonialsBlockType["config"] }) {
  return (
    <Section spacing="sm" tone="sunken">
      <Container>
        <h2 className="text-center text-2xl text-text">{config.title}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {config.items.map((testimonial, index) => (
            <Reveal
              key={`${testimonial.name}-${testimonial.city}`}
              delayMs={index * 80}
              className="flex flex-col gap-4 rounded-xl bg-surface-raised p-6 shadow-xs"
            >
              <span className="font-display text-3xl leading-none text-brand" aria-hidden="true">
                &ldquo;
              </span>
              <p className="text-md text-text">{testimonial.quote}</p>
              <p className="mt-auto text-xs font-medium uppercase tracking-wide text-text-subtle">
                {testimonial.name} · {testimonial.city}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
