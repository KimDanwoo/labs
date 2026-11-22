import { Fn, texture, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { revealNode } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { createParts, type Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import { placedInArea } from '@views/drive/lib/engine/game/world/layout/areaPlacement';
import { removeComponents, type MeshComponent } from '@views/drive/lib/engine/game/world/meshComponents';
import { surfboardSize } from '@views/drive/lib/engine/game/world/shoreStructures';
import {
  CUBOID,
  cuboidFrame,
  findChild,
  findChildMatching,
  removeVisualMeshes,
  replaceVisual,
  requireMesh,
  swapForGroup,
  type Frame,
} from '@views/drive/lib/engine/game/world/structureKit';

const NEON_GAIN = 1.6;
const GOAL_SIGN = { scale: 0.65, poleBottom: 5.3 } as const;

function neonMaterial(neonTexture: THREE.Texture): THREE.MeshBasicNodeMaterial {
  neonTexture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const sample = texture(neonTexture, uv());
    return vec4(revealNode(sample.rgb.mul(NEON_GAIN)), 1);
  })();
  material.fog = false;
  material.userData.prevent = true;
  return material;
}

const OLD_SIGN_ART = { meshes: ['Plane042', 'Plane043'], reach: 2.5 } as const;

function removeOldSignArt(model: THREE.Object3D, sign: THREE.Object3D): void {
  model.updateMatrixWorld(true);
  const signPosition = sign.getWorldPosition(new THREE.Vector3());
  for (const name of OLD_SIGN_ART.meshes) {
    const art = requireMesh(findChild(model, name));
    const anchor = art.worldToLocal(signPosition.clone());
    removeComponents(art, ({ box }) => {
      const center = box.getCenter(new THREE.Vector3());
      return Math.hypot(center.x - anchor.x, center.z - anchor.z) < OLD_SIGN_ART.reach;
    });
  }
}

const LANE_MARK = { mesh: 'Plane043', maxSize: 1, maxHeight: 0.05 } as const;

export function removeLaneMarks(model: THREE.Object3D): void {
  removeComponents(requireMesh(findChild(model, LANE_MARK.mesh)), ({ box }) => {
    const size = box.getSize(new THREE.Vector3());
    return Math.max(size.x, size.z) < LANE_MARK.maxSize && size.y < LANE_MARK.maxHeight;
  });
}

export function rebuildBeachGoalSign(model: THREE.Object3D, signTexture: THREE.Texture): void {
  findChild(model, 'sign001').removeFromParent();
  removeOldSignArt(model, findChild(model, 'sign002'));
  const sign = swapForGroup(findChild(model, 'sign002'));
  const parts = createParts();
  parts.box('neonBoard', [4.0, 2.05, 0.12], { position: [0.05, -0.04, -0.08] });
  for (const side of [-1, 1]) parts.box('bamboo', [0.14, 4.4, 0.14], { position: [side * 1.6, -3.1, -0.12] });
  const group = parts.build();
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.86, 1.9), neonMaterial(signTexture));
  neon.name = 'neon';
  neon.position.set(0.05, -0.04, 0.0);
  group.add(neon);
  group.scale.setScalar(GOAL_SIGN.scale);
  group.position.y = -GOAL_SIGN.poleBottom * (1 - GOAL_SIGN.scale);
  sign.add(group);
}

export function rebuildJukebox(model: THREE.Object3D): THREE.Mesh {
  const container = findChild(model, 'refJukeboxPhysicalDynamic');
  container.name = 'refJukeboxPhysicalFixed';
  removeVisualMeshes(container);
  const collider = cuboidFrame(findChildMatching(container, CUBOID));
  const mesh = islandModelMesh('jukebox', collider.matrix, collider.size);
  container.add(mesh);
  return mesh;
}

function timberPile(parts: Parts, { size, matrix }: Frame): void {
  const layers = 4;
  const beam = size.y / layers;
  for (let layer = 0; layer < layers; layer += 1) {
    for (const offset of [-1, 0, 1]) {
      parts.box('timber', [size.x, beam * 0.9, size.z / 3.3], {
        position: [0, -size.y / 2 + beam * (layer + 0.5), offset * (size.z / 3.1) + (layer % 2) * 0.04],
        matrix,
      });
    }
  }
  for (const x of [-size.x * 0.3, size.x * 0.3]) {
    parts.box('thatchRope', [0.06, size.y + 0.02, size.z + 0.04], { position: [x, 0, 0], matrix });
  }
}

const GENERATOR_SURFBOARD_HEIGHT = 2.6;

