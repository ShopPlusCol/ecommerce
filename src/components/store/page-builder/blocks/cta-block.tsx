import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CtaBlock as CtaBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CtaBlock({ config }: { config: CtaBlockType["config"] }) {
  return (
    <Section spacing="sm">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-text px-6 py-14 text-center sm:px-10">
          <span className="bg-gradient-iris pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40" aria-hidden="true" />
          <span className="bg-gradient-iris pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full opacity-25" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-5">
            <h2 className="max-w-[18ch] text-3xl text-text-inverted">{config.title}</h2>
            <Link href={config.ctaHref}>
              <Button size="lg">
                {config.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
