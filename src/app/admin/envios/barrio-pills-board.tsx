"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { normalize } from "@/domain/services/shipping";
import { moveBarrioToGroupAction, moveBarriosToGroupAction, saveGroupSettingsAction } from "./barrio-group-actions";
import { deleteZoneAction, deleteZonesBulkAction } from "./zone-actions";
import { BARRIO_GROUPS, BARRIO_GROUP_LABELS, type BarrioGroupKind } from "./barrio-group-derivation";
import { PAYMENT_METHOD_OPTIONS } from "./zone-config-form";

type Pill = { id: string; name: string; fee: number | null };

export type BarrioGroupSettingsData = {
  fee: number | null;
  freeShippingThreshold: number | null;
  cashOnDeliveryAllowed: boolean | null;
  requiresAdvancePayment: boolean | null;
  advancePercentage: number | null;
  sameDayAvailable: boolean | null;
  sameDayCutoffHour: number | null;
  estimatedBusinessDaysMin: number | null;
  estimatedBusinessDaysMax: number | null;
  allowedPaymentMethods: Array<"mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full"> | null;
  customerMessage: string | null;
};

const inputClass = "h-9 rounded-md border border-border bg-surface px-2 text-xs";

export function BarrioPillsBoard({
  cityId,
  barrios,
  groupSettings,
}: {
  cityId: string;
  barrios: Array<{ id: string; name: string; group: BarrioGroupKind; fee: number | null }>;
  groupSettings: Record<"no_coverage" | "special_price", BarrioGroupSettingsData | null>;
}) {
  const [pillsByGroup, setPillsByGroup] = useState<Record<BarrioGroupKind, Pill[]>>(() => {
    const initial: Record<BarrioGroupKind, Pill[]> = { coverage: [], no_coverage: [], special_price: [] };
    for (const barrio of barrios) initial[barrio.group].push({ id: barrio.id, name: barrio.name, fee: barrio.fee });
    return initial;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIds, setDragIds] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<BarrioGroupKind | null>(null);
  const dragIdsRef = useRef<string[]>([]);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const [moveState, moveAction] = useActionState(moveBarrioToGroupAction, INITIAL_ADMIN_ACTION_STATE);
  const [moveManyState, moveManyAction] = useActionState(moveBarriosToGroupAction, INITIAL_ADMIN_ACTION_STATE);
  const [deleteManyState, deleteManyAction] = useActionState(deleteZonesBulkAction, INITIAL_ADMIN_ACTION_STATE);

  // Si el servidor rechaza el movimiento (p. ej. "Precio especial" sin
  // configurar todavía), revierte la actualización optimista al estado
  // confirmado por el servidor — si no, la(s) pastilla(s) quedan mostrando
  // un grupo que en realidad no se guardó.
  useEffect(() => {
    if (moveState.status !== "error" && moveManyState.status !== "error") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- revierte el optimismo al estado confirmado por el servidor si la acción falló
    setPillsByGroup(() => {
      const reset: Record<BarrioGroupKind, Pill[]> = { coverage: [], no_coverage: [], special_price: [] };
      for (const barrio of barrios) reset[barrio.group].push({ id: barrio.id, name: barrio.name, fee: barrio.fee });
      return reset;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a moveState/moveManyState, no a cada cambio de `barrios`
  }, [moveState, moveManyState]);

  // Cuando el servidor confirma un cambio (movimiento o borrado) revalida la
  // página y este componente recibe un `barrios` nuevo: sincroniza el estado
  // local con esa fuente de verdad para que, por ejemplo, un barrio borrado
  // desaparezca del tablero sin necesidad de recargar. En un error no se
  // revalida (ver arriba), así que `barrios` no cambia y esto no interfiere
  // con el revert optimista.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con la fuente de verdad del servidor tras cada revalidación
    setPillsByGroup(() => {
      const next: Record<BarrioGroupKind, Pill[]> = { coverage: [], no_coverage: [], special_price: [] };
      for (const barrio of barrios) next[barrio.group].push({ id: barrio.id, name: barrio.name, fee: barrio.fee });
      return next;
    });
  }, [barrios]);

  function moveIdsInState(ids: string[], target: BarrioGroupKind) {
    const idSet = new Set(ids);
    setPillsByGroup((prev) => {
      const moved: Pill[] = [];
      const next: Record<BarrioGroupKind, Pill[]> = { coverage: [], no_coverage: [], special_price: [] };
      for (const group of BARRIO_GROUPS) {
        for (const pill of prev[group]) {
          if (idSet.has(pill.id)) moved.push(pill);
          else next[group].push(pill);
        }
      }
      next[target].push(...moved);
      return next;
    });
  }

  function optimisticMove(id: string, target: BarrioGroupKind) {
    moveIdsInState([id], target);
    const formData = new FormData();
    formData.set("zoneId", id);
    formData.set("targetGroup", target);
    startTransition(() => moveAction(formData));
  }

  function optimisticMoveMany(ids: string[], target: BarrioGroupKind) {
    if (ids.length === 0) return;
    if (ids.length === 1) {
      optimisticMove(ids[0], target);
      return;
    }
    moveIdsInState(ids, target);
    const formData = new FormData();
    formData.set("cityZoneId", cityId);
    for (const id of ids) formData.append("zoneId", id);
    formData.set("targetGroup", target);
    startTransition(() => moveManyAction(formData));
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectIds(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  const allIds = BARRIO_GROUPS.flatMap((group) => pillsByGroup[group].map((pill) => pill.id));
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} barrio(s) seleccionado(s)? Esta acción no se puede deshacer.`)) return;
    setPillsByGroup((prev) => {
      const idSet = new Set(ids);
      const next: Record<BarrioGroupKind, Pill[]> = { coverage: [], no_coverage: [], special_price: [] };
      for (const group of BARRIO_GROUPS) next[group] = prev[group].filter((pill) => !idSet.has(pill.id));
      return next;
    });
    const formData = new FormData();
    for (const id of ids) formData.append("zoneId", id);
    startTransition(() => deleteManyAction(formData));
    setSelected(new Set());
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-muted">
          Marca la casilla de varias pastillas para moverlas o eliminarlas juntas, o arrastra/usa el selector de una sola. Arrastra y suelta sobre otro grupo.
        </p>
        <button type="button" onClick={() => setSelected(allSelected ? new Set() : new Set(allIds))} className="text-xs font-semibold text-brand underline">
          {allSelected ? "Deseleccionar todo" : `Seleccionar todo (${allIds.length})`}
        </button>
      </div>
      {[moveState, moveManyState, deleteManyState].map((state, index) =>
        state.status !== "idle" ? (
          <p
            key={index}
            role={state.status === "error" ? "alert" : "status"}
            className={cn("rounded-md p-2 text-sm", state.status === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success")}
          >
            {state.message}
          </p>
        ) : null,
      )}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm">
          <span className="font-semibold text-brand">{selected.size} barrio(s) seleccionado(s)</span>
          <span className="text-text-muted">Mover a:</span>
          {BARRIO_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => optimisticMoveMany(Array.from(selected), group)}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold hover:bg-surface-sunken"
            >
              {BARRIO_GROUP_LABELS[group]}
            </button>
          ))}
          <button
            type="button"
            onClick={deleteSelected}
            className="rounded-full border border-danger/30 bg-danger-soft px-3 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
          >
            Eliminar seleccionados
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-text-muted underline">
            Cancelar selección
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {BARRIO_GROUPS.map((group) => (
          <Column
            key={group}
            group={group}
            cityId={cityId}
            pills={pillsByGroup[group]}
            query={group === "coverage" ? query : ""}
            onQueryChange={group === "coverage" ? setQuery : undefined}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectIds}
            dragIds={dragIds}
            isDropHighlight={dropTarget === group}
            groupSettings={group === "coverage" ? null : groupSettings[group]}
            onDragStartPill={(id) => {
              const ids = selected.has(id) && selected.size > 1 ? Array.from(selected) : [id];
              dragIdsRef.current = ids;
              setDragIds(ids);
            }}
            onDragEndPill={() => {
              dragIdsRef.current = [];
              setDragIds([]);
              setDropTarget(null);
            }}
            onDragOverColumn={() => setDropTarget(group)}
            onDragLeaveColumn={() => setDropTarget((current) => (current === group ? null : current))}
            onDropColumn={() => {
              const ids = dragIdsRef.current;
              dragIdsRef.current = [];
              setDragIds([]);
              setDropTarget(null);
              if (ids.length) optimisticMoveMany(ids, group);
            }}
            onSelectMove={(id, target) => optimisticMove(id, target)}
          />
        ))}
      </div>
    </div>
  );
}

function Column({
  group,
  cityId,
  pills,
  query,
  onQueryChange,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  dragIds,
  isDropHighlight,
  groupSettings,
  onDragStartPill,
  onDragEndPill,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropColumn,
  onSelectMove,
}: {
  group: BarrioGroupKind;
  cityId: string;
  pills: Pill[];
  query: string;
  onQueryChange?: (value: string) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  dragIds: string[];
  isDropHighlight: boolean;
  groupSettings: BarrioGroupSettingsData | null;
  onDragStartPill: (id: string) => void;
  onDragEndPill: () => void;
  onDragOverColumn: () => void;
  onDragLeaveColumn: () => void;
  onDropColumn: () => void;
  onSelectMove: (id: string, target: BarrioGroupKind) => void;
}) {
  const target = normalize(query);
  const filtered = target ? pills.filter((pill) => normalize(pill.name).includes(target)) : pills;

  return (
    <div
      data-group={group}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverColumn();
      }}
      onDragLeave={onDragLeaveColumn}
      onDrop={(event) => {
        event.preventDefault();
        onDropColumn();
      }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-surface-raised p-4",
        isDropHighlight ? "border-brand ring-2 ring-brand/30" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{BARRIO_GROUP_LABELS[group]}</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-text-muted">{pills.length}</span>
          {filtered.length > 0 ? (
            <button
              type="button"
              onClick={() => onToggleSelectAll(filtered.map((pill) => pill.id))}
              className="text-xs font-semibold text-brand underline"
            >
              {filtered.every((pill) => selected.has(pill.id)) ? "Ninguno" : "Todos"}
            </button>
          ) : null}
        </div>
      </div>

      {group === "coverage" ? (
        <p className="text-xs text-text-muted">Hereda toda la configuración de la ciudad.</p>
      ) : (
        <GroupSettingsForm cityId={cityId} groupKind={group} settings={groupSettings} memberCount={pills.length} />
      )}

      {pills.length > 8 && onQueryChange ? (
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={`Buscar entre ${pills.length}…`}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm"
        />
      ) : null}

      <div className="flex max-h-96 flex-wrap content-start gap-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted">{pills.length === 0 ? "Sin barrios aquí todavía." : "Ningún barrio coincide con la búsqueda."}</p>
        ) : (
          filtered.map((pill) => (
            <BarrioPill
              key={pill.id}
              pill={pill}
              group={group}
              dragging={dragIds.includes(pill.id)}
              selected={selected.has(pill.id)}
              onToggleSelect={() => onToggleSelect(pill.id)}
              onDragStart={() => onDragStartPill(pill.id)}
              onDragEnd={onDragEndPill}
              onSelectMove={(nextGroup) => onSelectMove(pill.id, nextGroup)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BarrioPill({
  pill,
  group,
  dragging,
  selected,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onSelectMove,
}: {
  pill: Pill;
  group: BarrioGroupKind;
  dragging: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSelectMove: (group: BarrioGroupKind) => void;
}) {
  const [, deleteAction] = useActionState(deleteZoneAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <span
      draggable
      onDragStart={(event) => {
        onDragStart();
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", pill.id);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex cursor-grab items-center gap-1 rounded-full border py-1 pl-2 pr-1 text-sm active:cursor-grabbing",
        group === "no_coverage" ? "border-danger/30 bg-danger/5 text-danger" : group === "special_price" ? "border-brand/30 bg-brand-soft text-brand" : "border-border bg-surface",
        selected ? "ring-2 ring-brand ring-offset-1" : "",
        dragging ? "opacity-40" : "",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={`Seleccionar "${pill.name}" para mover varios a la vez`}
        className="h-3.5 w-3.5 cursor-pointer accent-brand"
      />
      <span>{pill.name}</span>
      {group === "special_price" && pill.fee !== null ? <span className="text-xs opacity-70">${pill.fee.toLocaleString("es-CO")}</span> : null}
      <select
        aria-label={`Mover "${pill.name}" a otro grupo`}
        value={group}
        onChange={(event) => onSelectMove(event.target.value as BarrioGroupKind)}
        className="cursor-pointer rounded border-none bg-transparent text-xs text-text-muted"
      >
        {BARRIO_GROUPS.map((option) => (
          <option key={option} value={option}>
            {BARRIO_GROUP_LABELS[option]}
          </option>
        ))}
      </select>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm(`¿Eliminar el barrio "${pill.name}"?`)) event.preventDefault();
        }}
      >
        <input type="hidden" name="zoneId" value={pill.id} />
        <button type="submit" aria-label={`Eliminar ${pill.name}`} className="grid h-5 w-5 place-items-center rounded-full text-text-muted hover:bg-danger-soft hover:text-danger">
          ×
        </button>
      </form>
    </span>
  );
}

function GroupSettingsForm({
  cityId,
  groupKind,
  settings,
  memberCount,
}: {
  cityId: string;
  groupKind: "no_coverage" | "special_price";
  settings: BarrioGroupSettingsData | null;
  memberCount: number;
}) {
  const [state, action, pending] = useActionState(saveGroupSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  const [sameDayOn, setSameDayOn] = useState(settings?.sameDayAvailable ?? false);

  return (
    <details className="rounded-lg border border-border p-3" open={groupKind === "special_price"}>
      <summary className="cursor-pointer text-sm font-semibold text-brand">Configurar grupo</summary>
      <form action={action} className="mt-3 grid gap-3">
        <input type="hidden" name="cityZoneId" value={cityId} />
        <input type="hidden" name="groupKind" value={groupKind} />

        {groupKind === "special_price" ? (
          <label className="grid gap-1 text-xs font-semibold">
            Tarifa de envío (COP)
            <input name="fee" type="number" min={0} required defaultValue={settings?.fee ?? undefined} className={inputClass} />
          </label>
        ) : null}

        <label className="grid gap-1 text-xs font-semibold">
          Envío gratis desde (COP, opcional)
          <input name="freeShippingThreshold" type="number" min={0} defaultValue={settings?.freeShippingThreshold ?? undefined} className={inputClass} />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" name="cashOnDeliveryAllowed" defaultChecked={settings?.cashOnDeliveryAllowed ?? false} className="h-3.5 w-3.5 accent-brand" />
          Permite contraentrega
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" name="requiresAdvancePayment" defaultChecked={settings?.requiresAdvancePayment ?? false} className="h-3.5 w-3.5 accent-brand" />
          Exige anticipo
        </label>
        <label className="grid gap-1 text-xs font-semibold">
          Porcentaje de anticipo
          <input name="advancePercentage" type="number" min={1} max={100} defaultValue={settings?.advancePercentage ?? undefined} className={inputClass} />
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            name="sameDayAvailable"
            defaultChecked={settings?.sameDayAvailable ?? false}
            onChange={(event) => setSameDayOn(event.currentTarget.checked)}
            className="h-3.5 w-3.5 accent-brand"
          />
          Entrega el mismo día
        </label>
        {sameDayOn ? (
          <label className="grid gap-1 text-xs font-semibold">
            Hora límite mismo día
            <input name="sameDayCutoffHour" type="number" min={0} max={23} defaultValue={settings?.sameDayCutoffHour ?? undefined} className={inputClass} />
          </label>
        ) : null}
        <div className={cn("grid grid-cols-2 gap-2", sameDayOn && "opacity-70")}>
          <label className="grid gap-1 text-xs font-semibold">
            Días hábiles mín.
            <input name="estimatedBusinessDaysMin" type="number" min={0} defaultValue={settings?.estimatedBusinessDaysMin ?? undefined} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs font-semibold">
            Días hábiles máx.
            <input name="estimatedBusinessDaysMax" type="number" min={0} defaultValue={settings?.estimatedBusinessDaysMax ?? undefined} className={inputClass} />
          </label>
        </div>

        <fieldset className="grid gap-1.5">
          <legend className="text-xs font-semibold">Métodos de pago permitidos</legend>
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                name="allowedPaymentMethods"
                value={option.value}
                defaultChecked={settings?.allowedPaymentMethods?.includes(option.value) ?? false}
                className="h-3.5 w-3.5 accent-brand"
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <label className="grid gap-1 text-xs font-semibold">
          Mensaje al cliente
          <textarea name="customerMessage" defaultValue={settings?.customerMessage ?? ""} maxLength={300} className="min-h-16 rounded-md border border-border bg-surface p-2 text-xs" />
        </label>

        <button disabled={pending} className="h-9 rounded-md bg-brand px-4 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "Guardando…" : `Guardar y aplicar a ${memberCount} barrio(s)`}
        </button>
        {state.status !== "idle" ? (
          <p role={state.status === "error" ? "alert" : "status"} className={cn("text-xs", state.status === "error" ? "text-danger" : "text-success")}>
            {state.message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
