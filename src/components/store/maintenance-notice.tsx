import { Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/lib/site-config";

export function MaintenanceNotice() {
  return (
    <Section spacing="lg">
      <Container narrow className="flex flex-col items-center gap-4 text-center">
        <Wrench className="h-10 w-10 text-text-subtle" aria-hidden="true" />
        <h1 className="text-2xl text-text">Estamos actualizando la tienda</h1>
        <p className="max-w-prose text-text-muted">
          Volvemos muy pronto. Si necesitas ayuda urgente, escríbenos por WhatsApp.
        </p>
        <a
          href={`https://wa.me/${siteConfig.contact.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          Escribir por WhatsApp
        </a>
      </Container>
    </Section>
  );
}
