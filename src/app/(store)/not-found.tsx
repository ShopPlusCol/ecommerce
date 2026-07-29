import Link from "next/link";
import { Compass } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <Section spacing="lg">
      <Container narrow className="flex flex-col items-center gap-4 text-center">
        <Compass className="h-10 w-10 text-text-subtle" aria-hidden="true" />
        <h1 className="text-2xl text-text">No encontramos esta página</h1>
        <p className="max-w-prose text-text-muted">
          Puede que el enlace esté mal escrito o que el producto ya no esté disponible. Prueba
          desde el catálogo o vuelve al inicio.
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="secondary">Ir al inicio</Button>
          </Link>
          <Link href="/catalogo">
            <Button>Ver catálogo</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
