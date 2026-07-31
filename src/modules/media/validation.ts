const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const ALLOWED_IMAGE = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm"]);
const ALLOWED = new Set([...ALLOWED_IMAGE, ...ALLOWED_VIDEO]);

export type ValidatedMedia = {
  contentType: string;
  body: Uint8Array;
  width: number | null;
  height: number | null;
};

function pngSize(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegSize(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }
    offset += 2 + length;
  }
  return null;
}

function sanitizeSvg(bytes: Uint8Array) {
  const source = new TextDecoder().decode(bytes);
  if (!/<svg[\s>]/i.test(source)) throw new Error("El archivo no contiene un SVG válido.");
  if (/<(?:script|foreignObject|iframe|object|embed)\b/i.test(source) || /\son\w+\s*=/i.test(source) || /javascript:/i.test(source)) {
    throw new Error("El SVG contiene elementos no permitidos.");
  }
  return new TextEncoder().encode(source.replace(/<\?xml[\s\S]*?\?>/gi, ""));
}

/** Caja "ftyp" del contenedor ISO-BMFF (MP4/MOV) dentro de los primeros bytes del archivo. */
function isMp4(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
}

/** Firma EBML de Matroska/WebM. */
function isWebm(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
}

export function validateMedia(bytes: Uint8Array, declaredType: string): ValidatedMedia {
  if (!ALLOWED.has(declaredType)) throw new Error("Formato no permitido. Usa PNG, JPEG, WebP, SVG, MP4 o WebM.");
  const isVideo = ALLOWED_VIDEO.has(declaredType);
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!bytes.length || bytes.length > maxBytes) {
    throw new Error(`El archivo debe pesar entre 1 byte y ${maxBytes / (1024 * 1024)} MB.`);
  }

  if (isVideo) {
    const mp4 = isMp4(bytes);
    const webm = isWebm(bytes);
    if ((declaredType === "video/mp4" && !mp4) || (declaredType === "video/webm" && !webm)) {
      throw new Error("El contenido real no coincide con el tipo de video declarado.");
    }
    return { contentType: declaredType, body: bytes, width: null, height: null };
  }

  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  const svg = declaredType === "image/svg+xml";
  if ((!png && declaredType === "image/png") || (!jpeg && declaredType === "image/jpeg") || (!webp && declaredType === "image/webp")) {
    throw new Error("El contenido real no coincide con el tipo de imagen declarado.");
  }

  const body = svg ? sanitizeSvg(bytes) : bytes;
  const size = png ? pngSize(body) : jpeg ? jpegSize(body) : null;
  return { contentType: declaredType, body, width: size?.width ?? null, height: size?.height ?? null };
}
