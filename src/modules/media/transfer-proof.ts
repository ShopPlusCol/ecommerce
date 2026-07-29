import { validateMedia, type ValidatedMedia } from "@/modules/media/validation";

export const MAX_TRANSFER_PROOF_BYTES = 8 * 1024 * 1024;

const ALLOWED_TRANSFER_PROOF_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateTransferProof(bytes: Uint8Array, declaredType: string): ValidatedMedia {
  if (!ALLOWED_TRANSFER_PROOF_TYPES.has(declaredType)) {
    throw new Error("Formato no permitido. Usa PNG, JPEG o WebP.");
  }
  if (!bytes.length || bytes.length > MAX_TRANSFER_PROOF_BYTES) {
    throw new Error("El comprobante debe pesar entre 1 byte y 8 MB.");
  }
  return validateMedia(bytes, declaredType);
}
