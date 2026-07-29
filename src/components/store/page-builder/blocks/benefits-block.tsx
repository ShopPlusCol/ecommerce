import type { BenefitsBlock as BenefitsBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export function BenefitsBlock({ config }: { config: BenefitsBlockType["config"] }) {
  return (
    <Section spacing="sm">
      <Container className="grid gap-6 sm:grid-cols-3">
        {config.items.map((item, index) => (
          <Reveal
            key={item.title}
            delayMs={index * 80}
            className="flex flex-col gap-2 border-t-2 border-brand/30 pt-4"
          >
            <span className="font-display text-sm font-semibold text-brand tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="font-display text-md font-semibold text-text">{item.title}</p>
            <p className="text-sm text-text-muted">{item.body}</p>
          </Reveal>
        ))}
      </Container>
    </Section>
  );
}
