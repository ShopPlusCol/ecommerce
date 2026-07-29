import Link from "next/link";
import { eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { manualTransferProofs, mediaAssets, payments } from "@/infrastructure/db/schema";
import { reviewManualTransferAction } from "../actions";
export default async function Page() {
  await requirePermission("payments", "read"); const db = await getRuntimeDb();
  const rows = await db.select({ payment: payments, proof: manualTransferProofs, asset: mediaAssets })
    .from(payments).leftJoin(manualTransferProofs, eq(manualTransferProofs.paymentId, payments.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, manualTransferProofs.mediaAssetId));
  return <><AdminPageHeader title="Pagos" description="Los comprobantes requieren revisión explícita." />
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Referencia</th><th>Proveedor</th><th>Monto</th><th>Estado</th><th>Comprobante</th><th>Revisión</th></tr></thead>
      <tbody>{rows.map(({ payment, proof, asset }) => <tr key={`${payment.id}-${proof?.id ?? ""}`} className="border-b"><td className="p-3">{payment.externalReference}</td><td>{payment.provider}</td><td>${payment.amount.toLocaleString("es-CO")}</td><td>{proof?.status ?? payment.status}</td><td>{asset ? <Link href={asset.url} target="_blank" className="text-brand underline">Ver</Link> : "—"}</td><td>{proof?.status === "pending" ? <form action={reviewManualTransferAction} className="flex gap-2 p-2"><input type="hidden" name="proofId" value={proof.id} /><input name="reason" placeholder="Motivo si rechaza" className="rounded border p-1" /><button name="decision" value="approved" className="rounded border px-2">Aprobar</button><button name="decision" value="rejected" className="rounded border px-2">Rechazar</button></form> : "—"}</td></tr>)}</tbody>
    </table></div></>;
}
