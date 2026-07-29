"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { uploadMediaInlineAction } from "@/app/admin/medios/actions";

type MediaOption = { url: string; label: string };

export function AdminMediaUrlField({
  name,
  label,
  value = "",
  assets = [],
  required = false,
  onChange,
}: {
  name?: string;
  label: string;
  value?: string;
  assets?: MediaOption[];
  required?: boolean;
  onChange?: (url: string) => void;
}) {
  const [selected, setSelected] = useState(value);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (url: string) => {
    setSelected(url);
    onChange?.(url);
  };

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Selecciona una imagen desde tu equipo.");
      return;
    }
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", label);
    const result = await uploadMediaInlineAction(formData);
    setUploading(false);
    setMessage(result.message);
    if (result.status === "success") {
      update(result.asset.url);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const options =
    selected && !assets.some((asset) => asset.url === selected)
      ? [{ url: selected, label: "Imagen actual" }, ...assets]
      : assets;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface p-3">
      <label className="grid gap-1 text-sm font-semibold">
        {label}
        {assets.length ? (
          <select
            className="h-10 rounded-md border border-border bg-surface px-3 font-normal"
            value={selected}
            onChange={(event) => update(event.target.value)}
          >
            <option value="">Sin imagen</option>
            {options.map((asset) => (
              <option key={asset.url} value={asset.url}>{asset.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className="h-10 rounded-md border border-border bg-surface px-3 font-normal"
            value={selected}
            onChange={(event) => update(event.target.value)}
            placeholder="https://… o carga un archivo"
            required={required}
          />
        )}
      </label>
      {name ? <input type="hidden" name={name} value={selected} /> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface p-2 text-sm"
          aria-label={`Subir ${label.toLocaleLowerCase("es-CO")}`}
        />
        <button
          type="button"
          onClick={upload}
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-60"
        >
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Subiendo…" : "Subir y usar"}
        </button>
      </div>
      {selected ? (
        <div className="flex items-center gap-3">
          <div className="grid h-20 w-28 place-items-center overflow-hidden rounded-md border border-border bg-surface-sunken">
            <Image src={selected} alt="" width={112} height={80} unoptimized className="max-h-full max-w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => update("")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-danger/30 px-3 text-sm font-semibold text-danger"
          >
            <Trash2 className="h-4 w-4" />
            Quitar
          </button>
        </div>
      ) : null}
      {message ? <p role="status" className="text-xs text-text-muted">{message}</p> : null}
    </div>
  );
}
