import * as THREE from 'three/webgpu';

import { type Triple } from '@views/drive/lib/engine/game/world/islandGeometry';
import { fixedLandmark, LIGHTHOUSE } from '@views/drive/lib/engine/game/world/islandLandmarks';
import { type PartName, islandMaterial } from '@views/drive/lib/engine/game/world/islandMaterials';
import { islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import { type MeshComponent, removeComponents } from '@views/drive/lib/engine/game/world/meshComponents';

const CAREER_PAINT = new Map<string, PartName>([
  ['emissiveOrangeRadialGradient', 'bunting3'],
  ['emissivePurpleRadialGradient', 'bunting5'],
  ['emissiveBlueRadialGradient', 'bunting1'],
]);

const AWARDS_TABLE = ['table002', 'cube024', 'refel003', 'medal', 'refDistinctions'];
const AIR_DANCER = /^refAirDancers/;

const SCOREBOARD = {
  frame: 'Cube180',
  body: 'Cube177',
  origin: [-1.88, 0, 0.51] satisfies Triple,
  crest: { halfWidth: 1, bottom: 4.34 },
  postFace: { inner: 2.7, bottom: 3.3, top: 3.95, front: 0.2 },
} as const;

function isCarvedFace({ box }: MeshComponent): boolean {
  const { crest, postFace } = SCOREBOARD;
  const center = box.getCenter(new THREE.Vector3());
  const isCrest = Math.abs(center.x) < crest.halfWidth && box.min.y >= crest.bottom;
  const isOnPost = Math.abs(center.x) > postFace.inner && box.max.z > postFace.front;
  const isFaceHeight = center.y > postFace.bottom && center.y < postFace.top;
  const isPostFace = isOnPost && isFaceHeight;
  return isCrest || isPostFace;
}

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

export function rebuildTikiScoreboard(model: THREE.Object3D): void {
  const frame = model.getObjectByName(SCOREBOARD.frame);
  const body = model.getObjectByName(SCOREBOARD.body);
  if (!(frame instanceof THREE.Mesh)) return;
  if (!(body instanceof THREE.Mesh)) return;
  if (!body.parent) return;
  for (const mesh of [frame, body]) mesh.geometry.setDrawRange(0, 0);
  const board = islandModelMesh('tikiScoreboard', null);
  removeComponents(board, isCarvedFace);
  board.geometry.translate(...SCOREBOARD.origin);
  body.parent.add(board);
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
