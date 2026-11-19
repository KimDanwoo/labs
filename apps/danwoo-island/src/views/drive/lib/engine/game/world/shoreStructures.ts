import * as THREE from 'three/webgpu';
import { createParts } from './islandGeometry';
import { islandModelMesh } from './islandModels';
import { SHOWER_SCALE, pushOutOfShowerBay } from './showerBay';
import { CUBOID, cuboidFrame, findChild, findChildMatching, requireMesh } from './structureKit';

const SHOWER_STATION = {
  floor: -1.9,
  postSize: new THREE.Vector3(0.3, 2.7, 0.3),
  posts: [
    [-1.45, -0.85],
    [1.45, -0.85],
    [-1.45, 0.85],
    [1.45, 0.85],
  ],
  lantern: { size: [0.2, 0.26, 0.2], position: [-1.64, 1.65, 1.0] },
} as const;

export const SHOWER_PARTS = { waterAnchor: 'showerWaterAnchor', lanternGlow: 'showerLanternGlow' } as const;
const TOILET_PAPER = /^paper/;
const LOOSE_PROP = /^stool/;
const BASE_STONES = /^rocks/;
const scaled = (value: number): number => value * SHOWER_SCALE;
function growWithStation(object: THREE.Object3D, center: THREE.Vector3): void {
  object.position.x = center.x + scaled(object.position.x - center.x);
  object.position.z = center.z + scaled(object.position.z - center.z);
  object.scale.multiplyScalar(SHOWER_SCALE);
}

export function rebuildShowerStation(model: THREE.Object3D): void {
  for (const roll of model.children.filter((child) => TOILET_PAPER.test(child.name))) roll.removeFromParent();
  const container = findChild(model, 'refCabinPhysicalDynamic');
  container.name = 'refCabinPhysicalFixed';
  for (const prop of model.children.filter((child) => LOOSE_PROP.test(child.name))) {
    pushOutOfShowerBay(prop.position, container.position);
  }
  for (const stones of model.children.filter((child) => BASE_STONES.test(child.name))) {
    growWithStation(stones, container.position);
  }
  for (const child of [...container.children]) child.removeFromParent();
  const { floor, postSize, posts, lantern } = SHOWER_STATION;
  const modelMatrix = new THREE.Matrix4()
    .makeTranslation(0, floor, 0)
    .scale(new THREE.Vector3().setScalar(SHOWER_SCALE));
  container.add(islandModelMesh('beachShower', modelMatrix));
  for (const [x, z] of posts) {
    const collider = new THREE.Object3D();
    collider.name = 'cuboid';
    collider.scale.copy(postSize).multiplyScalar(SHOWER_SCALE);
    collider.position.set(scaled(x), floor + scaled(postSize.y) / 2, scaled(z));
    container.add(collider);
  }
  const parts = createParts();
  const [x, y, z] = lantern.position;
  const [width, height, depth] = lantern.size;
  parts.box('lantern', [scaled(width), scaled(height), scaled(depth)], {
    position: [scaled(x), floor + scaled(y), scaled(z)],
  });
  const lanternGlow = parts.build();
  lanternGlow.name = SHOWER_PARTS.lanternGlow;
  const waterAnchor = new THREE.Group();
  waterAnchor.name = SHOWER_PARTS.waterAnchor;
  waterAnchor.position.y = floor;
  waterAnchor.scale.setScalar(SHOWER_SCALE);
  container.add(lanternGlow, waterAnchor);
}
const SURFBOARD_PROPORTION = { width: 0.27, depth: 0.15 } as const;
export function surfboardSize(height: number): THREE.Vector3 {
  return new THREE.Vector3(height * SURFBOARD_PROPORTION.width, height, height * SURFBOARD_PROPORTION.depth);
}
const SURF_FLAG_PROPORTION = { width: 0.375, depth: 0.125 } as const;
function surfFlagSize(height: number): THREE.Vector3 {
  return new THREE.Vector3(height * SURF_FLAG_PROPORTION.width, height, height * SURF_FLAG_PROPORTION.depth);
}

export function rebuildSurfPoint(model: THREE.Object3D): void {
  findChild(model, 'Cube173').removeFromParent();
  findChild(model, 'refSkullEyes5').removeFromParent();
  const container = findChild(model, 'physicalFixed005');
  const parts = createParts();
  const ground = requireMesh(findChildMatching(container, /^trimesh/));
  ground.updateMatrix();
  parts.add('sand', ground.geometry.clone(), { matrix: ground.matrix });
  const pillars = container.children
    .filter((child) => CUBOID.test(child.name))
    .map(cuboidFrame)
    .sort((a, b) => b.size.y - a.size.y);
  const flags = pillars
    .slice(0, 3)
    .map(({ size, matrix }) => islandModelMesh('surfFlag', matrix, surfFlagSize(size.y)));
  const boards = pillars
    .slice(3)
    .map(({ size, matrix }) => islandModelMesh('surfboardStand', matrix, surfboardSize(size.y)));
  container.add(parts.build(), ...flags, ...boards);
}
