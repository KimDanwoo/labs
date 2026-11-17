import { alea } from 'seedrandom';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import { FULL_TURN, meshComponents } from './islandGeometry';
import { type IslandModelKey, islandModelGeometry, islandPaletteMaterial } from './islandModels';

const ROCK_MODELS = [
  'tropicalRockSmall',
  'tropicalRockCluster',
  'tropicalRockTall',
  'tropicalRockFlat',
] as const satisfies readonly IslandModelKey[];
const CLUSTER_GAP = 0.35;
const SHELL_SIZE = { min: 0.5, max: 0.8 } as const;
const SHELL_EMBED = 0.06;
const TURN_STEPS = 4;
const QUARTER_TURN = FULL_TURN / TURN_STEPS;
const HULL_PATTERN = /^hull/i;

function clusterBoxes(boxes: readonly THREE.Box3[]): THREE.Box3[] {
  const parent = boxes.map((_, index) => index);
  const find = (index: number): number => (parent[index] === index ? index : find(parent[index] ?? index));
  const padded = boxes.map((box) => box.clone().expandByScalar(CLUSTER_GAP));
  for (const [first, box] of padded.entries()) {
    for (const [second, other] of padded.entries()) {
      if (second > first && box.intersectsBox(other)) parent[find(second)] = find(first);
    }
  }
  const clusters = new Map<number, THREE.Box3>();
  for (const [index, box] of boxes.entries()) {
    const root = find(index);
    clusters.set(root, (clusters.get(root) ?? new THREE.Box3()).union(box));
  }
  return [...clusters.values()];
}

function rockGeometry(box: THREE.Box3, random: () => number): THREE.BufferGeometry {
  const model = ROCK_MODELS[Math.floor(random() * ROCK_MODELS.length)] ?? ROCK_MODELS[0];
  const turns = Math.floor(random() * TURN_STEPS);
  const size = box.getSize(new THREE.Vector3());
  const fitted = turns % 2 === 0 ? size : new THREE.Vector3(size.z, size.y, size.x);
  const matrix = new THREE.Matrix4()
    .makeTranslation(box.getCenter(new THREE.Vector3()))
    .multiply(new THREE.Matrix4().makeRotationY(turns * QUARTER_TURN));
  return islandModelGeometry(model, { size: fitted, matrix });
}

function replaceHulls(basalt: THREE.Mesh, rocks: readonly THREE.BufferGeometry[]): void {
  for (const hull of basalt.children.filter(({ name }) => HULL_PATTERN.test(name))) hull.removeFromParent();
  for (const [index, rock] of rocks.entries()) {
    const hull = new THREE.Mesh(rock);
    hull.name = `hullRock${index}`;
    basalt.add(hull);
  }
}

export function replaceBasalt(basalt: readonly THREE.Mesh[]): void {
  const random = alea('tropicalRocks');
  for (const mesh of basalt) {
    const boxes = meshComponents(mesh.geometry).components.map(({ box }) => box);
    const rocks = clusterBoxes(boxes).map((box) => rockGeometry(box, random));
    const merged = mergeGeometries(rocks);
    if (!merged) throw new Error(`바위 ${mesh.name}의 형상을 합치지 못했어요.`);
    replaceHulls(mesh, rocks);
    mesh.geometry.dispose();
    mesh.geometry = merged;
    mesh.material = islandPaletteMaterial(ROCK_MODELS[0]);
  }
}

function shellGeometry(box: THREE.Box3, random: () => number): THREE.BufferGeometry {
  const { x, z } = box.getSize(new THREE.Vector3());
  const size = THREE.MathUtils.clamp(Math.max(x, z), SHELL_SIZE.min, SHELL_SIZE.max);
  const center = box.getCenter(new THREE.Vector3()).setY(box.max.y - SHELL_EMBED);
  const geometry = islandModelGeometry('beachShells');
  geometry.computeBoundingBox();
  const native = geometry.boundingBox ?? new THREE.Box3();
  const nativeSize = native.getSize(new THREE.Vector3());
  const scale = size / Math.max(nativeSize.x, nativeSize.z);
  geometry.translate(-(native.min.x + native.max.x) / 2, -native.min.y, -(native.min.z + native.max.z) / 2);
  const matrix = new THREE.Matrix4()
    .makeTranslation(center)
    .multiply(new THREE.Matrix4().makeRotationY(random() * FULL_TURN))
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
  return geometry.applyMatrix4(matrix);
}

export function scatterShells(pebbles: THREE.Mesh): void {
  const random = alea('beachShells');
  pebbles.updateMatrix();
  const placed = pebbles.geometry.clone().applyMatrix4(pebbles.matrix);
  const shells = mergeGeometries(meshComponents(placed).components.map(({ box }) => shellGeometry(box, random)));
  if (!shells) throw new Error('조개 형상을 합치지 못했어요.');
  pebbles.geometry.dispose();
  pebbles.geometry = shells;
  pebbles.material = islandPaletteMaterial('beachShells');
  pebbles.position.set(0, 0, 0);
  pebbles.quaternion.identity();
  pebbles.scale.setScalar(1);
}
