"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/media-type";
import type { ProductMedia } from "@/domain/entities/catalog";

const SWIPE_THRESHOLD_PX = 60;

function MediaFrame({
  item,
  sizes,
  priority,
  fit = "cover",
  videoProps,
}: {
  item: ProductMedia;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
}) {
  if (isVideoUrl(item.url)) {
    return (
      <video
        src={item.url}
        aria-label={item.altText}
        className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain")}
        {...videoProps}
      />
    );
  }
  return (
    <Image
      src={item.url}
      alt={item.altText}
      fill
      priority={priority}
      sizes={sizes}
      className={fit === "cover" ? "object-cover" : "object-contain"}
    />
  );
}

/**
 * Visor ampliado (sección 8.4): superpuesto a pantalla completa con
 * navegación por flechas, teclado y arrastre táctil/mouse entre elementos.
 * Sigue el mismo patrón de diálogo accesible que el carrito (bloqueo de
 * scroll, cierre con Escape, foco devuelto al disparador).
 */
function ProductLightbox({
  items,
  index,
  productName,
  onIndexChange,
  onClose,
}: {
  items: ProductMedia[];
  index: number;
  productName: string;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const dragState = React.useRef<{ startX: number; dragging: boolean; offset: number } | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const go = React.useCallback(
    (delta: number) => {
      const next = (index + delta + items.length) % items.length;
      onIndexChange(next);
    },
    [index, items.length, onIndexChange],
  );

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, go]);

  const active = items[index];

  const onPointerDown = (event: React.PointerEvent) => {
    dragState.current = { startX: event.clientX, dragging: true, offset: 0 };
    setIsDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Algunos navegadores rechazan capturar un puntero que ya no está
      // activo; el arrastre sigue funcionando igual sin la captura.
    }
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragState.current?.dragging) return;
    // El offset vive también en el ref (no solo en el estado) porque
    // pointerup puede llegar antes de que React re-renderice tras el
    // último pointermove; leer el estado ahí daría un valor obsoleto.
    dragState.current.offset = event.clientX - dragState.current.startX;
    setDragOffset(dragState.current.offset);
  };
  const endDrag = () => {
    if (!dragState.current) return;
    const offset = dragState.current.offset;
    if (offset <= -SWIPE_THRESHOLD_PX) go(1);
    else if (offset >= SWIPE_THRESHOLD_PX) go(-1);
    dragState.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visor ampliado de ${productName}`}
      className="fixed inset-0 z-[60] flex flex-col bg-[rgba(12,10,9,0.92)]"
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 text-white">
        <span className="text-sm text-white/70">
          {index + 1} / {items.length}
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar visor"
          className="flex h-control-md w-control-md items-center justify-center rounded-md hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        {items.length > 1 ? (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Elemento anterior"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div
          className="relative h-full w-full max-w-3xl touch-pan-y select-none"
          style={{ transform: `translateX(${dragOffset}px)`, transition: isDragging ? "none" : "transform 150ms ease-out" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <MediaFrame item={active} sizes="100vw" fit="contain" videoProps={{ controls: true, autoPlay: true, loop: true, playsInline: true, className: "h-full w-full object-contain" }} />
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Elemento siguiente"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ProductGallery({
  media,
  productName,
  badge,
}: {
  media: ProductMedia[];
  productName: string;
  badge?: React.ReactNode;
}) {
  const items = React.useMemo(() => [...media].sort((a, b) => a.order - b.order), [media]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const openTriggerRef = React.useRef<HTMLButtonElement>(null);

  if (items.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[24px] bg-surface-sunken shadow-sm">
        {badge}
      </div>
    );
  }

  const active = items[activeIndex] ?? items[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <button
          ref={openTriggerRef}
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block aspect-square w-full overflow-hidden rounded-[24px] bg-surface-sunken shadow-sm"
          aria-label={`Ampliar ${active.altText || productName}`}
        >
          <MediaFrame item={active} priority sizes="(min-width: 1024px) 50vw, 100vw" videoProps={{ muted: true, loop: true, playsInline: true, autoPlay: true, className: "h-full w-full object-cover" }} />
          <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Expand className="h-4 w-4" />
          </span>
        </button>
        {badge}
        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current - 1 + items.length) % items.length)}
              aria-label="Elemento anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface-raised/90 text-text shadow-sm hover:bg-surface-raised"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % items.length)}
              aria-label="Elemento siguiente"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface-raised/90 text-text shadow-sm hover:bg-surface-raised"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Elementos de la galería">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={item.altText || `Elemento ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-sunken",
                index === activeIndex ? "border-brand" : "border-transparent",
              )}
            >
              <MediaFrame item={item} sizes="64px" videoProps={{ muted: true, playsInline: true, preload: "metadata", className: "h-full w-full object-cover" }} />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <ProductLightbox
          items={items}
          index={activeIndex}
          productName={productName}
          onIndexChange={setActiveIndex}
          onClose={() => {
            setLightboxOpen(false);
            openTriggerRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
