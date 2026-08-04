"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ReactNode } from "react";
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

const FIELD_LABELS: Record<string, string> = {
  eyebrow: "Texto superior",
  title: "Título",
  subtitle: "Subtítulo",
  ctaLabel: "Texto del botón",
  ctaHref: "Enlace del botón (ruta interna, ej. /catalogo)",
  secondaryLabel: "Texto del botón secundario",
  secondaryHref: "Enlace del botón secundario",
  body: "Texto",
  imageUrl: "Imagen (URL)",
  reverse: "Mostrar la imagen a la derecha",
  limit: "Cantidad de productos a mostrar",
  viewAllHref: "Enlace de “Ver todo”",
  tone: "Fondo de la sección",
  name: "Nombre",
  city: "Ciudad",
  quote: "Testimonio",
  question: "Pregunta",
  answer: "Respuesta",
  offerLabel: "Oferta destacada (usa {precio} para el precio real del catálogo)",
  includesNote: "Qué incluye la compra",
  excludesNote: "Qué NO incluye la compra",
  imageAlt: "Descripción de la imagen (accesibilidad)",
  verified: "Testimonio verificado (sin marcar no se publica)",
  product: "Producto o tono",
  date: "Fecha (AAAA-MM-DD)",
};

const ITEM_LABELS: Record<BlockType, string> = {
  hero: "elemento",
  color_families: "elemento",
  product_collection: "elemento",
  benefits: "beneficio",
  image_text: "elemento",
  testimonials: "testimonio",
  faq: "pregunta",
  cta: "elemento",
};

