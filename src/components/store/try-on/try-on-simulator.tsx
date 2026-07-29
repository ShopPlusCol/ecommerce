"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, RotateCcw, Trash2, X } from "lucide-react";
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Product } from "@/domain/entities/catalog";
import type { TryOnTexture } from "@/domain/entities/try-on";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { fallbackGeometry, geometryFromFaceLandmarks, type FaceGeometry } from "@/modules/try-on/geometry";
import { fallbackTexture } from "@/modules/try-on/texture";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Adjustments = { x: number; y: number; scale: number; rotation: number };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No fue posible leer la imagen."));
    image.src = url;
  });
}

function tintTexture(
  source: HTMLImageElement,
  correction: TryOnTexture["colorCorrection"],
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth || 200;
  canvas.height = source.naturalHeight || 200;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const saturation = correction.saturation ?? 100;
  const brightness = correction.brightness ?? 100;
  context.filter = `saturate(${saturation}%) brightness(${brightness}%)`;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (correction.tint) {
    context.globalCompositeOperation = "source-atop";
    context.globalAlpha = 0.58;
    context.fillStyle = correction.tint;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

function drawEye(
  context: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  textureCanvas: HTMLCanvasElement,
  geometry: FaceGeometry["left"],
  texture: TryOnTexture,
  adjustments: Adjustments,
  canvasWidth: number,
  canvasHeight: number,
) {
  const centerX = (geometry.centerX + adjustments.x / 100) * canvasWidth;
  const centerY = (geometry.centerY + adjustments.y / 100) * canvasHeight;
  const baseRadius = Math.max(geometry.radiusX * canvasWidth, geometry.radiusY * canvasHeight, canvasWidth * 0.017);
  const scale = adjustments.scale / 100;
  const radiusX = baseRadius * (texture.baseSize / 100) * (texture.scaleX / 100) * scale;
  const radiusY = baseRadius * (texture.baseSize / 100) * (texture.scaleY / 100) * scale;
  const rotation = geometry.rotation + ((texture.rotationOffset + adjustments.rotation) * Math.PI) / 180;

  context.save();
  if (geometry.eyelid.length) {
    context.beginPath();
    geometry.eyelid.forEach((point, index) => {
      const x = point.x * canvasWidth;
      const y = point.y * canvasHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.clip();
  }
  context.translate(centerX, centerY);
  context.rotate(rotation);
  context.globalAlpha = texture.opacity / 100;
  context.globalCompositeOperation = texture.blendMode;
  context.drawImage(textureCanvas, -radiusX, -radiusY, radiusX * 2, radiusY * 2);
  context.restore();

  const pupilRadius = Math.min(radiusX, radiusY) * 0.32;
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, pupilRadius, 0, Math.PI * 2);
  context.clip();
  context.drawImage(photo, 0, 0, canvasWidth, canvasHeight);
  context.restore();
}

export function TryOnSimulator({
  products,
  textures,
  onClose,
}: {
  products: Product[];
  textures: TryOnTexture[];
  onClose: () => void;
}) {
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [geometry, setGeometry] = useState<FaceGeometry>(fallbackGeometry);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [before, setBefore] = useState(false);
  const [status, setStatus] = useState("Selecciona una foto frontal con buena luz.");
  const [busy, setBusy] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustments>({ x: 0, y: 0, scale: 100, rotation: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const selectedTexture = useMemo(() => {
    if (!selectedProduct) return null;
    return textures.find((texture) => texture.productId === selectedProduct.id) ?? fallbackTexture(selectedProduct);
  }, [selectedProduct, textures]);

  const clearPhoto = useCallback(() => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(null);
    setPhotoUrl(null);
    setGeometry(fallbackGeometry());
    setAdjustments({ x: 0, y: 0, scale: 100, rotation: 0 });
    setBefore(false);
    setStatus("Foto eliminada del navegador.");
    if (fileRef.current) fileRef.current.value = "";
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, [photoUrl]);

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      landmarkerRef.current?.close();
    },
    [photoUrl],
  );

  useEffect(() => {
    if (!photo || !selectedTexture) return;
    let cancelled = false;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxSide = 1280;
      const ratio = Math.min(1, maxSide / Math.max(photo.naturalWidth, photo.naturalHeight));
      canvas.width = Math.round(photo.naturalWidth * ratio);
      canvas.height = Math.round(photo.naturalHeight * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(photo, 0, 0, canvas.width, canvas.height);
      if (before) return;
      try {
        const textureImage = await loadImage(selectedTexture.textureUrl);
        if (cancelled) return;
        const corrected = tintTexture(textureImage, selectedTexture.colorCorrection);
        drawEye(context, photo, corrected, geometry.right, selectedTexture, adjustments, canvas.width, canvas.height);
        drawEye(context, photo, corrected, geometry.left, selectedTexture, adjustments, canvas.width, canvas.height);
      } catch {
        setStatus("La textura no pudo cargarse; elige otro tono o inténtalo de nuevo.");
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [adjustments, before, geometry, photo, selectedTexture]);

  const analyzePhoto = async (image: HTMLImageElement) => {
    setBusy(true);
    setStatus("Analizando los ojos localmente…");
    const startedAt = performance.now();
    try {
      if (!landmarkerRef.current) {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "IMAGE",
          numFaces: 1,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
        });
      }
      const result = landmarkerRef.current.detect(image);
      if (result.faceLandmarks.length !== 1) {
        throw new Error("No se detectó un rostro frontal. Puedes usar el ajuste manual.");
      }
      setGeometry(geometryFromFaceLandmarks(result.faceLandmarks[0] as NormalizedLandmark[]));
      setStatus(`Ojos detectados en ${Math.round(performance.now() - startedAt)} ms. Ajusta si lo necesitas.`);
    } catch (error) {
      setGeometry(fallbackGeometry());
      setStatus(error instanceof Error ? error.message : "Detección no disponible; usa el ajuste manual.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!consent) {
      setStatus("Confirma primero que autorizas el procesamiento local.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
      setStatus("Usa una foto JPEG, PNG o WebP de máximo 10 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      if (image.naturalWidth < 480 || image.naturalHeight < 480) {
        URL.revokeObjectURL(url);
        setStatus("La foto debe medir al menos 480 × 480 píxeles.");
        return;
      }
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(url);
      setPhoto(image);
      setBefore(false);
      await analyzePhoto(image);
    } catch {
      URL.revokeObjectURL(url);
      setStatus("No fue posible abrir esa imagen.");
    }
  };

  if (!selectedProduct || !selectedTexture) return null;

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-md font-semibold">Simulador por fotografía</h3>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            Usa una foto frontal, sin gafas y con luz uniforme. El resultado es orientativo: el tono real cambia según
            la iluminación, la cámara y tu iris. No sustituye una recomendación profesional.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar simulador" className="rounded-full p-2 hover:bg-surface-sunken">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <label className="mt-4 flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm text-text">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1"
        />
        <span>
          Autorizo el procesamiento temporal de esta foto únicamente en mi navegador. Entiendo que no se envía al
          servidor, no se usa para entrenamiento y se elimina al cerrar o pulsar “Eliminar foto”.
        </span>
      </label>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div>
          {photo ? (
            <canvas ref={canvasRef} className="max-h-[70vh] w-full rounded-xl bg-surface-sunken object-contain" />
          ) : (
            <button
              type="button"
              disabled={!consent}
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ImagePlus className="h-9 w-9 text-brand" aria-hidden="true" />
              <span className="font-semibold">Subir o tomar una foto frontal</span>
              <span className="text-sm text-text-muted">JPEG, PNG o WebP · máximo 10 MB · mínimo 480 × 480 px</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            disabled={!consent}
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <p className="mt-2 min-h-6 text-sm text-text-muted" role="status" aria-live="polite">
            {busy ? "Procesando… " : ""}
            {status}
          </p>
        </div>

        <div className="space-y-4">
          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Tono</legend>
            <div className="grid gap-2">
              {products.map((product) => (
                <label key={product.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-surface-sunken">
                  <input
                    type="radio"
                    name="try-on-tone"
                    value={product.id}
                    checked={selectedProduct.id === product.id}
                    onChange={() => setSelectedProductId(product.id)}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: product.colorFamily?.hexSwatch ?? "#777" }}
                    aria-hidden="true"
                  />
                  <span>{product.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border p-3" disabled={!photo}>
            <legend className="px-1 text-sm font-semibold">Ajuste manual</legend>
            {([
              ["x", "Horizontal", -8, 8, 0.2],
              ["y", "Vertical", -8, 8, 0.2],
              ["scale", "Tamaño", 65, 150, 1],
              ["rotation", "Rotación", -20, 20, 1],
            ] as const).map(([key, label, min, max, step]) => (
              <label key={key} className="mt-2 block text-xs text-text-muted">
                <span className="flex justify-between">
                  {label}
                  <output>{adjustments[key]}</output>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={adjustments[key]}
                  onChange={(event) =>
                    setAdjustments((current) => ({ ...current, [key]: Number(event.target.value) }))
                  }
                  className="w-full accent-brand"
                />
              </label>
            ))}
          </fieldset>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" disabled={!photo} onClick={() => setBefore((value) => !value)}>
              {before ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
              {before ? "Ver después" : "Ver antes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!photo}
              onClick={() => setAdjustments({ x: 0, y: 0, scale: 100, rotation: 0 })}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer
            </Button>
          </div>
          <Button type="button" variant="ghost" fullWidth disabled={!photo} onClick={clearPhoto}>
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar foto
          </Button>
          <AddToCartButton product={selectedProduct} fullWidth label={`Agregar ${selectedProduct.name}`} />
        </div>
      </div>
    </div>
  );
}
