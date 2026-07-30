"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import {
  addNeighborhoodsAction,
  createNeighborhoodGroupAction,
  deleteNeighborhoodGroupAction,
  moveNeighborhoodAction,
  removeNeighborhoodAction,
  saveNeighborhoodGroupPriceAction,
} from "./neighborhood-groups-actions";

export type NeighborhoodGroupRule = {
  fee: number;
  freeShippingThreshold: number | null;
  cashOnDeliveryAllowed: boolean;
  requiresAdvancePayment: boolean;
  advancePercentage: number | null;
  sameDayAvailable: boolean;
  sameDayCutoffHour: number | null;
  estimatedBusinessDaysMin: number;
  estimatedBusinessDaysMax: number;
  customerMessage: string | null;
  status: "draft" | "active" | "inactive";
};

export type NeighborhoodGroup = {
  key: string;
  name: string;
  groupKind: "custom" | "unassigned" | "no_coverage";
  neighborhoodNames: string[];
  rule: NeighborhoodGroupRule | null;
};

const input = "h-9 rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

function Feedback({ state }: { state: typeof INITIAL_ADMIN_ACTION_STATE }) {
  if (state.status === "idle") return null;
  return <p role={state.status === "error" ? "alert" : "status"} className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>;
}

function groupsSignature(groups: NeighborhoodGroup[]) {
  return groups.map((g) => `${g.key}:${g.neighborhoodNames.join(",")}`).join("|");
}

