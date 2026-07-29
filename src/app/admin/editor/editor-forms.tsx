"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { blockTypeLabels, blockTypes, type BlockType } from "@/modules/page-builder/editor";
import {
  addBlockAction,
  blockOperationAction,
  createPageAction,
  publishPageAction,
  restoreVersionAction,
  updateBlockAction,
  updatePageAction,
} from "./actions";

const input = "h-11 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
const textarea = "min-h-32 rounded-lg border border-border bg-surface p-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

function Feedback({ state }: { state: typeof INITIAL_ADMIN_ACTION_STATE }) {
  if (state.status === "idle") return null;
  return <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>;
}

export function CreatePageForm() {
  const [state, action, pending] = useActionState(createPageAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="grid gap-1 text-sm font-semibold">Nombre visible<input className={input} name="title" required placeholder="Guía de tonos" /></label>
      <label className="grid gap-1 text-sm font-semibold">Slug<input className={input} name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="guia-de-tonos" /></label>
      <button disabled={pending} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Creando…" : "Crear borrador"}</button>
      <div className="md:col-span-3"><Feedback state={state} /></div>
    </form>
  );
}

export function PageSettingsForm({ page }: { page: { id: string; title: string; slug: string; seoTitle: string | null; seoDescription: string | null; isHome: boolean } }) {
  const [state, action, pending] = useActionState(updatePageAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="pageId" value={page.id} />
      <label className="grid gap-1 text-sm font-semibold">Nombre visible<input className={input} name="title" required defaultValue={page.title} /></label>
      <label className="grid gap-1 text-sm font-semibold">Slug<input className={input} name="slug" required defaultValue={page.slug} /></label>
      <label className="grid gap-1 text-sm font-semibold">Título SEO<input className={input} name="seoTitle" maxLength={120} defaultValue={page.seoTitle ?? ""} /></label>
      <label className="grid gap-1 text-sm font-semibold">Descripción SEO<textarea className={textarea} name="seoDescription" maxLength={240} defaultValue={page.seoDescription ?? ""} /></label>
      <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm font-semibold md:col-span-2"><input type="checkbox" name="isHome" defaultChecked={page.isHome} />Usar como página de inicio publicada</label>
      <button disabled={pending} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60 md:w-fit">{pending ? "Guardando…" : "Guardar información y SEO"}</button>
      <Feedback state={state} />
    </form>
  );
}

export function AddBlockForm({ pageId }: { pageId: string }) {
  const [state, action, pending] = useActionState(addBlockAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <input type="hidden" name="pageId" value={pageId} />
      <label className="grid gap-1 text-sm font-semibold">Tipo de bloque<select className={input} name="blockType" defaultValue="image_text">{blockTypes.map((type) => <option key={type} value={type}>{blockTypeLabels[type]}</option>)}</select></label>
      <button disabled={pending} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Agregando…" : "Agregar bloque"}</button>
      <div className="sm:col-span-2"><Feedback state={state} /></div>
    </form>
  );
}

