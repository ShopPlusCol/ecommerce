import Link from "next/link";
import { Camera } from "lucide-react";
import type { ImageTextBlock as ImageTextBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export function ImageTextBlock({ config }: { config: ImageTextBlockType["config"] }) {
  return (
    <Section spacing="sm" tone="raised">
      <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal className={cn(config.reverse && "lg:order-2")}>
          {/* Zona de fotografía editorial (placeholder mientras no exista la imagen). */}
          <div className="tk-photo-placeholder relative aspect-[5/4] w-full overflow-hidden rounded-[24px] border border-border shadow-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-gradient-iris h-28 w-28 rounded-full opacity-90 ring-8 ring-surface/60" aria-hidden="true" />
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-2xl bg-surface/80 px-3 py-2 backdrop-blur">
              <Camera className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
              <span className="text-xs text-text-muted">Espacio para fotografía editorial</span>
            </div>
          </div>
        </Reveal>
        <Reveal className="flex flex-col gap-4" delayMs={80}>
          <h2 className="text-2xl text-text">{config.title}</h2>
          <p className="text-md text-text-muted">{config.body}</p>
          {config.ctaLabel && config.ctaHref ? (
            <Link href={config.ctaHref} className="w-fit">
              <Button variant="secondary">{config.ctaLabel}</Button>
            </Link>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}
