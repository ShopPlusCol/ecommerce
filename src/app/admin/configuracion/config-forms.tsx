"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import type { BrandSettings } from "@/modules/settings/brand";
import type { ManualTransferSettings } from "@/modules/settings/manual-transfer";
import type { PrivacySettings } from "@/modules/settings/privacy";
import type { ShippingMessagesSettings } from "@/modules/settings/shipping-messages";
import type { PaymentMethodsSettings } from "@/modules/settings/payment-methods";
import type { SiteTextsSettings } from "@/modules/settings/site-texts";
import {
  CHECKOUT_FIELD_LABELS,
  LOCKED_CHECKOUT_FIELDS,
  NO_REQUIRED_TOGGLE_FIELDS,
  type CheckoutFieldConfig,
  type CheckoutFieldId,
} from "@/modules/checkout/checkout-fields";
import type { PaymentMethodId } from "@/domain/services/payments";
import { MediaSettingField } from "./media-setting-field";
import {
  saveBrandSettingsAction,
  saveManualTransferSettingsAction,
  savePrivacySettingsAction,
  saveShippingMessagesSettingsAction,
  savePaymentMethodsSettingsAction,
  saveSiteTextsSettingsAction,
  saveCheckoutFieldsSettingsAction,
} from "./actions";

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

const PAYMENT_METHOD_IDS: Array<{ id: PaymentMethodId; caption: string }> = [
  { id: "mercado_pago", caption: "Mercado Pago" },
  { id: "cash_on_delivery", caption: "Contraentrega" },
  { id: "shipping_advance_transfer", caption: "Anticipo del envío" },
  { id: "transfer_full", caption: "Transferencia total" },
];

