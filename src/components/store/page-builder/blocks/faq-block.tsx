import Link from "next/link";
import { Plus } from "lucide-react";
import type { FaqBlock as FaqBlockType } from "@/modules/page-builder/blocks";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";

export function FaqBlock({ config }: { config: FaqBlockType["config"] }) {
  return (
    <Section spacing="sm">
      <Container narrow>
        <h2 className="text-2xl text-text">{config.title}</h2>
        <div className="mt-6 flex flex-col divide-y divide-border border-y border-border">
          {config.items.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-text marker:content-none">
                {faq.question}
                <Plus
                  className="h-4 w-4 shrink-0 text-text-subtle transition-transform duration-base group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2 text-sm text-text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
        {config.viewAllHref ? (
          <Link
            href={config.viewAllHref}
            className="mt-5 inline-block text-sm font-medium text-brand underline-offset-4 hover:text-brand-hover hover:underline"
          >
            Ver todas las preguntas
          </Link>
        ) : null}
      </Container>
    </Section>
  );
}
