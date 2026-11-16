import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { isModel, modelResource, type ResourceSpec } from '../resourcesLoader';

const ISLAND_MODELS = {
  gamepad: 'areas/island/models/gamepad.glb',
  shellFountain: 'areas/island/models/shellFountain.glb',
  beachShower: 'areas/island/models/beachShower.glb',
  lighthouse: 'areas/island/models/lighthouse.glb',
  palmHammock: 'areas/island/models/palmHammock.glb',
  surfCorner: 'areas/island/models/surfCorner.glb',
  coconutCrate: 'areas/island/models/coconutCrate.glb',
  beachBench: 'areas/island/models/beachBench.glb',
  lampPost: 'areas/island/models/lampPost.glb',
  gardenLamp: 'areas/island/models/gardenLamp.glb',
  ropeFence: 'areas/island/models/ropeFence.glb',
  surfboardStand: 'areas/island/models/surfboardStand.glb',
  linkSign: 'areas/island/models/linkSign.glb',
  rockBase: 'areas/island/models/rockBase.glb',
  guideBoard: 'areas/island/models/guideBoard.glb',
  snackShack: 'areas/island/models/snackShack.glb',
  coconut: 'areas/island/models/coconut.glb',
  surfFlag: 'areas/island/models/surfFlag.glb',
  palmTree: 'areas/island/models/palmTree.glb',
  bananaTree: 'areas/island/models/bananaTree.glb',
  monsteraClump: 'areas/island/models/monsteraClump.glb',
  plumeriaTree: 'areas/island/models/plumeriaTree.glb',
  tropicalRockSmall: 'areas/island/models/tropicalRockSmall.glb',
  tropicalRockCluster: 'areas/island/models/tropicalRockCluster.glb',
  tropicalRockTall: 'areas/island/models/tropicalRockTall.glb',
  tropicalRockFlat: 'areas/island/models/tropicalRockFlat.glb',
  beachShells: 'areas/island/models/beachShells.glb',
  circuitBoard: 'areas/island/models/circuitBoard.glb',
  resetSign: 'areas/island/models/resetSign.glb',
  driftKeyboard: 'areas/island/models/driftKeyboard.glb',
  tikiScoreboard: 'areas/island/models/tikiScoreboard.glb',
  surfMenuSign: 'areas/island/models/surfMenuSign.glb',
  portalArch: 'areas/island/models/portalArch.glb',
  steppingStoneA: 'areas/island/models/steppingStoneA.glb',
  steppingStoneB: 'areas/island/models/steppingStoneB.glb',
  steppingStoneC: 'areas/island/models/steppingStoneC.glb',
  steppingStoneD: 'areas/island/models/steppingStoneD.glb',
  jukebox: 'areas/island/models/jukebox.glb',
  beachCanopy: 'areas/island/models/beachCanopy.glb',
  startLightFrame: 'areas/island/models/startLightFrame.glb',
  palmRoof: 'areas/island/models/palmRoof.glb',
  firePit: 'areas/island/models/firePit.glb',
  bambooBucket: 'areas/island/models/bambooBucket.glb',
  clayPot: 'areas/island/models/clayPot.glb',
  ukuleleTable: 'areas/island/models/ukuleleTable.glb',
  waterfallCliff: 'areas/island/models/waterfallCliff.glb',
  tikiTotem: 'areas/island/models/tikiTotem.glb',
  waterfallBasin: 'areas/island/models/waterfallBasin.glb',
} as const;

export type IslandModelKey = keyof typeof ISLAND_MODELS;

export interface ModelGeometryOptions {
  size?: THREE.Vector3 | null;
  matrix?: THREE.Matrix4 | null;
}

const resourceName = (key: string): string => `islandModel${key.charAt(0).toUpperCase()}${key.slice(1)}`;

export function islandModelResources(cacheBuster: string): ResourceSpec[] {
  return Object.entries(ISLAND_MODELS).map(([key, path]) => modelResource(resourceName(key), `${path}${cacheBuster}`));
}

function sourceMesh(key: IslandModelKey): THREE.Mesh {
  const resource = getGame().resources[resourceName(key)];
  const source = resource && isModel(resource) ? resource.scene.getObjectByProperty('isMesh', true) : undefined;
  if (!(source instanceof THREE.Mesh)) throw new Error(`섬 모델 ${key}을 불러오지 못했어요.`);
  source.updateWorldMatrix(true, false);
  return source;
}

function fitToSize(geometry: THREE.BufferGeometry, size: THREE.Vector3): void {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const native = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(size.x / native.x, size.y / native.y, size.z / native.z);
}

export function islandModelGeometry(
  key: IslandModelKey,
  { size = null, matrix = null }: ModelGeometryOptions = {},
): THREE.BufferGeometry {
  const source = sourceMesh(key);
  const geometry = source.geometry.clone().applyMatrix4(source.matrixWorld);
  if (size) fitToSize(geometry, size);
  if (matrix) geometry.applyMatrix4(matrix);
  return geometry;
}

export function islandModelMesh(
  key: IslandModelKey,
  matrix: THREE.Matrix4 | null,
  size: THREE.Vector3 | null = null,
): THREE.Mesh {
  const mesh = new THREE.Mesh(islandModelGeometry(key, { size, matrix }), sourceMesh(key).material);
  mesh.name = key;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function islandPaletteMaterial(key: IslandModelKey): THREE.Material {
  const { material } = sourceMesh(key);
  if (!(material instanceof THREE.Material)) throw new Error(`섬 모델 ${key}의 재질이 하나가 아니에요.`);
  return getGame().materials.resolve(material);
}
