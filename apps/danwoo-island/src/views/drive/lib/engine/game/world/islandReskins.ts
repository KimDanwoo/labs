import * as THREE from 'three/webgpu';

import {
  islandMaterial,
  paletteSlot,
  type PartName,
  repaintSlots,
  type SlotRepaint,
  type Triple,
} from './islandGeometry';
import { fixedLandmark, LIGHTHOUSE } from './islandLandmarks';
import { islandModelMesh } from './islandModels';

const CAREER_PAINT = new Map<string, PartName>([
  ['emissiveWhiteRadialGradient', 'bunting4'],
  ['emissiveOrangeRadialGradient', 'bunting3'],
  ['emissivePurpleRadialGradient', 'bunting5'],
  ['emissiveBlueRadialGradient', 'bunting1'],
]);

const AWARDS_TABLE = ['table002', 'cube024', 'refel003', 'medal', 'refDistinctions'];
const STEPPING_STONES = ['slabes', 'Cube001', 'Cube002'];
const AIR_DANCER = /^refAirDancers/;
const CURB_REPAINT: SlotRepaint = new Map([
  [16, 10],
  [17, 23],
]);
const FLAT_PAINT_HEIGHT = 0.01;

const SCOREBOARD = {
  frame: 'Cube180',
  body: 'Cube177',
  origin: [-1.88, 0, 0.51] satisfies Triple,
} as const;

function paint(mesh: THREE.Object3D | undefined, shade: PartName): void {
  if (mesh instanceof THREE.Mesh) mesh.material = islandMaterial(shade);
}

function materialName(mesh: THREE.Mesh): string | undefined {
  return Array.isArray(mesh.material) ? undefined : mesh.material.name;
}

export function paintCareerLines(model: THREE.Object3D): void {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const name = materialName(child);
    const shade = name === undefined ? undefined : CAREER_PAINT.get(name);
    if (shade) paint(child, shade);
  });
}

export function paintAchievementsBasin(model: THREE.Object3D): void {
  paint(model.getObjectByName('Cube110'), 'stone');
}

export function steppingStoneSlabs(scenery: THREE.Object3D): THREE.Mesh[] {
  return STEPPING_STONES.map((name) => scenery.getObjectByName(name)).filter(
    (slab): slab is THREE.Mesh => slab instanceof THREE.Mesh,
  );
}

function isCurbPaint(mesh: THREE.Mesh): boolean {
  const uv = mesh.geometry.getAttribute('uv');
  if (!uv) return false;
  mesh.geometry.computeBoundingBox();
  const height = mesh.geometry.boundingBox?.getSize(new THREE.Vector3()).y ?? Infinity;
  const slots = new Set(Array.from({ length: uv.count }, (_, vertex) => paletteSlot(uv.getX(vertex))));
  return height < FLAT_PAINT_HEIGHT && [...slots].every((slot) => CURB_REPAINT.has(slot));
}

export function paintCurbs(scenery: THREE.Object3D): void {
  for (const child of scenery.children) {
    if (child instanceof THREE.Mesh && isCurbPaint(child)) repaintSlots(child.geometry, CURB_REPAINT);
  }
}

export function rebuildTikiScoreboard(model: THREE.Object3D): void {
  const frame = model.getObjectByName(SCOREBOARD.frame);
  const body = model.getObjectByName(SCOREBOARD.body);
  if (!(frame instanceof THREE.Mesh) || !(body instanceof THREE.Mesh) || !body.parent) return;
  for (const mesh of [frame, body]) mesh.geometry.setDrawRange(0, 0);
  body.parent.add(islandModelMesh('tikiScoreboard', new THREE.Matrix4().makeTranslation(...SCOREBOARD.origin)));
}

export function removeAwardsTable(model: THREE.Object3D): void {
  for (const name of AWARDS_TABLE) model.getObjectByName(name)?.removeFromParent();
}

export function replaceAirDancers(model: THREE.Object3D): void {
  for (const dancer of model.children.filter((child) => AIR_DANCER.test(child.name))) {
    model.add(fixedLandmark(LIGHTHOUSE, dancer.position, dancer.quaternion));
    dancer.removeFromParent();
  }
}
