"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Aparición progresiva al entrar al viewport (sección 5.3). Solo alterna un
 * atributo `data-visible`; la animación (transform + opacity) vive en CSS y se
 * neutraliza con prefers-reduced-motion. Sin dependencias.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Sin IntersectionObserver (SSR/navegadores antiguos): mostrar de una vez.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback sin observador
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      data-visible={visible ? "true" : "false"}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