export function BlockEditor({
  pageId,
  block,
  position,
  total,
  media,
}: {
  pageId: string;
  block: { id: string; blockType: string; config: Record<string, unknown>; visibleOnMobile: boolean; visibleOnDesktop: boolean };
  position: number;
  total: number;
  media: Array<{ url: string; label: string }>;
}) {
  const [saveState, saveAction, saving] = useActionState(updateBlockAction, INITIAL_ADMIN_ACTION_STATE);
  const [operationState, operationAction, operating] = useActionState(blockOperationAction, INITIAL_ADMIN_ACTION_STATE);
  const [config, setConfig] = useState(JSON.stringify(block.config, null, 2));
  const [dirty, setDirty] = useState(false);
  const type = block.blockType as BlockType;
  const hidden = <><input type="hidden" name="pageId" value={pageId} /><input type="hidden" name="blockId" value={block.id} /></>;
  return (
    <article className="rounded-xl border border-border bg-surface-raised">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bloque {position + 1} de {total}</p><h3 className="font-semibold">{blockTypeLabels[type] ?? block.blockType}</h3></div>
        <div className="flex flex-wrap gap-2" aria-label={`Orden y acciones de ${blockTypeLabels[type] ?? "bloque"}`}>
          <form action={operationAction}>{hidden}<input type="hidden" name="operation" value="up" /><button disabled={operating || position === 0} className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40" aria-label="Subir bloque">↑</button></form>
          <form action={operationAction}>{hidden}<input type="hidden" name="operation" value="down" /><button disabled={operating || position === total - 1} className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40" aria-label="Bajar bloque">↓</button></form>
          <form action={operationAction}>{hidden}<input type="hidden" name="operation" value="duplicate" /><button disabled={operating} className="h-9 rounded-md border border-border px-3 text-sm font-semibold">Duplicar</button></form>
          <form action={operationAction} onSubmit={(event) => { if (!window.confirm("¿Eliminar este bloque del borrador? La versión publicada no cambiará hasta que publiques de nuevo.")) event.preventDefault(); }}>{hidden}<input type="hidden" name="operation" value="delete" /><button disabled={operating} className="h-9 rounded-md border border-danger/30 px-3 text-sm font-semibold text-danger">Eliminar</button></form>
        </div>
      </header>
      <form action={saveAction} className="grid gap-4 p-4">
        {hidden}
        <label className="grid gap-1 text-sm font-semibold">Contenido del bloque<span className="text-xs font-normal text-text-muted">Edita el contenido respetando las claves visibles. Los errores se explican antes de guardar.</span><textarea className={`${textarea} min-h-56 font-mono`} name="configJson" value={config} onChange={(event) => { setConfig(event.target.value); setDirty(true); }} spellCheck={false} /></label>
        {block.blockType === "image_text" ? <label className="grid gap-1 text-sm font-semibold">Elegir imagen de la biblioteca<select className={input} name="selectedImage" defaultValue=""><option value="">Conservar URL de la configuración</option>{media.map((item) => <option key={item.url} value={item.url}>{item.label}</option>)}</select></label> : null}
        <fieldset className="flex flex-wrap gap-5"><legend className="mb-2 text-sm font-semibold">Visibilidad</legend><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleOnDesktop" defaultChecked={block.visibleOnDesktop} />Escritorio</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleOnMobile" defaultChecked={block.visibleOnMobile} />Móvil</label></fieldset>
        <div className="flex flex-wrap items-center gap-3"><button disabled={saving} className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar bloque"}</button>{dirty ? <span className="text-xs font-semibold text-warning">Cambios sin guardar</span> : null}</div>
        <Feedback state={saveState} /><Feedback state={operationState} />
      </form>
    </article>
  );
}

export function PublishForm({ pageId, previewHref }: { pageId: string; previewHref: string }) {
  const [state, action, pending] = useActionState(publishPageAction, INITIAL_ADMIN_ACTION_STATE);
  return <div className="flex flex-wrap items-center gap-3"><Link href={previewHref} target="_blank" className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold">Abrir vista previa</Link><form action={action}><input type="hidden" name="pageId" value={pageId} /><button disabled={pending} className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Publicando…" : "Publicar borrador"}</button></form><Feedback state={state} /></div>;
}

export function RestoreVersionForm({ pageId, versionId, versionNumber, isLatest }: { pageId: string; versionId: string; versionNumber: number; isLatest: boolean }) {
  const [state, action, pending] = useActionState(restoreVersionAction, INITIAL_ADMIN_ACTION_STATE);
  return <form action={action} className="grid gap-1"><input type="hidden" name="pageId" value={pageId} /><input type="hidden" name="versionId" value={versionId} /><button disabled={pending || isLatest} className="h-9 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-40">{pending ? "Restaurando…" : isLatest ? "Versión actual" : `Restaurar v${versionNumber}`}</button><Feedback state={state} /></form>;
}
