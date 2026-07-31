"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import {
  adjustInventoryAdminAction,
  releaseExpiredInventoryReservationsAction,
  releaseInventoryReservationAction,
} from "./actions";

function Feedback({ state }: { state: typeof INITIAL_ADMIN_ACTION_STATE }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-xs text-danger" : "text-xs text-success"}
    >
      {state.message}
    </p>
  );
}

export function InventoryAdjustmentForm({ itemId }: { itemId: string }) {
  const [state, action, pending] = useActionState(
    adjustInventoryAdminAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  return (
    <form action={action} className="grid min-w-72 gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="grid grid-cols-[1fr_88px] gap-2">
        <select name="type" className="h-9 rounded-md border border-border px-2 text-xs">
          <option value="restock">Entrada de mercancía</option>
          <option value="return">Devolución</option>
          <option value="manual_adjustment">Ajuste manual</option>
        </select>
        <input
          name="delta"
          type="number"
          required
          placeholder="+ / −"
          className="h-9 rounded-md border border-border px-2 text-sm"
        />
      </div>
      <input
        name="reason"
        required
        minLength={5}
        maxLength={240}
        placeholder="Motivo verificable"
        className="h-9 rounded-md border border-border px-2 text-sm"
      />
      <button
        disabled={pending}
        className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Actualizando…" : "Registrar movimiento"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ReservationReleaseForm({ reservationId }: { reservationId: string }) {
  const [state, action, pending] = useActionState(
    releaseInventoryReservationAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  return (
    <form action={action} className="grid min-w-56 gap-2">
      <input type="hidden" name="reservationId" value={reservationId} />
      <input
        name="reason"
        required
        minLength={5}
        maxLength={240}
        placeholder="Motivo de liberación"
        className="h-9 rounded-md border border-border px-2 text-sm"
      />
      <button
        disabled={pending}
        className="h-9 rounded-md border border-warning/30 px-3 text-xs font-semibold text-warning disabled:opacity-60"
      >
        {pending ? "Liberando…" : "Liberar reserva"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ReleaseExpiredReservationsButton() {
  const [state, action, pending] = useActionState(
    releaseExpiredInventoryReservationsAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <button
        disabled={pending}
        className="h-10 rounded-md border border-border bg-surface-raised px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Revisando…" : "Liberar reservas vencidas"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