function humanizeKey(key: string) {
  return FIELD_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function emptyItemFor(type: BlockType): Record<string, string | boolean> {
  if (type === "benefits") return { title: "", body: "" };
  // `verified: false` por defecto: un testimonio nuevo nace sin publicar
  // hasta que alguien confirme que es real y autorizado.
  if (type === "testimonials") return { name: "", city: "", quote: "", verified: false };
  if (type === "faq") return { question: "", answer: "" };
  return {};
}

/**
 * Traduce el JSON de configuración de un bloque a campos guiados (sección
 * 15.4: una persona no técnica debe poder entender el editor). Cada bloque
 * conocido usa una forma plana + como mucho una lista de objetos (`items`),
 * salvo `product_collection.source`, que es una unión de dos formas y se
 * trata aparte. El JSON avanzado sigue disponible para casos no cubiertos.
 */
function BlockFields({
  type,
  fields,
  onChange,
}: {
  type: BlockType;
  fields: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...fields, [key]: value });
  const entries = Object.entries(fields);

  return (
    <div className="grid gap-4">
      {entries.map(([key, value]) => {
        if (key === "items" && Array.isArray(value)) {
          // Un elemento puede tener campos booleanos (p. ej. `verified` de
          // un testimonio), no solo texto.
          const items = value as Array<Record<string, string | boolean>>;
          return (
            <fieldset key={key} className="grid gap-3 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-semibold">Elementos</legend>
              {items.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                      {ITEM_LABELS[type]} {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => set("items", items.filter((_, i) => i !== index))}
                      disabled={items.length <= 1}
                      className="text-xs font-semibold text-danger disabled:opacity-40"
                    >
                      Quitar
                    </button>
                  </div>
                  {Object.entries(item).map(([itemKey, itemValue]) => (
                    <label
                      key={itemKey}
                      className={
                        typeof itemValue === "boolean"
                          ? "flex items-center gap-2 text-xs font-semibold"
                          : "grid gap-1 text-xs font-semibold"
                      }
                    >
                      {typeof itemValue === "boolean" ? (
                        /* `verified` de un testimonio: casilla, no texto — de
                           lo contrario "false" se guardaría como cadena y
                           un testimonio sin verificar parecería verificado. */
                        <input
                          type="checkbox"
                          checked={itemValue}
                          onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, [itemKey]: event.target.checked };
                            set("items", next);
                          }}
                        />
                      ) : null}
                      {humanizeKey(itemKey)}
                      {typeof itemValue === "boolean" ? null : itemKey === "body" || itemKey === "quote" || itemKey === "answer" ? (
                        <textarea
                          className={`${textarea} min-h-16 font-normal`}
                          value={itemValue}
                          onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, [itemKey]: event.target.value };
                            set("items", next);
                          }}
                        />
                      ) : (
                        <input
                          className={`${input} font-normal`}
                          value={itemValue}
                          onChange={(event) => {
                            const next = [...items];
                            next[index] = { ...item, [itemKey]: event.target.value };
                            set("items", next);
                          }}
                        />
                      )}
                    </label>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("items", [...items, emptyItemFor(type)])}
                className="h-9 w-fit rounded-md border border-border px-3 text-xs font-semibold"
              >
                Añadir {ITEM_LABELS[type]}
              </button>
            </fieldset>
          );
        }
        if (key === "source" && value && typeof value === "object") {
          const source = value as { collectionSlug?: string; filter?: string };
          const useCollection = "collectionSlug" in source;
          return (
            <fieldset key={key} className="grid gap-3 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-semibold">Origen de los productos</legend>
              <label className="grid gap-1 text-xs font-semibold">
                Tipo de origen
                <select
                  className={`${input} font-normal`}
                  value={useCollection ? "collection" : "filter"}
                  onChange={(event) =>
                    set("source", event.target.value === "collection" ? { collectionSlug: "" } : { filter: "featured" })
                  }
                >
                  <option value="collection">Colección específica</option>
                  <option value="filter">Filtro automático</option>
                </select>
              </label>
              {useCollection ? (
                <label className="grid gap-1 text-xs font-semibold">
                  Slug de la colección
                  <input className={`${input} font-normal`} value={source.collectionSlug ?? ""} onChange={(event) => set("source", { collectionSlug: event.target.value })} />
                </label>
              ) : (
                <label className="grid gap-1 text-xs font-semibold">
                  Filtro
                  <select className={`${input} font-normal`} value={source.filter ?? "featured"} onChange={(event) => set("source", { filter: event.target.value })}>
                    <option value="featured">Destacados</option>
                    <option value="promotion">En promoción</option>
                    <option value="newest">Novedades</option>
                    <option value="best_selling">Más vendidos</option>
                  </select>
                </label>
              )}
            </fieldset>
          );
        }
        if (key === "tone") {
          return (
            <label key={key} className="grid gap-1 text-sm font-semibold">
              {humanizeKey(key)}
              <select className={input} value={String(value ?? "default")} onChange={(event) => set(key, event.target.value)}>
                <option value="default">Estándar</option>
                <option value="sunken">Resaltado</option>
              </select>
            </label>
          );
        }
        if (typeof value === "boolean") {
          return (
            <label key={key} className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={value} onChange={(event) => set(key, event.target.checked)} />
              {humanizeKey(key)}
            </label>
          );
        }
        if (typeof value === "number") {
          return (
            <label key={key} className="grid gap-1 text-sm font-semibold">
              {humanizeKey(key)}
              <input className={input} type="number" value={value} onChange={(event) => set(key, Number(event.target.value))} />
            </label>
          );
        }
        const stringValue = value === null || value === undefined ? "" : String(value);
        const long = key === "body" || key === "subtitle" || stringValue.length > 70;
        return (
          <label key={key} className="grid gap-1 text-sm font-semibold">
            {humanizeKey(key)}
            {long ? (
              <textarea className={textarea} value={stringValue} onChange={(event) => set(key, event.target.value)} />
            ) : (
              <input className={input} value={stringValue} onChange={(event) => set(key, event.target.value === "" && value === null ? null : event.target.value)} />
            )}
          </label>
        );
      })}
    </div>
  );
}

