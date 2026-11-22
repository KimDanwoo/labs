import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';
import { fillSlot } from '@views/drive/lib/engine/game/world/islandMaterials';
import { islandPaletteMaterial } from '@views/drive/lib/engine/game/world/islandModels';
import { canvasMaterial, texturedMesh } from '@views/drive/lib/engine/game/world/islandTextured';
import { meshComponents } from '@views/drive/lib/engine/game/world/meshComponents';

interface SignStyle {
  label: string;
  slot: number;
}

const SLOT = { bamboo: 1, wood: 14 } as const;
const SIGNS = new Map<string, SignStyle>([
  ['gitHub', { label: 'CODE', slot: 5 }],
  ['twitch', { label: '블로그', slot: 10 }],
  ['youtube', { label: 'MUSIC', slot: 18 }],
  ['mail', { label: '이력서', slot: 9 }],
  ['x', { label: 'LAB', slot: 3 }],
  ['onlyfans', { label: '바람', slot: 8 }],
]);
const ARC_ORDER = ['gitHub', 'twitch', 'youtube', 'mail', 'x'] as const;
const ARC = {
  radius: 6.6,
  spread: Math.PI / 3,
  approach: new THREE.Vector3(0.16, 0, -0.99).normalize(),
  toCamera: new THREE.Vector3(1, 0, 1).normalize(),
  outwardLean: 0.35,
  ground: 0.02,
} as const;
const BOARD = {
  width: 1.5,
  height: 0.62,
  depth: 0.08,
  center: 1.55,
  frame: 0.05,
  postSpan: 0.6,
  postRadius: 0.05,
  postHeight: 2,
  barY: 1.94,
} as const;
const LABEL = { width: 1.3, aspect: 0.5, gap: 0.006 } as const;
const LABEL_COLORS = { ink: '#fff8ea', shade: '#2a2a33' } as const;
const LABEL_CANVAS = { width: 512, height: 256, maxWidth: 460, font: '700 112px MaruBuri', shadow: 4 } as const;
const PLAZA = {
  name: 'Cube133',
  colliders: 'physicalFixed002',
  fountain: 'shellFountainPhysicalFixed',
  centerMinWidth: 2.5,
} as const;
const COLLIDER = /^(cuboid|tube|ball|hull|trimesh)/i;
const PHYSICAL_SUFFIX = /PhysicalDynamic.*$/;

const signName = (object: THREE.Object3D): string => object.name.replace(PHYSICAL_SUFFIX, '');

function labelTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_CANVAS.width;
  canvas.height = LABEL_CANVAS.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  const x = LABEL_CANVAS.width / 2;
  const y = LABEL_CANVAS.height / 2;
  context.font = LABEL_CANVAS.font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = LABEL_COLORS.shade;
  context.fillText(label, x, y + LABEL_CANVAS.shadow, LABEL_CANVAS.maxWidth);
  context.fillStyle = LABEL_COLORS.ink;
  context.fillText(label, x, y, LABEL_CANVAS.maxWidth);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function signboardGeometry(slot: number): THREE.BufferGeometry {
  const { width, height, depth, center, frame, postSpan, postRadius, postHeight, barY } = BOARD;
  const pieces = [
    fillSlot(
      new THREE.BoxGeometry(width + frame * 2, height + frame * 2, depth * 0.7).translate(0, center, 0),
      SLOT.wood,
    ),
    fillSlot(new THREE.BoxGeometry(width, height, depth).translate(0, center, 0), slot),
    fillSlot(new THREE.CylinderGeometry(postRadius * 0.8, postRadius * 0.8, width + frame * 4, 6), SLOT.bamboo)
      .rotateZ(Math.PI / 2)
      .translate(0, barY, 0),
    ...[-postSpan, postSpan].map((x) =>
      fillSlot(new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 6), SLOT.bamboo).translate(
        x,
        postHeight / 2,
        -depth,
      ),
    ),
  ];
  const geometry = mergeGeometries(pieces);
  for (const piece of pieces) piece.dispose();
  if (!geometry) throw new Error('소셜 안내판 형상을 합치지 못했어요.');
  return geometry;
}

