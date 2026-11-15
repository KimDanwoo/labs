import * as THREE from 'three/webgpu';

import { createParts, islandMaterial, type PartName, type Parts, removeComponents } from './islandGeometry';
import { fixedLandmark, LIGHTHOUSE } from './islandLandmarks';

const CAREER_PAINT = new Map<string, PartName>([
  ['emissiveWhiteRadialGradient', 'bunting4'],
  ['emissiveOrangeRadialGradient', 'bunting3'],
  ['emissivePurpleRadialGradient', 'bunting5'],
  ['emissiveBlueRadialGradient', 'bunting1'],
]);

const AWARDS_TABLE = ['table002', 'cube024', 'refel003', 'medal', 'refDistinctions'];
const STEPPING_STONES = ['slabes', 'Cube001', 'Cube002'];
const AIR_DANCER = /^refAirDancers/;

const SCREEN_STAND = {
  boardBottom: 1.42,
  legX: [0.48, 3.85],
  z: -0.42,
  spread: 0.36,
  wheelRadius: 0.17,
  jetTop: 1,
  podTop: 1.35,
  railY: 0.95,
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

export function paintSteppingStones(scenery: THREE.Object3D): void {
  for (const name of STEPPING_STONES) paint(scenery.getObjectByName(name), 'fieldstone');
}

function trestle(parts: Parts, x: number, ground: number): void {
  const { boardBottom, z, spread, wheelRadius } = SCREEN_STAND;
  const axle = ground + wheelRadius;
  const wheelRotation = [Math.PI / 2, 0, 0] as const;
  for (const side of [-1, 1]) {
    const wheelZ = z + side * spread;
    parts.rod('wood', 0.06, [x, boardBottom, z], [x, axle + 0.12, wheelZ]);
    parts.prism(
      'woodDark',
      wheelRadius,
      wheelRadius,
      0.08,
      { position: [x, axle, wheelZ], rotation: wheelRotation },
      10,
    );
    parts.prism('iron', 0.05, 0.05, 0.1, { position: [x, axle, wheelZ], rotation: wheelRotation }, 6);
  }
  parts.box('woodDark', [0.12, 0.1, spread * 2 + 0.1], { position: [x, axle + 0.14, z] });
}

export function rebuildBowlingScreenStand(model: THREE.Object3D): void {
  const frame = model.getObjectByName('Cube180');
  const body = model.getObjectByName('Cube177');
  if (!(frame instanceof THREE.Mesh) || !(body instanceof THREE.Mesh)) return;
  removeComponents(frame, (component) => component.box.max.y < SCREEN_STAND.jetTop);
  removeComponents(body, (component) => component.box.max.y < SCREEN_STAND.podTop);
  const ground = -body.position.y;
  const parts = createParts();
  const [left, right] = SCREEN_STAND.legX;
  for (const x of SCREEN_STAND.legX) trestle(parts, x, ground);
  parts.rod('woodDark', 0.05, [left, SCREEN_STAND.railY, SCREEN_STAND.z], [right, SCREEN_STAND.railY, SCREEN_STAND.z]);
  body.add(parts.build());
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
