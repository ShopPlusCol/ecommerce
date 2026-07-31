import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { faqs } from "@/infrastructure/db/schema";
import { faqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default async function FaqPage() {
  const db = await getRuntimeDb();
  const rows = await db.select().from(faqs).where(eq(faqs.status, "published")).orderBy(asc(faqs.order));
  const jsonLd = faqJsonLd(rows);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader title="Preguntas frecuentes" />
      <Section spacing="sm">
        <Container narrow>
          {rows.length ? (
            <div className="flex flex-col divide-y divide-border">
              {rows.map((faq) => (
                <details key={faq.id} className="py-4">
                  <summary className="cursor-pointer list-none text-base font-medium text-text marker:content-none">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-text-muted">Todavía no hay preguntas frecuentes publicadas.</p>
          )}
        </Container>
      </Section>
    </>
  );
}
