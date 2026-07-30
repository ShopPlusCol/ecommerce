"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { reorderBlocksAction } from "./actions";
import { BlockEditor } from "./editor-forms";

type Section = { id: string; blockType: string; config: Record<string, unknown>; visibleOnMobile: boolean; visibleOnDesktop: boolean };

/**
 * Arrastrar y soltar es una capa opcional sobre el orden persistido: cada
 * bloque conserva también sus botones ↑/↓ (BlockEditor) como alternativa
 * accesible por teclado, ya que el drag-and-drop nativo no es operable sin
 * mouse/touch.
 */
export function BlockList({
  pageId,
  sections,
  media,
}: {
  pageId: string;
  sections: Section[];
  media: Array<{ url: string; label: string }>;
}) {
  const [state, formAction] = useActionState(reorderBlocksAction, INITIAL_ADMIN_ACTION_STATE);
  const [, startTransition] = useTransition();
  const [order, setOrder] = useState(() => sections.map((section) => section.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const serverIds = sections.map((section) => section.id).join("|");
  const items = useMemo(() => {
    const known = new Set(sections.map((section) => section.id));
    const matches = order.length === sections.length && order.every((id) => known.has(id));
    return matches ? order : sections.map((section) => section.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se recalcula a partir de `order` o de los IDs frescos del servidor
  }, [order, serverIds]);

  const byId = new Map(sections.map((section) => [section.id, section]));

  function commit(nextOrder: string[]) {
    setOrder(nextOrder);
    const formData = new FormData();
    formData.set("pageId", pageId);
    formData.set("order", JSON.stringify(nextOrder));
    startTransition(() => formAction(formData));
  }

  function handleDrop(targetId: string) {
    const sourceId = dragIdRef.current;
    setDraggingId(null);
    setOverId(null);
    dragIdRef.current = null;
    if (!sourceId || sourceId === targetId) return;
    const from = items.indexOf(sourceId);
    const to = items.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const next = [...items];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    commit(next);
  }

  return (
    <div className="grid gap-4">
      {items.map((id, index) => {
        const section = byId.get(id);
        if (!section) return null;
        const isDropTarget = overId === id && draggingId !== null && draggingId !== id;
        return (
          <div
            key={id}
            onDragOver={(event) => {
              if (!draggingId) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (overId !== id) setOverId(id);
            }}
            onDragLeave={() => setOverId((current) => (current === id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(id);
            }}
            className={[
              "rounded-xl transition",
              isDropTarget ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "",
              draggingId === id ? "opacity-50" : "",
            ].filter(Boolean).join(" ")}
          >
            <BlockEditor
              pageId={pageId}
              block={section}
              position={index}
              total={items.length}
              media={media}
              dragHandle={
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    dragIdRef.current = id;
                    setDraggingId(id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", id);
                  }}
                  onDragEnd={() => {
                    dragIdRef.current = null;
                    setDraggingId(null);
                    setOverId(null);
                  }}
                  className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md border border-border text-text-muted transition hover:border-brand/40 hover:bg-surface-sunken hover:text-brand active:cursor-grabbing"
                  aria-label="Arrastrar para reordenar este bloque"
                  title="Arrastrar para reordenar"
                >
                  <span aria-hidden="true" className="text-base leading-none">⠿</span>
                </button>
              }
            />
          </div>
        );
      })}
      {state.status === "error" ? <p role="alert" className="text-sm text-danger">{state.message}</p> : null}
    </div>
  );
}