export function NeighborhoodGroupsBoard({ city, groups }: { city: string; groups: NeighborhoodGroup[] }) {
  const [pillsByKey, setPillsByKey] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, g.neighborhoodNames])),
  );
  const [activeKey, setActiveKey] = useState<string>(() => groups.find((g) => g.groupKind === "custom")?.key ?? "unassigned");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragNameRef = useRef<string | null>(null);
  const [, startTransition] = useTransition();

  const [moveState, moveAction] = useActionState(moveNeighborhoodAction, INITIAL_ADMIN_ACTION_STATE);
  const [addState, addAction] = useActionState(addNeighborhoodsAction, INITIAL_ADMIN_ACTION_STATE);
  const [removeState, removeAction] = useActionState(removeNeighborhoodAction, INITIAL_ADMIN_ACTION_STATE);
  const [createState, createAction, creating] = useActionState(createNeighborhoodGroupAction, INITIAL_ADMIN_ACTION_STATE);
  const [deleteState, deleteAction] = useActionState(deleteNeighborhoodGroupAction, INITIAL_ADMIN_ACTION_STATE);
  const [priceState, priceAction, savingPrice] = useActionState(saveNeighborhoodGroupPriceAction, INITIAL_ADMIN_ACTION_STATE);

  const signature = groupsSignature(groups);
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setPillsByKey(Object.fromEntries(groups.map((g) => [g.key, g.neighborhoodNames])));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se resincroniza cuando cambian los datos frescos del servidor
  }, [signature]);
  useEffect(() => {
    if (moveState.status !== "error" && addState.status !== "error" && removeState.status !== "error") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- revierte el optimismo al estado confirmado por el servidor si la acción falló
    setPillsByKey(Object.fromEntries(groups.map((g) => [g.key, g.neighborhoodNames])));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a los estados de las acciones, no a cada cambio de `groups`
  }, [moveState, addState, removeState]);

  const [newGroupName, setNewGroupName] = useState("");
  const [pasteValue, setPasteValue] = useState("");

  const activeGroup = groups.find((g) => g.key === activeKey) ?? groups[0];
  if (!activeGroup) return null;
  const activePills = pillsByKey[activeGroup.key] ?? activeGroup.neighborhoodNames;

  function optimisticMove(name: string, targetKey: string) {
    setPillsByKey((prev) => {
      const next: Record<string, string[]> = {};
      for (const [key, names] of Object.entries(prev)) {
        next[key] = names.filter((n) => n !== name);
      }
      next[targetKey] = [...(next[targetKey] ?? []), name];
      return next;
    });
    const formData = new FormData();
    formData.set("city", city);
    formData.set("name", name);
    formData.set("targetGroupKey", targetKey);
    startTransition(() => moveAction(formData));
  }

  function optimisticRemove(name: string) {
    setPillsByKey((prev) => {
      const next: Record<string, string[]> = {};
      for (const [key, names] of Object.entries(prev)) next[key] = names.filter((n) => n !== name);
      return next;
    });
    const formData = new FormData();
    formData.set("city", city);
    formData.set("name", name);
    startTransition(() => removeAction(formData));
  }

  function submitPaste() {
    const names = pasteValue.split(",").map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setPillsByKey((prev) => {
      const next: Record<string, string[]> = {};
      for (const [key, arr] of Object.entries(prev)) {
        next[key] = key === activeGroup.key ? arr : arr.filter((n) => !names.includes(n));
      }
      const merged = [...(next[activeGroup.key] ?? [])];
      for (const name of names) if (!merged.includes(name)) merged.push(name);
      next[activeGroup.key] = merged;
      return next;
    });
    const formData = new FormData();
    formData.set("city", city);
    formData.set("targetGroupKey", activeGroup.key);
    formData.set("namesCsv", pasteValue);
    startTransition(() => addAction(formData));
    setPasteValue("");
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4" data-testid="neighborhood-groups-board" data-city={city}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{city}</h3>
        <span className="text-xs text-text-muted">Arrastra una pastilla y suéltala sobre otra pestaña para moverla.</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={`Grupos de barrios de ${city}`}>
        {groups.map((group) => {
          const isReserved = group.groupKind !== "custom";
          const isDropHighlight = dropTarget === group.key && dragging !== null;
          return (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={activeKey === group.key}
              onClick={() => setActiveKey(group.key)}
              onDragOver={(event) => {
                if (!dragging) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dropTarget !== group.key) setDropTarget(group.key);
              }}
              onDragLeave={() => setDropTarget((current) => (current === group.key ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const name = dragNameRef.current;
                dragNameRef.current = null;
                setDragging(null);
                setDropTarget(null);
                if (name) optimisticMove(name, group.key);
              }}
              className={[
                "h-9 rounded-md border px-3 text-sm font-semibold transition",
                activeKey === group.key ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-text-muted hover:bg-surface-sunken",
                group.groupKind === "no_coverage" ? "border-danger/30" : "",
                isDropHighlight ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "",
              ].join(" ")}
            >
              {group.name}
              {isReserved ? null : (
                <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 text-xs font-normal text-text-muted">{(pillsByKey[group.key] ?? group.neighborhoodNames).length}</span>
              )}
            </button>
          );
        })}
        <form action={createAction} className="flex items-center gap-2">
          <input type="hidden" name="city" value={city} />
          <input
            className={`${input} w-40`}
            placeholder="Nuevo grupo…"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            name="name"
          />
          <button disabled={creating || !newGroupName.trim()} className="h-9 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-40">
            {creating ? "Creando…" : "+ Grupo"}
          </button>
        </form>
      </div>
      <Feedback state={createState} />

      <div className="grid gap-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            {activeGroup.name}
            {activeGroup.groupKind === "unassigned" ? <span className="ml-2 font-normal text-text-muted">Usa la tarifa general de {city}.</span> : null}
            {activeGroup.groupKind === "no_coverage" ? <span className="ml-2 font-normal text-danger">No se ofrece envío a estos barrios.</span> : null}
          </p>
          {activeGroup.groupKind === "custom" ? (
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!window.confirm(`¿Eliminar el grupo "${activeGroup.name}"? Sus barrios pasarán a "Sin grupo".`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="groupId" value={activeGroup.key} />
              <button className="text-xs font-semibold text-danger hover:underline">Eliminar grupo</button>
            </form>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {activePills.length === 0 ? (
            <p className="text-sm text-text-muted">Sin barrios todavía.</p>
          ) : (
            activePills.map((name) => (
              <span
                key={name}
                data-testid="neighborhood-pill"
                data-name={name}
                draggable
                onDragStart={(event) => {
                  dragNameRef.current = name;
                  setDragging(name);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", name);
                }}
                onDragEnd={() => {
                  dragNameRef.current = null;
                  setDragging(null);
                  setDropTarget(null);
                }}
                className={[
                  "flex cursor-grab items-center gap-1.5 rounded-full border px-3 py-1 text-sm active:cursor-grabbing",
                  activeGroup.groupKind === "no_coverage" ? "border-danger/30 bg-danger/5 text-danger" : "border-border bg-surface",
                  dragging === name ? "opacity-40" : "",
                ].join(" ")}
              >
                {name}
                <button
                  type="button"
                  onClick={() => optimisticRemove(name)}
                  aria-label={`Quitar ${name}`}
                  className="text-text-muted hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <Feedback state={moveState} />
        <Feedback state={removeState} />

        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold">
            Pega barrios separados por comas
            <input
              className={`${input} w-80`}
              placeholder="Guayabal, Castropol"
              value={pasteValue}
              onChange={(event) => setPasteValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitPaste();
                }
              }}
            />
          </label>
          <button type="button" onClick={submitPaste} disabled={!pasteValue.trim()} className="h-9 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40">
            Añadir
          </button>
        </div>
        <Feedback state={addState} />
        <Feedback state={deleteState} />

        {activeGroup.groupKind === "unassigned" ? null : (
          <form action={priceAction} className="grid gap-3 border-t border-border pt-4 md:grid-cols-2">
            <input type="hidden" name="city" value={city} />
            <input type="hidden" name="groupKey" value={activeGroup.key} />
            {activeGroup.groupKind === "custom" ? (
              <label className="grid gap-1 text-xs font-semibold md:col-span-2">
                Nombre del grupo
                <input className={input} name="name" defaultValue={activeGroup.name} required minLength={2} maxLength={80} />
              </label>
            ) : null}
            {activeGroup.groupKind === "custom" ? (
              <>
                <label className="grid gap-1 text-xs font-semibold">
                  Tarifa COP
                  <input className={input} type="number" name="fee" min={0} defaultValue={activeGroup.rule?.fee ?? 0} />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Envío gratis desde COP (opcional)
                  <input className={input} type="number" name="freeShippingThreshold" min={0} defaultValue={activeGroup.rule?.freeShippingThreshold ?? ""} />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" name="cashOnDeliveryAllowed" defaultChecked={activeGroup.rule?.cashOnDeliveryAllowed ?? true} />
                  Permite contraentrega
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" name="requiresAdvancePayment" defaultChecked={activeGroup.rule?.requiresAdvancePayment ?? false} />
                  Exige anticipo
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Porcentaje de anticipo
                  <input className={input} type="number" name="advancePercentage" min={1} max={100} defaultValue={activeGroup.rule?.advancePercentage ?? ""} />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" name="sameDayAvailable" defaultChecked={activeGroup.rule?.sameDayAvailable ?? false} />
                  Entrega el mismo día
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Hora límite mismo día
                  <input className={input} type="number" name="sameDayCutoffHour" min={0} max={23} defaultValue={activeGroup.rule?.sameDayCutoffHour ?? ""} />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs font-semibold">
                    Días hábiles mín.
                    <input className={input} type="number" name="estimatedBusinessDaysMin" min={0} defaultValue={activeGroup.rule?.estimatedBusinessDaysMin ?? 0} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    Días hábiles máx.
                    <input className={input} type="number" name="estimatedBusinessDaysMax" min={0} defaultValue={activeGroup.rule?.estimatedBusinessDaysMax ?? 1} />
                  </label>
                </div>
              </>
            ) : null}
            <label className="grid gap-1 text-xs font-semibold md:col-span-2">
              Mensaje al cliente
              <textarea className={`${input} min-h-16 py-2`} name="customerMessage" defaultValue={activeGroup.rule?.customerMessage ?? ""} maxLength={300} />
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Estado
              <select className={input} name="status" defaultValue={activeGroup.rule?.status ?? "active"}>
                <option value="draft">Borrador</option>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </label>
            <div className="flex items-end">
              <button disabled={savingPrice} className="h-9 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">
                {savingPrice ? "Guardando…" : activeGroup.groupKind === "no_coverage" ? "Guardar mensaje" : "Guardar tarifa"}
              </button>
            </div>
            <div className="md:col-span-2">
              <Feedback state={priceState} />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