function signCollider(): THREE.Object3D {
  const collider = new THREE.Object3D();
  collider.name = 'cuboidSignboard';
  collider.position.set(0, BOARD.postHeight / 2, 0);
  collider.scale.set(BOARD.width + BOARD.frame * 2, BOARD.postHeight, BOARD.depth * 3);
  return collider;
}

function arcPlacement(index: number, fountain: THREE.Vector3): { position: THREE.Vector3; yaw: number } {
  const step = ARC_ORDER.length > 1 ? (ARC.spread * 2) / (ARC_ORDER.length - 1) : 0;
  const angle = -ARC.spread + index * step;
  const outward = ARC.approach.clone().applyAxisAngle(new THREE.Object3D().up, angle);
  const position = fountain.clone().addScaledVector(outward, ARC.radius);
  const facing = ARC.toCamera.clone().lerp(outward, ARC.outwardLean);
  return { position, yaw: Math.atan2(facing.x, facing.z) };
}

function standSign(sign: THREE.Object3D, world: THREE.Vector3, yaw: number): void {
  const parent = sign.parent;
  if (!parent) return;
  world.y = ARC.ground;
  sign.position.copy(parent.worldToLocal(world));
  sign.rotation.set(0, yaw, 0);
  sign.scale.setScalar(1);
  for (const collider of sign.children.filter((child) => COLLIDER.test(child.name))) collider.removeFromParent();
  sign.add(signCollider());
}

export function arrangeSocialSigns(model: THREE.Object3D): void {
  model.updateMatrixWorld(true);
  const fountain = model.getObjectByName(PLAZA.fountain)?.getWorldPosition(new THREE.Vector3());
  if (!fountain) return;
  for (const sign of model.children.filter((child) => SIGNS.has(signName(child)))) {
    const index = ARC_ORDER.findIndex((name) => name === signName(sign));
    const placement =
      index < 0
        ? { position: sign.getWorldPosition(new THREE.Vector3()), yaw: Math.atan2(ARC.toCamera.x, ARC.toCamera.z) }
        : arcPlacement(index, fountain);
    standSign(sign, placement.position, placement.yaw);
  }
}

const LABEL_FACES = [1, -1] as const;

function labelCard(face: (typeof LABEL_FACES)[number]): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(LABEL.width, LABEL.width * LABEL.aspect)
    .rotateY(((1 - face) / 2) * Math.PI)
    .translate(0, BOARD.center, face * (BOARD.depth / 2 + LABEL.gap));
}

function dressSign(mesh: THREE.Mesh, { label, slot }: SignStyle): void {
  mesh.geometry = signboardGeometry(slot);
  mesh.material = islandPaletteMaterial('gardenLamp');
  const labelMaterial = canvasMaterial(labelTexture(label));
  for (const face of LABEL_FACES) {
    mesh.add(texturedMesh(labelCard(face), labelMaterial, { name: 'steleLabel', castShadow: false }));
  }
}

export function personalizeSocialSigns(items: readonly WorldObject[]): void {
  for (const { visual } of items) {
    const mesh = visual?.object3D;
    if (!(mesh instanceof THREE.Mesh)) continue;
    const style = SIGNS.get(mesh.name);
    if (style) dressSign(mesh, style);
  }
}

export function reshapeSocialPlaza(model: THREE.Object3D): void {
  const plaza = model.getObjectByName(PLAZA.name);
  if (!(plaza instanceof THREE.Mesh)) return;
  const plinth = meshComponents(plaza.geometry).components.find(
    ({ box }) => box.max.x - box.min.x > PLAZA.centerMinWidth,
  );
  plaza.removeFromParent();
  model.getObjectByName(PLAZA.colliders)?.removeFromParent();
  const fountain = model.getObjectByName(PLAZA.fountain);
  if (!plinth) return;
  if (!fountain) return;
  fountain.position.y = plaza.position.y + plinth.box.min.y;
}
