"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { deleteMediaAction, updateMediaAction, uploadMediaInlineAction } from "./actions";

function ActionMessage({
  state,
}: {
  state: typeof INITIAL_ADMIN_ACTION_STATE;
}) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}
    >
      {state.message}
    </p>
  );
}

export function MediaUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    setResult({ status: "idle", message: "" });
    let saved = 0;
    const errors: string[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setProgress(files.length > 1 ? `Cargando ${index + 1} de ${files.length}: ${file.name}` : `Cargando ${file.name}…`);
      const formData = new FormData();
      formData.set("file", file);
      formData.set("altText", "");
      const response = await uploadMediaInlineAction(formData);
      if (response.status === "success") saved += 1;
      else errors.push(`${file.name}: ${response.message}`);
    }
    setUploading(false);
    setProgress("");
    if (inputRef.current) inputRef.current.value = "";
    if (errors.length) {
      setResult({ status: "error", message: `${saved} archivo(s) cargado(s). Con error: ${errors.join(" · ")}` });
    } else {
      setResult({ status: "success", message: `${saved} archivo(s) cargado(s) correctamente.` });
    }
    router.refresh();
  };

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4">
      <label className="grid gap-1 text-sm font-medium">
        Archivos (puedes seleccionar varios a la vez)
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          disabled={uploading}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) uploadFiles(event.target.files);
          }}
          className="h-11 rounded-md border border-border bg-surface p-2 text-sm disabled:opacity-60"
        />
      </label>
      <p className="text-xs text-text-muted">La carga inicia apenas seleccionas los archivos; el nombre y el texto alternativo se pueden editar después de cada uno.</p>
      {progress ? <p role="status" className="text-sm text-text-muted">{progress}</p> : null}
      <ActionMessage state={result} />
    </div>
  );
}

export function MediaEditForm({ id, altText }: { id: string; altText: string }) {
  const [state, action, pending] = useActionState(updateMediaAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="grid gap-1 text-xs font-semibold">
        Texto alternativo
        <input name="altText" defaultValue={altText} maxLength={180} className="h-9 rounded-md border border-border px-2 text-sm font-normal" />
      </label>
      <button disabled={pending} className="h-9 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar metadatos"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function MediaDeleteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteMediaAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form
      action={action}
      className="mt-3 border-t border-border pt-3"
      onSubmit={(event) => {
        if (!window.confirm("¿Eliminar este archivo de forma permanente?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="reason" value="Eliminado desde la biblioteca multimedia." />
      <button disabled={pending} className="h-9 w-full rounded-md border border-danger/30 text-sm font-semibold text-danger disabled:opacity-60">
        {pending ? "Eliminando…" : "Eliminar"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
