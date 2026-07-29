export type NormalizedPoint = { x: number; y: number; z?: number };

export type EyeGeometry = {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  eyelid: NormalizedPoint[];
};

export type FaceGeometry = {
  left: EyeGeometry;
  right: EyeGeometry;
};

const RIGHT_IRIS = [468, 469, 470, 471, 472];
const LEFT_IRIS = [473, 474, 475, 476, 477];
const RIGHT_EYELID = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const LEFT_EYELID = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];

function mean(points: NormalizedPoint[]) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function eyeGeometry(landmarks: NormalizedPoint[], irisIndexes: number[], eyelidIndexes: number[]): EyeGeometry {
  const iris = irisIndexes.map((index) => landmarks[index]).filter(Boolean);
  const eyelid = eyelidIndexes.map((index) => landmarks[index]).filter(Boolean);
  if (iris.length !== irisIndexes.length || eyelid.length < 8) {
    throw new Error("La detección no entregó puntos suficientes de los ojos.");
  }
  const center = mean(iris);
  const radiusX = Math.max(...iris.map((point) => Math.abs(point.x - center.x)));
  const radiusY = Math.max(...iris.map((point) => Math.abs(point.y - center.y)));
  return {
    centerX: center.x,
    centerY: center.y,
    radiusX,
    radiusY,
    rotation: 0,
    eyelid,
  };
}

export function geometryFromFaceLandmarks(landmarks: NormalizedPoint[]): FaceGeometry {
  if (landmarks.length < 478) throw new Error("No se detectaron los puntos completos del iris.");
  const right = eyeGeometry(landmarks, RIGHT_IRIS, RIGHT_EYELID);
  const left = eyeGeometry(landmarks, LEFT_IRIS, LEFT_EYELID);
  const rotation = Math.atan2(left.centerY - right.centerY, left.centerX - right.centerX);
  return {
    left: { ...left, rotation },
    right: { ...right, rotation },
  };
}

export function fallbackGeometry(): FaceGeometry {
  const makeEye = (centerX: number): EyeGeometry => ({
    centerX,
    centerY: 0.42,
    radiusX: 0.038,
    radiusY: 0.038,
    rotation: 0,
    eyelid: [],
  });
  return { right: makeEye(0.38), left: makeEye(0.62) };
}
