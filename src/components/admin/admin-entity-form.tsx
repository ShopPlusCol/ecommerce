"use client";

import { useActionState } from "react";
import { adminEntityAction } from "@/app/admin/entity-actions";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";

export type AdminEntityField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox" | "datetime-local" | "url";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
};

type FieldValue = string | number | boolean | Date | null | undefined;

export function AdminEntityForm({
  entity,
  operation,
  fields,
  values = {},
  submitLabel,
}: {
  entity: string;
  operation: "create" | "update" | "archive" | "duplicate";
  fields: AdminEntityField[];
  values?: Record<string, FieldValue>;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(adminEntityAction, INITIAL_ADMIN_ACTION_STATE);
  const destructive = operation === "archive";

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="operation" value={operation} />
      {values.id ? <input type="hidden" name="id" value={String(values.id)} /> : null}
      {fields.map((field) => {
        const value = values[field.name];
        const commonClassName = "h-10 rounded-md border border-border bg-surface px-3 text-sm font-normal";
        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm font-medium">
              <input name={field.name} type="checkbox" defaultChecked={Boolean(value)} className="h-4 w-4 accent-brand" />
              {field.label}
            </label>
          );
        }
        if (field.type === "textarea") {
          return (
            <label key={field.name} className="grid gap-1 text-sm font-medium">
              {field.label}
              <textarea name={field.name} required={field.required} defaultValue={String(value ?? "")} placeholder={field.placeholder} className="min-h-24 rounded-md border border-border bg-surface p-3 text-sm font-normal" />
            </label>
          );
        }
        if (field.type === "select") {
          return (
            <label key={field.name} className="grid gap-1 text-sm font-medium">
              {field.label}
              <select name={field.name} required={field.required} defaultValue={String(value ?? "")} className={commonClassName}>
                {!field.required ? <option value="">Sin asignar</option> : null}
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          );
        }
        const dateValue = value instanceof Date ? value.toISOString().slice(0, 16) : String(value ?? "");
        return (
          <label key={field.name} className="grid gap-1 text-sm font-medium">
            {field.label}
            <input
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              min={field.min}
              max={field.max}
              step={field.step}
              defaultValue={dateValue}
              placeholder={field.placeholder}
              className={commonClassName}
            />
          </label>
        );
      })}
      {destructive ? (
        <label className="grid gap-1 text-sm font-medium">
          Motivo
          <input name="reason" required minLength={5} maxLength={300} placeholder="Explica por qué se archiva" className="h-10 rounded-md border border-border px-3 text-sm font-normal" />
        </label>
      ) : null}
      <button
        disabled={pending}
        className={destructive ? "h-10 rounded-md border border-danger/30 px-4 text-sm font-semibold text-danger disabled:opacity-60" : "h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"}
      >
        {pending ? "Procesando…" : submitLabel}
      </button>
      {state.status !== "idle" ? (
        <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
