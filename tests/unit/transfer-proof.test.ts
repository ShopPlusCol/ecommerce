import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import {
  MAX_TRANSFER_PROOF_BYTES,
  validateTransferProof,
} from "@/modules/media/transfer-proof";

function validPng(): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 640);
  view.setUint32(20, 480);
  return bytes;
}

describe("comprobantes de transferencia", () => {
  it("acepta una imagen PNG válida", () => {
    expect(validateTransferProof(validPng(), "image/png")).toMatchObject({
      contentType: "image/png",
      width: 640,
      height: 480,
    });
  });

  it("rechaza formatos que no están habilitados para comprobantes", () => {
    expect(() => validateTransferProof(new Uint8Array([1]), "image/svg+xml"))
      .toThrow("Formato no permitido. Usa PNG, JPEG o WebP.");
  });

  it("rechaza archivos mayores de 8 MB", () => {
    expect(() => validateTransferProof(
      new Uint8Array(MAX_TRANSFER_PROOF_BYTES + 1),
      "image/png",
    )).toThrow("El comprobante debe pesar entre 1 byte y 8 MB.");
  });

  it("configura margen multipart sobre el límite funcional", () => {
    // El techo global de Server Actions cubre el mayor límite funcional real:
    // los videos de producto (60 MB, ver validateMedia) más margen multipart.
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe("65mb");
  });
});
