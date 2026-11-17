import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { type IslandModelKey, islandModelMesh } from './islandModels';
import { IslandTrees, JUNGLE_SPECIES, mixGroves, PALM } from './islandTrees';
import { ISLAND_SCATTER, type ScatterPlacement } from './layout/islandScatter';

const SHORE_ROCKS: readonly IslandModelKey[] = ['tropicalRockSmall', 'tropicalRockCluster', 'tropicalRockFlat'];
const ROCK_SINK = 0.2;

const SCATTERED_MODELS = {
  bushesReferences: ISLAND_SCATTER.bushes,
  flowersReferencesModel: ISLAND_SCATTER.flowers,
  poleLightsModel: ISLAND_SCATTER.lights,
  lanternsModel: ISLAND_SCATTER.lanterns,
  explosiveCratesModel: ISLAND_SCATTER.crates,
} as const satisfies Record<string, readonly ScatterPlacement[]>;

function placedObject(template: THREE.Object3D, [x, z, rotation, scale]: ScatterPlacement): THREE.Object3D {
  const object = template.clone();
  object.position.set(x, template.position.y, z);
  object.rotation.set(0, rotation, 0);
  object.scale.copy(template.scale).multiplyScalar(scale);
  object.updateMatrixWorld(true);
  return object;
}

function references(placements: readonly ScatterPlacement[]): THREE.Object3D[] {
  return placements.map((placement) => placedObject(new THREE.Object3D(), placement));
}

export function replantScatteredModels(): void {
  const game = getGame();
  for (const [name, placements] of Object.entries(SCATTERED_MODELS)) {
    const { scene } = game.model(name);
    const template = scene.children[0];
    if (!template) throw new Error(`${name}에 복제할 원본이 없어요.`);
    for (const child of [...scene.children]) child.removeFromParent();
    scene.add(...placements.map((placement) => placedObject(template, placement)));
  }
}

export function plantScatteredTrees(): IslandTrees {
  return new IslandTrees([
    { species: PALM, references: references(ISLAND_SCATTER.palms) },
    ...mixGroves(JUNGLE_SPECIES, references(ISLAND_SCATTER.jungle)),
  ]);
}

export function placeShoreRocks(): void {
  const { objects } = getGame();
  ISLAND_SCATTER.rocks.forEach(([x, z, rotation, scale], index) => {
    const model = SHORE_ROCKS[index % SHORE_ROCKS.length] ?? 'tropicalRockSmall';
    const matrix = new THREE.Matrix4()
      .makeTranslation(x, -ROCK_SINK, z)
      .multiply(new THREE.Matrix4().makeRotationY(rotation))
      .scale(new THREE.Vector3().setScalar(scale));
    const mesh = islandModelMesh(model, matrix);
    const points = mesh.geometry.attributes.position?.array;
    if (!(points instanceof Float32Array)) return;
    objects.add({ model: mesh }, { type: 'fixed', colliders: [{ shape: 'hull', parameters: [points] }] });
  });
}
