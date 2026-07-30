"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import type { BrandSettings } from "@/modules/settings/brand";
import type { ManualTransferSettings } from "@/modules/settings/manual-transfer";
import type { PrivacySettings } from "@/modules/settings/privacy";
import { MediaSettingField } from "./media-setting-field";
import { saveBrandSettingsAction, saveManualTransferSettingsAction, savePrivacySettingsAction } from "./actions";

const control = "mt-1 h-10 w-full rounded-md border border-border bg-surface px-3";

function Feedback({ state }: { state: typeof INITIAL_ADMIN_ACTION_STATE }) {
  if (state.status === "idle") return null;
  return (
    <p role={state.status === "error" ? "alert" : "status"} className={`sm:col-span-2 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
      {state.message}
    </p>
  );
}

const brandFields = [
  ["name", "Nombre visible"], ["tagline", "Tagline"], ["description", "Descripción"],
  ["altText", "Texto alternativo"], ["email", "Correo"], ["whatsapp", "WhatsApp"],
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
] as const;

export function BrandSettingsForm({
  brand,
  assets,
}: {
  brand: BrandSettings;
  assets: Array<{ url: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(saveBrandSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form id="marca" action={action} className="grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Marca y recursos visuales</h2>
      <label className="text-sm font-semibold">
        Modo de marca
        <select name="mode" defaultValue={brand.mode} className={control}>
          <option value="text">Texto</option>
          <option value="image">Imagen</option>
          <option value="image_text">Imagen y texto</option>
        </select>
      </label>
      {brandFields.map(([name, label]) => (
        <label key={name} className="text-sm font-semibold">
          {label}
          <input name={name} defaultValue={brand[name] ?? ""} className={control} />
        </label>
      ))}
      <MediaSettingField name="logoUrl" label="Logo principal" value={brand.logoUrl} assets={assets} />
      <MediaSettingField name="mobileLogoUrl" label="Logo móvil" value={brand.mobileLogoUrl} assets={assets} />
      <MediaSettingField name="footerLogoUrl" label="Logo del pie" value={brand.footerLogoUrl} assets={assets} />
      <MediaSettingField name="faviconUrl" label="Favicon" value={brand.faviconUrl} assets={assets} />
      <MediaSettingField name="appleTouchIconUrl" label="Apple Touch Icon" value={brand.appleTouchIconUrl} assets={assets} />
      <MediaSettingField name="openGraphImageUrl" label="Imagen Open Graph" value={brand.openGraphImageUrl} assets={assets} />
      <button disabled={pending} className="h-11 rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60 sm:col-span-2">{pending ? "Guardando…" : "Guardar identidad visual"}</button>
      <Feedback state={state} />
    </form>
  );
}

const transferFields = [
  ["bankName", "Banco"], ["accountType", "Tipo de cuenta"], ["accountNumber", "Número"],
  ["accountHolder", "Titular"], ["instructions", "Instrucciones"],
] as const;

export function ManualTransferSettingsForm({
  transfer,
  assets,
}: {
  transfer: ManualTransferSettings;
  assets: Array<{ url: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(saveManualTransferSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form id="pagos" action={action} className="mt-6 grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Transferencia manual</h2>
      {transferFields.map(([name, label]) => (
        <label key={name} className="text-sm font-semibold">
          {label}
          <input name={name} defaultValue={transfer[name] ?? ""} className={control} />
        </label>
      ))}
      <div className="sm:col-span-2"><MediaSettingField name="qrUrl" label="QR bancario" value={transfer.qrUrl} assets={assets} /></div>
      <button disabled={pending} className="h-11 rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60 sm:col-span-2">{pending ? "Guardando…" : "Guardar transferencia"}</button>
      <Feedback state={state} />
    </form>
  );
}

export function PrivacySettingsForm({
  privacy,
}: {
  privacy: PrivacySettings;
}) {
  const [state, action, pending] = useActionState(savePrivacySettingsAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form id="privacidad" action={action} className="mt-6 grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Privacidad y retención</h2>
      <label className="text-sm font-semibold">Versión de política<input type="date" name="policyVersion" defaultValue={privacy.policyVersion} required className={control} /></label>
      <label className="text-sm font-semibold">
        Revisión legal
        <select name="legalReviewStatus" defaultValue={privacy.legalReviewStatus} className={control}>
          <option value="pending">Pendiente</option>
          <option value="reviewed">Revisada por el negocio</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Responsable<input name="controllerName" defaultValue={privacy.controllerName} required className={control} /></label>
      <label className="text-sm font-semibold">Identificación legal<input name="legalId" defaultValue={privacy.legalId} className={control} /></label>
      <label className="text-sm font-semibold sm:col-span-2">Domicilio<input name="address" defaultValue={privacy.address} className={control} /></label>
      <label className="text-sm font-semibold sm:col-span-2">Correo de privacidad<input type="email" name="privacyEmail" defaultValue={privacy.privacyEmail} required className={control} /></label>
      {([
        ["orderRetentionMonths", "Retención de pedidos (meses)"],
        ["proofRetentionMonths", "Retención de comprobantes (meses)"],
        ["auditRetentionMonths", "Retención de auditoría (meses)"],
      ] as const).map(([name, label]) => (
        <label key={name} className="text-sm font-semibold">
          {label}
          <input type="number" min="1" max="240" name={name} defaultValue={privacy[name]} required className={control} />
        </label>
      ))}
      <p className="text-sm text-text-muted sm:col-span-2">La aplicación ayuda a aplicar privacidad y retención; no sustituye la revisión legal del negocio.</p>
      <button disabled={pending} className="h-11 rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60 sm:col-span-2">{pending ? "Guardando…" : "Guardar privacidad"}</button>
      <Feedback state={state} />
    </form>
  );
}
