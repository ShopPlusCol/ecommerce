import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhaseNotice } from "@/components/store/phase-notice";
import { getBrandSettings } from "@/modules/settings/brand";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage() {
  const brand = await getBrandSettings();
  const whatsappHref = `https://wa.me/${brand.whatsapp}`;

  return (
    <>
      <PageHeader title="Contacto y ayuda" description="Escríbenos por el canal que prefieras." />
      <Section spacing="sm">
        <Container narrow className="grid gap-6 sm:grid-cols-2">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Card className="h-full transition-shadow duration-base hover:shadow-md">
              <CardContent className="flex items-start gap-3">
                <MessageCircle className="h-6 w-6 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-medium text-text">WhatsApp</p>
                  <p className="text-sm text-text-muted">Respuesta rápida en horario de atención.</p>
                </div>
              </CardContent>
            </Card>
          </a>
          <a href={`mailto:${brand.email}`}>
            <Card className="h-full transition-shadow duration-base hover:shadow-md">
              <CardContent className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-medium text-text">Correo</p>
                  <p className="text-sm text-text-muted">{brand.email}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        </Container>

        <Container narrow className="mt-8">
          <form className="flex flex-col gap-4">
            <Input label="Nombre" placeholder="Tu nombre" required />
            <Input label="Correo" type="email" placeholder="tucorreo@ejemplo.com" required />
            <Input label="Mensaje" placeholder="¿En qué te ayudamos?" required />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled className="opacity-60">
                Enviar mensaje
              </Button>
              <PhaseNotice phase={3} />
            </div>
          </form>
        </Container>
      </Section>
    </>
  );
}
