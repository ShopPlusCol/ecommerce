import Link from "next/link";
import { Compass } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <Section spacing="lg">
      <Container narrow className="flex flex-col items-center gap-4 text-center">
        <Compass className="h-10 w-10 text-text-subtle" aria-hidden="true" />
        <h1 className="text-2xl text-text">No encontramos esta página</h1>
        <p className="max-w-prose text-text-muted">
          El enlace que seguiste no existe o cambió de dirección.
        </p>
        <Link href="/">
          <Button>Ir al inicio</Button>
        </Link>
      </Container>
    </Section>
  );
}
