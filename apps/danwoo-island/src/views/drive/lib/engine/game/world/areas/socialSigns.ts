import * as THREE from 'three/webgpu';

import type { WorldObject } from '../../objects';
import { removeComponents, type MeshComponent } from '../islandGeometry';
import { islandModelGeometry, islandModelMesh, islandPaletteMaterial } from '../islandModels';
import { canvasMaterial, texturedMesh } from '../islandTextured';

interface SteleFrame {
  size: THREE.Vector3;
  matrix: THREE.Matrix4;
}

const LABELS = new Map<string, string>([
  ['x', 'LAB'],
  ['youtube', 'MUSIC'],
  ['mail', '이력서'],
  ['twitch', '블로그'],
  ['gitHub', 'CODE'],
  ['onlyfans', '바람'],
]);
const STELE = { maxThickness: 0.3, labelHeight: 0.58, labelWidth: 0.6, labelAspect: 0.5 } as const;
const LABEL_COLORS = { ink: '#1f5f6e', glow: '#fbf3e4' } as const;
const PLAZA = {
  name: 'Cube133',
  colliders: 'physicalFixed002',
  plinthHull: 'hull',
  fountain: 'shellFountainPhysicalFixed',
  pedestalMaxHeight: 0.6,
  centerMinWidth: 2.5,
  signReach: 1.2,
} as const;
const COLLIDER = /^(cuboid|tube)/i;
const TUBE = /^tube/i;
const TUBE_INNER = { width: 0.9, depth: 0.4 } as const;
const PHYSICAL_SUFFIX = /PhysicalDynamic.*$/;
const LABEL_CANVAS = { width: 512, height: 256, maxWidth: 460, font: '700 104px MaruBuri' } as const;
const steleFrames = new WeakMap<THREE.Object3D, SteleFrame>();

function labelTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_CANVAS.width;
  canvas.height = LABEL_CANVAS.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.font = LABEL_CANVAS.font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = LABEL_COLORS.glow;
  context.fillText(label, 258, 131, LABEL_CANVAS.maxWidth);
  context.fillStyle = LABEL_COLORS.ink;
  context.fillText(label, 256, 128, LABEL_CANVAS.maxWidth);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function colliderFrame(collider: THREE.Object3D): SteleFrame {
  const matrix = new THREE.Matrix4().compose(collider.position, collider.quaternion, new THREE.Vector3(1, 1, 1));
  if (!TUBE.test(collider.name)) return { size: collider.scale.clone(), matrix };
  const diameter = collider.scale.x;
  return {
    size: new THREE.Vector3(diameter * TUBE_INNER.width, collider.scale.y, diameter * TUBE_INNER.depth),
    matrix,
  };
}

const volume = ({ size }: SteleFrame): number => size.x * size.y * size.z;

export function recordSteleFrames(model: THREE.Object3D): void {
  for (const child of model.children.filter((item) => LABELS.has(item.name.replace(PHYSICAL_SUFFIX, '')))) {
    const frames = child.children.filter((item) => COLLIDER.test(item.name)).map(colliderFrame);
    frames.sort((a, b) => volume(b) - volume(a));
    const [largest] = frames;
    if (largest) steleFrames.set(child, largest);
  }
}

function labelCard(width: number, height: number, z: number, isBack: boolean): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, height);
  if (isBack) geometry.rotateY(Math.PI);
  geometry.translate(0, 0, z);
  return geometry;
}

function buildStele(mesh: THREE.Mesh, label: string, { size, matrix: baseMatrix }: SteleFrame): void {
  const isThinX = size.x < size.z;
  const width = isThinX ? size.z : size.x;
  const height = size.y;
  const thickness = Math.min(isThinX ? size.x : size.z, STELE.maxThickness);
  const matrix = baseMatrix.clone().multiply(new THREE.Matrix4().makeRotationY(isThinX ? Math.PI / 2 : 0));

  mesh.geometry = islandModelGeometry('linkSign', { size: new THREE.Vector3(width, height, thickness), matrix });
  mesh.material = islandPaletteMaterial('linkSign');
  const labelWidth = width * STELE.labelWidth;
  const labelMaterial = canvasMaterial(labelTexture(label));
  for (const isBack of [false, true]) {
    const text = labelCard(
      labelWidth,
      labelWidth * STELE.labelAspect,
      (isBack ? -1 : 1) * (thickness / 2 + 0.006),
      isBack,
    );
    text.translate(0, (STELE.labelHeight - 0.5) * height, 0);
    mesh.add(texturedMesh(text, labelMaterial, { name: 'steleLabel', matrix, castShadow: false }));
  }
}

export function personalizeSocialSigns(items: readonly WorldObject[]): void {
  for (const { visual } of items) {
    const mesh = visual?.object3D;
    if (!(mesh instanceof THREE.Mesh)) continue;
    const label = LABELS.get(mesh.name);
    const frame = steleFrames.get(mesh);
    if (label && frame) buildStele(mesh, label, frame);
  }
}

function pedestalMesh({ box }: MeshComponent, angle: number): THREE.Mesh {
  const center = box.getCenter(new THREE.Vector3());
  const height = box.max.y - box.min.y;
  const span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
  const side = span / (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)));
  const matrix = new THREE.Matrix4()
    .makeTranslation(center.x, center.y, center.z)
    .multiply(new THREE.Matrix4().makeRotationY(angle));
  return islandModelMesh('rockBase', matrix, new THREE.Vector3(side, height, side));
}

function signPositionsIn(model: THREE.Object3D, plaza: THREE.Object3D): THREE.Vector3[] {
  model.updateMatrixWorld(true);
  return model.children
    .filter((child) => LABELS.has(child.name.replace(PHYSICAL_SUFFIX, '')))
    .map((sign) => plaza.worldToLocal(sign.getWorldPosition(new THREE.Vector3())));
}

export function reshapeSocialPlaza(model: THREE.Object3D): void {
  const plaza = model.getObjectByName(PLAZA.name);
  if (!(plaza instanceof THREE.Mesh)) return;
  const signs = signPositionsIn(model, plaza);
  const holdsSign = (center: THREE.Vector3): boolean =>
    signs.some((sign) => Math.hypot(sign.x - center.x, sign.z - center.z) < PLAZA.signReach);
  const pedestals: THREE.Mesh[] = [];
  let plinthFloor: number | undefined;
  removeComponents(plaza, (component) => {
    const { box } = component;
    if (box.max.x - box.min.x > PLAZA.centerMinWidth) {
      plinthFloor = box.min.y;
      return true;
    }
    if (box.max.y > PLAZA.pedestalMaxHeight) return false;
    const center = box.getCenter(new THREE.Vector3());
    if (holdsSign(center)) pedestals.push(pedestalMesh(component, Math.atan2(center.x, center.z)));
    return true;
  });
  plaza.add(...pedestals);
  if (plinthFloor !== undefined) seatFountainOnPlaza(model, plaza.position.y + plinthFloor);
}

function seatFountainOnPlaza(model: THREE.Object3D, floor: number): void {
  model.getObjectByName(PLAZA.colliders)?.getObjectByName(PLAZA.plinthHull)?.removeFromParent();
  const fountain = model.getObjectByName(PLAZA.fountain);
  if (fountain) fountain.position.y = floor;
}
