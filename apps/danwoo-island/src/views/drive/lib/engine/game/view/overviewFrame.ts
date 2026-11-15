import * as THREE from 'three/webgpu';

export interface ScreenInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OverviewFrameInput {
  points: readonly THREE.Vector3[];
  phi: number;
  theta: number;
  fov: number;
  width: number;
  height: number;
  insets: ScreenInsets;
}

export interface OverviewFrame {
  center: THREE.Vector3;
  radius: number;
}

interface NdcWindow {
  low: number;
  high: number;
}

interface CameraPoint {
  x: number;
  y: number;
  depth: number;
}

interface CameraBasis {
  forward: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const FULL_WINDOW: NdcWindow = { low: -1, high: 1 };
const MIN_RADIUS = 50;
const MAX_CENTERING_STEPS = 40;
const SETTLED_SHIFT = 0.01;

function ndcWindow(size: number, startInset: number, endInset: number): NdcWindow {
  const low = -1 + (2 * startInset) / size;
  const high = 1 - (2 * endInset) / size;
  return low < 0 && high > 0 ? { low, high } : FULL_WINDOW;
}

function cameraBasis(phi: number, theta: number): CameraBasis {
  const forward = new THREE.Vector3().setFromSphericalCoords(1, phi, theta).negate();
  const right = new THREE.Vector3().crossVectors(forward, WORLD_UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward);
  return { forward, right, up };
}

function toCamera(points: readonly THREE.Vector3[], center: THREE.Vector3, basis: CameraBasis): CameraPoint[] {
  return points.map((point) => {
    const offset = point.clone().sub(center);
    return { x: offset.dot(basis.right), y: offset.dot(basis.up), depth: offset.dot(basis.forward) };
  });
}

function middle(values: readonly number[]): number {
  return (Math.min(...values) + Math.max(...values)) / 2;
}

function radiusToFit(value: number, depth: number, window: NdcWindow, tan: number): number {
  const bound = value >= 0 ? window.high : window.low;
  return value / (bound * tan) - depth;
}

function fittingRadius(
  local: readonly CameraPoint[],
  windows: { x: NdcWindow; y: NdcWindow },
  tanX: number,
  tanY: number,
): number {
  const radii = local.flatMap(({ x, y, depth }) => [
    radiusToFit(x, depth, windows.x, tanX),
    radiusToFit(y, depth, windows.y, tanY),
  ]);
  return Math.max(MIN_RADIUS, ...radii);
}

function windowMiddle({ low, high }: NdcWindow): number {
  return (low + high) / 2;
}

export function frameOverview({ points, phi, theta, fov, width, height, insets }: OverviewFrameInput): OverviewFrame {
  const basis = cameraBasis(phi, theta);
  const ground = basis.up.clone().setY(0).normalize();
  const groundLift = ground.dot(basis.up);
  const tanY = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const tanX = tanY * (width / height);
  const windows = { x: ndcWindow(width, insets.left, insets.right), y: ndcWindow(height, insets.bottom, insets.top) };

  const center = new THREE.Box3()
    .setFromPoints([...points])
    .getCenter(new THREE.Vector3())
    .setY(0);
  for (let step = 0; step < MAX_CENTERING_STEPS; step += 1) {
    const local = toCamera(points, center, basis);
    const radius = fittingRadius(local, windows, tanX, tanY);
    const ndcX = middle(local.map(({ x, depth }) => x / ((radius + depth) * tanX)));
    const ndcY = middle(local.map(({ y, depth }) => y / ((radius + depth) * tanY)));
    const shift = new THREE.Vector3()
      .addScaledVector(basis.right, (ndcX - windowMiddle(windows.x)) * radius * tanX)
      .addScaledVector(ground, ((ndcY - windowMiddle(windows.y)) * radius * tanY) / groundLift);
    center.add(shift);
    if (shift.length() < SETTLED_SHIFT) break;
  }
  return { center, radius: fittingRadius(toCamera(points, center, basis), windows, tanX, tanY) };
}
