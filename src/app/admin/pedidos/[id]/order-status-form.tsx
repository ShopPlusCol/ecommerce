"use client";

import * as React from "react";
import { changeOrderStatusAction } from "../../actions";

/**
 * Cambio de estado del pedido.
 *
 * Se puede saltar directamente a cualquier estado permitido: la operación
 * real no avanza en línea recta (un pedido puede pasar de "Pendiente" a
 * "Entregado" el mismo día) y obligar a recorrer cada paso solo generaba
 * historial inventado.
 *
 * La nota es **opcional**. El historial ya registra estado anterior, nuevo,
 * fecha y usuario por su cuenta; exigir texto hacía que se escribiera
 * cualquier cosa por salir del paso.
 */
export function OrderStatusForm({
  orderId,
  currentStatus,
  options,
  sensitiveStatuses,
}: {
  orderId: string;
  currentStatus: string;
  options: Array<{ value: string; label: string }>;
  /** Estados que piden una confirmación de un clic (nunca una nota). */
  sensitiveStatuses: readonly string[];
}) {
  const [selected, setSelected] = React.useState(options[0]?.value ?? "");
  const [showNote, setShowNote] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  if (options.length === 0) {
    return (
      <p className="mt-4 text-sm text-text-muted">
        Este pedido ya devolvió su inventario al stock, así que no puede reactivarse.
      </p>
    );
  }

  const label = options.find((option) => option.value === selected)?.label ?? "";
  const needsConfirm = sensitiveStatuses.includes(selected);

  return (
    <form
      ref={formRef}
      action={changeOrderStatusAction}
      className="mt-4 grid gap-3"
      onSubmit={(event) => {
        if (!needsConfirm) return;
        // Confirmación de un clic, sin pedir que se escriba nada.
        if (!window.confirm(`¿Confirmar cambio de estado a "${label}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={orderId} />
      <label className="grid gap-1 text-sm font-medium">
        Nuevo estado
        <select
          name="status"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="min-h-11 rounded-md border border-border px-3"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {showNote ? (
        <textarea
          name="note"
          maxLength={500}
          placeholder="Nota opcional para el historial"
          className="min-h-20 rounded-md border border-border p-3 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="w-fit text-left text-xs font-semibold text-brand underline"
        >
          Añadir una nota (opcional)
        </button>
      )}

      <button className="min-h-11 rounded-md bg-brand px-4 font-semibold text-white">
        Guardar estado
      </button>
      <p className="text-xs text-text-subtle">Estado actual: {currentStatus}</p>
    </form>
  );
}
