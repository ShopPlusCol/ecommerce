import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { demoFaqs } from "@/lib/demo-data";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default function FaqPage() {
  const jsonLd = faqJsonLd(demoFaqs);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader title="Preguntas frecuentes" />
      <Section spacing="sm">
        <Container narrow>
          <div className="flex flex-col divide-y divide-border">
            {demoFaqs.map((faq) => (
              <details key={faq.question} className="py-4">
                <summary className="cursor-pointer list-none text-base font-medium text-text marker:content-none">
                  {faq.question}
                </summary>
                <p className="mt-2 text-text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-sm text-text-muted">
            El contenido completo de esta página será administrable desde el panel en la Fase 3.
          </p>
        </Container>
      </Section>
    </>
  );
}
