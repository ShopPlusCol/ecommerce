import { describe, expect, it } from "vitest";
import { validateMedia } from "@/modules/media/validation";
import { isVideoUrl } from "@/lib/media-type";

function validPng(): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  return bytes;
}

function validMp4(size = 32): Uint8Array {
  const bytes = new Uint8Array(size);
  // Caja "ftyp" mínima: tamaño (4 bytes) + "ftyp" + marca de compatibilidad.
  bytes.set([0x00, 0x00, 0x00, 0x18], 0);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
  bytes.set([0x69, 0x73, 0x6f, 0x6d], 8); // "isom"
  return bytes;
}

function validWebm(size = 16): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0x1a, 0x45, 0xdf, 0xa3], 0);
  return bytes;
}

describe("validateMedia — imágenes (sin cambios de comportamiento)", () => {
  it("acepta un PNG válido", () => {
    expect(validateMedia(validPng(), "image/png")).toMatchObject({ contentType: "image/png" });
  });

  it("rechaza un archivo cuyo contenido no coincide con el tipo declarado", () => {
    expect(() => validateMedia(new Uint8Array([1, 2, 3, 4]), "image/png")).toThrow(
      "El contenido real no coincide con el tipo de imagen declarado.",
    );
  });

  it("rechaza imágenes de más de 8 MB", () => {
    const big = new Uint8Array(8 * 1024 * 1024 + 1);
    big.set(validPng(), 0);
    expect(() => validateMedia(big, "image/png")).toThrow(/8 MB/);
  });
});

describe("validateMedia — video (sección 8.5)", () => {
  it("acepta un MP4 válido", () => {
    const result = validateMedia(validMp4(), "video/mp4");
    expect(result.contentType).toBe("video/mp4");
    expect(result.width).toBeNull();
  });

  it("acepta un WebM válido", () => {
    const result = validateMedia(validWebm(), "video/webm");
    expect(result.contentType).toBe("video/webm");
  });

  it("rechaza un archivo declarado como MP4 sin la firma real", () => {
    expect(() => validateMedia(new Uint8Array(32), "video/mp4")).toThrow(
      "El contenido real no coincide con el tipo de video declarado.",
    );
  });

  it("rechaza un archivo declarado como WebM sin la firma real", () => {
    expect(() => validateMedia(new Uint8Array(16), "video/webm")).toThrow(
      "El contenido real no coincide con el tipo de video declarado.",
    );
  });

  it("permite video hasta 60 MB, más que el límite de imágenes", () => {
    const nine = new Uint8Array(9 * 1024 * 1024);
    nine.set(validMp4(), 0);
    expect(() => validateMedia(nine, "video/mp4")).not.toThrow();
  });

  it("rechaza video de más de 60 MB", () => {
    const tooBig = new Uint8Array(60 * 1024 * 1024 + 1);
    tooBig.set(validMp4(), 0);
    expect(() => validateMedia(tooBig, "video/mp4")).toThrow(/60 MB/);
  });
});

describe("validateMedia — formatos no permitidos", () => {
  it("rechaza un tipo MIME desconocido", () => {
    expect(() => validateMedia(new Uint8Array([1]), "video/quicktime")).toThrow("Formato no permitido");
  });
});

describe("isVideoUrl", () => {
  it("reconoce extensiones de video comunes", () => {
    expect(isVideoUrl("/uploads/2026-07/producto.mp4")).toBe(true);
    expect(isVideoUrl("https://cdn.example.com/x/clip.webm")).toBe(true);
    expect(isVideoUrl("/uploads/video.mov?v=2")).toBe(true);
  });

  it("no confunde imágenes con video", () => {
    expect(isVideoUrl("/uploads/producto.png")).toBe(false);
    expect(isVideoUrl("/uploads/producto.jpg")).toBe(false);
    expect(isVideoUrl("/uploads/sin-extension")).toBe(false);
  });
});
