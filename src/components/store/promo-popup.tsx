"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Popup } from "@/domain/entities/promotions";

const SEEN_PREFIX = "sp:popup-seen:";
/** "once_per_period" no tiene un intervalo propio en el modelo; 7 días es un valor operativo razonable. */
const PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/** Tolera que alguien pegue una URL completa en vez de una ruta relativa. */
function normalizePathPattern(pattern: string): string {
  const trimmed = pattern.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).pathname || "/";
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function matchesPath(pathname: string, patterns: string[]) {
  return patterns.some((pattern) => {
    const normalized = normalizePathPattern(pattern);
    if (!normalized) return false;
    if (normalized === "/") return pathname === "/";
    return pathname === normalized || pathname.startsWith(`${normalized}/`);
  });
}

function isEligible(popup: Popup, pathname: string) {
  if (popup.includedPaths.length > 0 && !matchesPath(pathname, popup.includedPaths)) return false;
  if (matchesPath(pathname, popup.excludedPaths)) return false;
  if (popup.frequency === "always") return true;
  try {
    if (popup.frequency === "once_per_session") {
      return window.sessionStorage.getItem(`${SEEN_PREFIX}${popup.id}`) === null;
    }
    const lastSeenRaw = window.localStorage.getItem(`${SEEN_PREFIX}${popup.id}`);
    if (!lastSeenRaw) return true;
    const lastSeen = Number(lastSeenRaw);
    return Number.isNaN(lastSeen) || Date.now() - lastSeen > PERIOD_MS;
  } catch {
    return true;
  }
}

function markSeen(popup: Popup) {
  try {
    if (popup.frequency === "once_per_session") window.sessionStorage.setItem(`${SEEN_PREFIX}${popup.id}`, "1");
    else if (popup.frequency === "once_per_period") window.localStorage.setItem(`${SEEN_PREFIX}${popup.id}`, String(Date.now()));
  } catch {
    // Almacenamiento no disponible (modo privado): el pop-up puede repetirse, sin romper la navegación.
  }
}

/** Sección 14: un único pop-up visible a la vez, cierre evidente, sin bloquear contenido esencial. */
export function PromoPopup({ popups }: { popups: Popup[] }) {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState<Popup | null>(null);
  const shownRef = React.useRef(false);

  React.useEffect(() => {
    shownRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra el pop-up de la ruta anterior antes de evaluar disparadores nuevos
    setVisible(null);
    const candidates = popups.filter((popup) => isEligible(popup, pathname));
    if (candidates.length === 0) return;

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const cleanups: Array<() => void> = [];

    const trigger = (popup: Popup) => {
      if (shownRef.current) return;
      shownRef.current = true;
      setVisible(popup);
    };

    for (const popup of candidates) {
      const delayMs = Math.max(0, popup.delaySeconds) * 1000;
      timers.push(setTimeout(() => trigger(popup), delayMs));

      if (popup.triggerOnScrollPercent !== null) {
        const onScroll = () => {
          const doc = document.documentElement;
          const scrollable = doc.scrollHeight - doc.clientHeight;
          const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
          if (percent >= (popup.triggerOnScrollPercent ?? 100)) trigger(popup);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
      }

      if (popup.triggerOnExitIntent) {
        const onLeave = (event: MouseEvent) => {
          if (event.clientY <= 0) trigger(popup);
        };
        document.addEventListener("mouseleave", onLeave);
        cleanups.push(() => document.removeEventListener("mouseleave", onLeave));
      }
    }

    return () => {
      for (const timer of timers) clearTimeout(timer);
      for (const cleanup of cleanups) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reevaluarse por ruta; la lista de pop-ups activos es estable en la sesión
  }, [pathname]);

  const close = React.useCallback(() => {
    setVisible((current) => {
      if (current) markSeen(current);
      return null;
    });
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, close]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={visible.title ?? "Promoción"}
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        className="relative grid max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface-raised shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar promoción"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface-raised/90 text-text shadow-sm hover:bg-surface-sunken"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {visible.imageUrlDesktop || visible.imageUrlMobile ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-surface-sunken">
            {visible.imageUrlMobile ? (
              <Image src={visible.imageUrlMobile} alt="" fill sizes="480px" className="object-cover sm:hidden" unoptimized />
            ) : null}
            {visible.imageUrlDesktop ? (
              <Image
                src={visible.imageUrlDesktop}
                alt=""
                fill
                sizes="480px"
                className={visible.imageUrlMobile ? "hidden object-cover sm:block" : "object-cover"}
                unoptimized
              />
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-3 p-6 text-center">
          {visible.title ? <h2 className="font-display text-xl font-semibold text-text">{visible.title}</h2> : null}
          {visible.body ? <p className="text-sm text-text-muted">{visible.body}</p> : null}
          {visible.couponCode ? (
            <p className="justify-self-center rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
              Código: {visible.couponCode}
            </p>
          ) : null}
          {visible.ctaHref && visible.ctaLabel ? (
            <Link href={visible.ctaHref} onClick={close}>
              <Button fullWidth>{visible.ctaLabel}</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