export function BlockEditor({
  pageId,
  block,
  position,
  total,
  media,
  dragHandle,
}: {
  pageId: string;
  block: { id: string; blockType: string; config: Record<string, unknown>; visibleOnMobile: boolean; visibleOnDesktop: boolean };
  position: number;
  total: number;
  media: Array<{ url: string; label: string }>;
  dragHandle?: ReactNode;
}) {
  const [saveState, saveAction, saving] = useActionState(updateBlockAction, INITIAL_ADMIN_ACTION_STATE);
  const [operationState, operationAction, operating] = useActionState(blockOperationAction, INITIAL_ADMIN_ACTION_STATE);
  const type = block.blockType as BlockType;
  const knownType = blockTypes.includes(type);
  const [mode, setMode] = useState<"fields" | "json">(knownType ? "fields" : "json");
  const [fields, setFields] = useState<Record<string, unknown>>(block.config);
  const [jsonText, setJsonText] = useState(JSON.stringify(block.config, null, 2));
  const [jsonError, setJsonError] = useState("");
  const [dirty, setDirty] = useState(false);
  const configJson = useMemo(() => (mode === "fields" ? JSON.stringify(fields) : jsonText), [mode, fields, jsonText]);
  const hidden = <><input type="hidden" name="pageId" value={pageId} /><input type="hidden" name="blockId" value={block.id} /></>;

  const switchToJson = () => {
    setJsonText(JSON.stringify(fields, null, 2));
    setMode("json");
  };
  const switchToFields = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      setFields(parsed);
      setJsonError("");
      setMode("fields");
    } catch {
      setJsonError("El JSON no es válido: corrígelo antes de volver a campos guiados.");
    }
  };

  return (
    <article className="rounded-xl border border-border bg-surface-raised">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {dragHandle}
          <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bloque {position + 1} de {total}</p><h3 className="font-semibold">{blockTypeLabels[type] ?? block.blockType}</h3></div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label={`Orden y acciones de ${blockTypeLabels[type] ?? "bloque"}`}>
          <form action={operationAction}>{hidden}<input type="hidden" name="operation" value="up" /><button disabled={operating || position === 0} className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40" aria-label="Subir bloque">↑</button></form>
          <form action={operationAction}>{hidden}<input type="hidden" name="operation" value="down" /><button disabled={operating || position === total - 1} className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40" aria-label="Bajar bloque">↓</button></form>
          <form action={operationAction}>{hidden}<input type="hidden" name="operation" value="duplicate" /><button disabled={operating} className="h-9 rounded-md border border-border px-3 text-sm font-semibold">Duplicar</button></form>
          <form action={operationAction} onSubmit={(event) => { if (!window.confirm("¿Eliminar este bloque del borrador? La versión publicada no cambiará hasta que publiques de nuevo.")) event.preventDefault(); }}>{hidden}<input type="hidden" name="operation" value="delete" /><button disabled={operating} className="h-9 rounded-md border border-danger/30 px-3 text-sm font-semibold text-danger">Eliminar</button></form>
        </div>
      </header>
      <form
        action={saveAction}
        className="grid gap-4 p-4"
        onChange={() => setDirty(true)}
      >
        {hidden}
        <input type="hidden" name="configJson" value={configJson} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Contenido del bloque</span>
          {knownType ? (
            <button type="button" onClick={mode === "fields" ? switchToJson : switchToFields} className="text-xs font-semibold text-brand hover:underline">
              {mode === "fields" ? "Editar como JSON avanzado" : "Volver a campos guiados"}
            </button>
          ) : null}
        </div>
        {mode === "fields" ? (
          <BlockFields type={type} fields={fields} onChange={(next) => { setFields(next); setDirty(true); }} />
        ) : (
          <div className="grid gap-2">
            <p className="text-xs text-text-muted">Edita el contenido respetando las claves visibles. Los errores se explican antes de guardar.</p>
            <textarea
              className={`${textarea} min-h-56 font-mono`}
              value={jsonText}
              onChange={(event) => { setJsonText(event.target.value); setJsonError(""); setDirty(true); }}
              spellCheck={false}
            />
            {jsonError ? <p role="alert" className="text-sm text-danger">{jsonError}</p> : null}
          </div>
        )}
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
