"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ScanFace } from "lucide-react";
import type { Product } from "@/domain/entities/catalog";
import type { TryOnTexture } from "@/domain/entities/try-on";
import { Button } from "@/components/ui/button";

const TryOnSimulator = dynamic(
  () => import("./try-on-simulator").then((module) => module.TryOnSimulator),
  {
    ssr: false,
    loading: () => (
      <p className="rounded-lg bg-surface-sunken p-4 text-sm text-text-muted" role="status">
        Preparando el simulador…
      </p>
    ),
  },
);

export function TryOnLauncher({
  products,
  textures,
}: {
  products: Product[];
  textures: TryOnTexture[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-4" aria-labelledby="try-on-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="try-on-title" className="font-display text-lg font-semibold text-text">
            Prueba el tono con una foto
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Vista orientativa procesada en tu dispositivo; tu foto no se sube ni se guarda.
          </p>
        </div>
        <Button type="button" variant={open ? "secondary" : "primary"} onClick={() => setOpen((value) => !value)}>
          <ScanFace className="h-4 w-4" aria-hidden="true" />
          {open ? "Cerrar simulador" : "Abrir simulador"}
        </Button>
      </div>
      {open ? <TryOnSimulator products={products} textures={textures} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
