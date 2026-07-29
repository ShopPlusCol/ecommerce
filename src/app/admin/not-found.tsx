import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-xl font-semibold text-text">Sección no encontrada</h1>
      <p className="max-w-prose text-sm text-text-muted">
        Esta sección del panel no existe o todavía no se ha construido.
      </p>
      <Link href="/admin">
        <Button variant="secondary">Volver al resumen</Button>
      </Link>
    </div>
  );
}