export function PaymentMethodsSettingsForm({
  paymentMethods,
}: {
  paymentMethods: PaymentMethodsSettings;
}) {
  const [state, action, pending] = useActionState(savePaymentMethodsSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form id="metodos-pago" action={action} className="mt-6 grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-lg font-semibold">Métodos de pago</h2>
      <p className="text-sm text-text-muted">
        El nombre y la descripción se muestran al cliente en el checkout y en la confirmación del pedido. No cambia cuáles
        métodos están disponibles ni cómo se cobran — eso depende de la integración y de la configuración de envíos.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PAYMENT_METHOD_IDS.map(({ id, caption }) => (
          <fieldset key={id} className="grid gap-2 rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">{caption}</legend>
            <label className="text-sm font-semibold">
              Nombre
              <input name={`${id}_name`} defaultValue={paymentMethods[id].name} required maxLength={60} className={control} />
            </label>
            <label className="text-sm font-semibold">
              Descripción
              <textarea
                name={`${id}_description`}
                defaultValue={paymentMethods[id].description}
                maxLength={200}
                className="mt-1 min-h-16 w-full rounded-md border border-border bg-surface p-3 text-sm font-normal"
              />
            </label>
          </fieldset>
        ))}
      </div>
      <button disabled={pending} className="h-11 w-fit rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar métodos de pago"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

const SITE_TEXT_FIELDS: Array<{ name: keyof SiteTextsSettings; label: string; hint?: string; long?: boolean }> = [
  { name: "headerAnnouncement", label: "Barra de anuncio del encabezado", hint: "Se muestra arriba de todo, en cada página." },
  { name: "whatsappInquiryTemplate", label: "Mensaje de WhatsApp — consulta general", hint: 'Botón flotante y ficha de producto. Debe incluir "{marca}".' },
  { name: "whatsappCartIntro", label: "Mensaje de WhatsApp — inicio del carrito" },
  { name: "whatsappCartClosingNote", label: "Mensaje de WhatsApp — nota final del carrito" },
  { name: "checkoutPaymentDisclaimer", label: "Aviso de pago en el checkout", long: true },
  { name: "shippingPageMedellinBody", label: '"/envíos" — texto de Medellín y Área Metropolitana', long: true },
  { name: "shippingPageRestBody", label: '"/envíos" — texto del resto de Colombia', long: true },
  { name: "shippingPageNote", label: '"/envíos" — nota al pie', long: true },
];

export function SiteTextsSettingsForm({
  siteTexts,
}: {
  siteTexts: SiteTextsSettings;
}) {
  const [state, action, pending] = useActionState(saveSiteTextsSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form id="textos" action={action} className="mt-6 grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-lg font-semibold">Textos del sitio</h2>
      <p className="text-sm text-text-muted">
        Textos de alta visibilidad que no dependen de ninguna otra sección de Configuración.
      </p>
      {SITE_TEXT_FIELDS.map(({ name, label, hint, long }) => (
        <label key={name} className="text-sm font-semibold">
          {label}
          {long ? (
            <textarea name={name} defaultValue={siteTexts[name]} required maxLength={400} className="mt-1 min-h-20 w-full rounded-md border border-border bg-surface p-3 text-sm font-normal" />
          ) : (
            <input name={name} defaultValue={siteTexts[name]} required maxLength={200} className={control} />
          )}
          {hint ? <span className="mt-1 block text-xs font-normal text-text-muted">{hint}</span> : null}
        </label>
      ))}
      <button disabled={pending} className="h-11 w-fit rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar textos"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CheckoutFieldsSettingsForm({
  fields,
}: {
  fields: CheckoutFieldConfig[];
}) {
  const [state, action, pending] = useActionState(saveCheckoutFieldsSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  const [order, setOrder] = useState<CheckoutFieldId[]>(() => fields.map((field) => field.id));
  const [draggingId, setDraggingId] = useState<CheckoutFieldId | null>(null);
  const [overId, setOverId] = useState<CheckoutFieldId | null>(null);
  const byId = new Map(fields.map((field) => [field.id, field]));

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  }

  function handleDrop(targetId: CheckoutFieldId) {
    const sourceId = draggingId;
    setDraggingId(null);
    setOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) return;
    move(from, to);
  }

  return (
    <form id="checkout" action={action} className="mt-6 grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-lg font-semibold">Formulario de checkout</h2>
      <p className="text-sm text-text-muted">
        Activa o desactiva campos, márcalos obligatorios y arrastra (⠿, o usa ↑/↓) para reordenarlos. Nombre, teléfono, ubicación
        y dirección son necesarios para calcular el envío y contactar al cliente — siempre están activos y obligatorios, pero
        igual puedes moverlos de posición.
      </p>
      <input type="hidden" name="order" value={JSON.stringify(order)} readOnly />
      <div className="grid gap-2">
        {order.map((id, index) => {
          const field = byId.get(id);
          if (!field) return null;
          const locked = (LOCKED_CHECKOUT_FIELDS as readonly CheckoutFieldId[]).includes(id);
          const noRequiredToggle = (NO_REQUIRED_TOGGLE_FIELDS as readonly CheckoutFieldId[]).includes(id);
          const isDropTarget = overId === id && draggingId !== null && draggingId !== id;
          return (
            <div
              key={id}
              onDragOver={(event) => {
                if (!draggingId) return;
                event.preventDefault();
                if (overId !== id) setOverId(id);
              }}
              onDragLeave={() => setOverId((current) => (current === id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(id);
              }}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border p-3 transition",
                isDropTarget ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "border-border",
                draggingId === id ? "opacity-50" : "",
              )}
            >
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  setDraggingId(id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", id);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverId(null);
                }}
                className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md border border-border text-text-muted hover:border-brand/40 hover:text-brand active:cursor-grabbing"
                aria-label={`Arrastrar para reordenar "${CHECKOUT_FIELD_LABELS[id]}"`}
                title="Arrastrar para reordenar"
              >
                <span aria-hidden="true">⠿</span>
              </button>
              <div className="flex shrink-0 flex-col">
                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} className="text-xs text-text-muted disabled:opacity-30" aria-label={`Subir "${CHECKOUT_FIELD_LABELS[id]}"`}>▲</button>
                <button type="button" onClick={() => move(index, index + 1)} disabled={index === order.length - 1} className="text-xs text-text-muted disabled:opacity-30" aria-label={`Bajar "${CHECKOUT_FIELD_LABELS[id]}"`}>▼</button>
              </div>
              <span className="flex-1 text-sm font-semibold">{CHECKOUT_FIELD_LABELS[id]}</span>
              {locked ? (
                <span className="rounded-full bg-surface-sunken px-2 py-1 text-xs font-semibold text-text-muted">Siempre activo y obligatorio</span>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold">
                    <input type="checkbox" name={`${id}_enabled`} defaultChecked={field.enabled} className="h-3.5 w-3.5 accent-brand" />
                    Activo
                  </label>
                  {noRequiredToggle ? null : (
                    <label className="flex items-center gap-1.5 text-xs font-semibold">
                      <input type="checkbox" name={`${id}_required`} defaultChecked={field.required} className="h-3.5 w-3.5 accent-brand" />
                      Obligatorio
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button disabled={pending} className="h-11 w-fit rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar formulario"}
      </button>
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

export function ShippingMessagesSettingsForm({
  shippingMessages,
}: {
  shippingMessages: ShippingMessagesSettings;
}) {
  const [state, action, pending] = useActionState(saveShippingMessagesSettingsAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form id="envios" action={action} className="mt-6 grid max-w-5xl gap-4 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-lg font-semibold">Mensajes de envíos</h2>
      <label className="text-sm font-semibold">
        Mensaje cuando no hay cobertura
        <textarea
          name="noCoverageTemplate"
          defaultValue={shippingMessages.noCoverageTemplate}
          required
          maxLength={300}
          className="mt-1 min-h-20 w-full rounded-md border border-border bg-surface p-3 text-sm font-normal"
        />
      </label>
      <p className="text-sm text-text-muted">
        Se muestra en el checkout cuando el destino no tiene cobertura y ese barrio/ciudad/departamento no tiene su propio mensaje personalizado. Usa{" "}
        <code className="rounded bg-surface-sunken px-1 py-0.5 text-xs">{"{lugar}"}</code> donde quieras que aparezca el nombre del destino.
      </p>
      <button disabled={pending} className="h-11 w-fit rounded-md bg-brand px-4 font-semibold text-white disabled:opacity-60">{pending ? "Guardando…" : "Guardar mensaje"}</button>
      <Feedback state={state} />
    </form>
  );
}