function rebuildGenerator(generator: THREE.Object3D): void {
  removeVisualMeshes(generator);
  const cuboids = generator.children.filter((child) => CUBOID.test(child.name)).sort((a, b) => b.scale.y - a.scale.y);
  const [poleCuboid] = cuboids;
  const pileCuboid = cuboids.find((cuboid) => cuboid !== poleCuboid && cuboid.scale.x > 1);
  if (!poleCuboid) throw new Error('발전기 충돌체 구성이 예상과 달라요.');
  if (!pileCuboid) throw new Error('발전기 충돌체 구성이 예상과 달라요.');
  for (const extra of cuboids.filter((cuboid) => cuboid !== poleCuboid && cuboid !== pileCuboid))
    extra.removeFromParent();
  const pole = cuboidFrame(poleCuboid);
  const parts = createParts();
  timberPile(parts, cuboidFrame(pileCuboid));
  const bottom = new THREE.Vector3(0, -pole.size.y / 2, 0).applyMatrix4(pole.matrix);
  const boardHeight = Math.min(GENERATOR_SURFBOARD_HEIGHT, pole.size.y);
  const boardMatrix = new THREE.Matrix4().makeTranslation(bottom.x, bottom.y + boardHeight / 2, bottom.z);
  generator.add(parts.build(), islandModelMesh('surfboardStand', boardMatrix, surfboardSize(boardHeight)));
}

const CRATE_STACK = {
  size: new THREE.Vector3(0.85, 0.85, 1.0),
  upright: new THREE.Matrix4().makeRotationX(-Math.PI / 2),
} as const;

function coconutCrateStack(): THREE.Mesh {
  return islandModelMesh('coconutCrate', CRATE_STACK.upright, CRATE_STACK.size);
}

export function rebuildBuildingSite(model: THREE.Object3D): void {
  for (const generator of model.children.filter((child) => /^lightGeneratorPhysicalDynamic/.test(child.name))) {
    rebuildGenerator(generator);
  }
  for (const cone of model.children.filter((child) => /^refObjectsPhysicalDynamic/.test(child.name))) {
    replaceVisual(model, cone.name, coconutCrateStack);
  }
}

const WATERFALL_LIP_GROUND = placedInArea('achievements', new THREE.Vector3(69.665, 0, 7.29));

export function rebuildWaterfallCliff(model: THREE.Object3D): void {
  findChild(model, 'Cube089').removeFromParent();
  model.updateMatrixWorld(true);
  const anchor = model.worldToLocal(WATERFALL_LIP_GROUND.clone());
  const matrix = new THREE.Matrix4().makeTranslation(anchor);
  model.add(islandModelMesh('waterfallCliff', matrix), islandModelMesh('waterfallBasin', matrix));
}

const PILLAR = { base: 0.42, size: new THREE.Vector3(0.9, 3.2, 0.9), carvingDepth: 0.25, crownStart: 1 } as const;

function isFaceCarving({ box }: MeshComponent): boolean {
  const isOnFront = box.min.z > PILLAR.carvingDepth;
  const isBelowCrown = box.max.y < PILLAR.crownStart;
  return isOnFront && isBelowCrown;
}

export function replaceWithPillar(pillar: THREE.Object3D): void {
  if (!(pillar instanceof THREE.Mesh)) return;
  const carved = islandModelMesh('tikiTotem', null, PILLAR.size);
  removeComponents(carved, isFaceCarving);
  carved.geometry.translate(0, PILLAR.base + PILLAR.size.y / 2, 0);
  pillar.geometry = carved.geometry;
  pillar.material = carved.material;
}

const BONFIRE = {
  base: 'base015',
  ashes: 'refBonfireHashes',
  size: new THREE.Vector3(2.2, 0.9, 1.6),
  sink: 0.15,
} as const;

export function replaceBonfireBase(model: THREE.Object3D): void {
  const base = findChild(model, BONFIRE.base);
  const ashes = findChild(model, BONFIRE.ashes);
  base.removeFromParent();
  const marker = new THREE.Object3D();
  marker.name = ashes.name;
  marker.position.copy(ashes.position);
  ashes.parent?.add(marker);
  ashes.removeFromParent();
  ashes.updateMatrix();
  const { x, y, z } = ashes.position;
  const matrix = new THREE.Matrix4().makeTranslation(x, y + BONFIRE.size.y / 2 - BONFIRE.sink, z);
  model.add(islandModelMesh('firePit', matrix, BONFIRE.size));
}
