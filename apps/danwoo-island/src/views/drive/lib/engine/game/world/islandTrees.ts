import { alea } from 'seedrandom';
import {
  attribute,
  color,
  Fn,
  mix,
  positionLocal,
  screenSize,
  screenUV,
  select,
  sin,
  step,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { TICK_ORDER } from '../tickOrder';
import { PALETTE_SLOTS } from './islandMaterials';
import { type IslandModelKey, islandModelGeometry } from './islandModels';

interface TreeSpecies {
  readonly model: IslandModelKey;
  readonly trunkRadius: number;
  readonly baseOffsetX: number;
  readonly swayStart: number;
  readonly crownStart: number;
  readonly scaleRange: readonly [number, number];
}

interface TreeGrove {
  readonly species: TreeSpecies;
  readonly references: readonly THREE.Object3D[];
}

const TRUNK_HALF_HEIGHT = 2.5;
const SWAY = { wind: 0.35, flutter: 0.06, flutterSpeed: 1.7, curve: 1.5 } as const;
const SEE_THROUGH_RADIUS = 3;
const SWAY_MARGIN = 0.5;
const LEAF_SLOTS = { deep: 9, light: 12 } as const;
const LEAF_COLORS = { deep: '#4f9a45', light: '#8fcc56' } as const;

export const PALM: TreeSpecies = {
  model: 'palmTree',
  trunkRadius: 0.26,
  baseOffsetX: 0.9,
  swayStart: 1.5,
  crownStart: 4.3,
  scaleRange: [1.1, 1.35],
};

export const JUNGLE_SPECIES: readonly TreeSpecies[] = [
  { model: 'bananaTree', trunkRadius: 0.3, baseOffsetX: 0, swayStart: 1.2, crownStart: 3.2, scaleRange: [1.05, 1.3] },
  { model: 'monsteraClump', trunkRadius: 0.5, baseOffsetX: 0, swayStart: 0.4, crownStart: 0.9, scaleRange: [1, 1.25] },
  { model: 'plumeriaTree', trunkRadius: 0.3, baseOffsetX: 0, swayStart: 2, crownStart: 2.7, scaleRange: [1.1, 1.35] },
];

export function mixGroves(species: readonly TreeSpecies[], references: readonly THREE.Object3D[]): TreeGrove[] {
  const random = alea('islandTrees');
  const picks = references.map(() => Math.floor(random() * species.length));
  return species.map((kind, index) => ({
    species: kind,
    references: references.filter((_, reference) => picks[reference] === index),
  }));
}

function speciesGeometry({ model, baseOffsetX, swayStart, crownStart }: TreeSpecies): THREE.BufferGeometry {
  const geometry = islandModelGeometry(model);
  geometry.computeBoundingBox();
  const bottom = geometry.boundingBox?.min.y ?? 0;
  geometry.translate(baseOffsetX, -bottom, 0);
  geometry.computeBoundingBox();

  const positions = geometry.getAttribute('position');
  const top = geometry.boundingBox?.max.y ?? 1;
  const sway = new Float32Array(positions.count);
  const crown = new Float32Array(positions.count);
  for (let index = 0; index < positions.count; index += 1) {
    const height = positions.getY(index);
    sway[index] = THREE.MathUtils.clamp((height - swayStart) / (top - swayStart), 0, 1) ** SWAY.curve;
    crown[index] = height > crownStart ? 1 : 0;
  }
  geometry.setAttribute('sway', new THREE.BufferAttribute(sway, 1));
  geometry.setAttribute('crown', new THREE.BufferAttribute(crown, 1));
  return geometry;
}

function plantedMatrix(
  tree: THREE.Object3D,
  [min, max]: TreeSpecies['scaleRange'],
  random: () => number,
): THREE.Matrix4 {
  const scale = THREE.MathUtils.lerp(min, max, random());
  return tree.matrix.clone().multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
}

function addTrunkColliders(references: readonly THREE.Object3D[], radius: number): void {
  const game = getGame();
  for (const tree of references) {
    game.objects.add(null, {
      type: 'fixed',
      position: tree.position.clone().add(new THREE.Vector3(0, TRUNK_HALF_HEIGHT, 0)),
      rotation: tree.quaternion,
      friction: 0.7,
      sleeping: true,
      colliders: [{ shape: 'cylinder', parameters: [TRUNK_HALF_HEIGHT, radius], category: 'object' }],
      onCollision: (force, position) => game.audio.groups.get('hitDefault')?.playRandomNext(force, position),
    });
  }
}

export class IslandTrees {
  seeThroughMultiplier = 1;
  readonly #seeThroughPosition = uniform(vec2());
  readonly #seeThroughRadius = uniform(0);

  constructor(groves: readonly TreeGrove[]) {
    const game = getGame();
    const material = this.#material();
    for (const grove of groves.filter(({ references }) => references.length > 0)) this.#plant(grove, material);
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.islandTrees);
  }

  #plant({ species, references }: TreeGrove, material: MeshDefaultMaterial): void {
    const mesh = new THREE.InstancedMesh(speciesGeometry(species), material, references.length);
    const random = alea(species.model);
    for (const [index, tree] of references.entries()) {
      mesh.setMatrixAt(index, plantedMatrix(tree, species.scaleRange, random));
    }
    mesh.computeBoundingSphere();
    if (mesh.boundingSphere) mesh.boundingSphere.radius += SWAY_MARGIN;
    mesh.name = species.model;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    getGame().scene.add(mesh);
    addTrunkColliders(references, species.trunkRadius);
  }

  #material(): MeshDefaultMaterial {
    const game = getGame();
    const sway = attribute('sway', 'float');
    const crown = attribute('crown', 'float');
    const alphaNode = Fn(() => {
      const toVehicle = screenUV.sub(this.#seeThroughPosition).mul(vec2(screenSize.x.div(screenSize.y), 1));
      return mix(1, step(this.#seeThroughRadius, toVehicle.length()), crown);
    })();
    const slot = uv().x.mul(PALETTE_SLOTS).floor();
    const paletteColor = texture(game.texture('paletteTexture')).rgb;
    const colorNode = select(
      slot.equal(LEAF_SLOTS.light),
      color(LEAF_COLORS.light).rgb,
      select(slot.equal(LEAF_SLOTS.deep), color(LEAF_COLORS.deep).rgb, paletteColor),
    );
    const material = new MeshDefaultMaterial({
      colorNode,
      alphaNode,
      hasWater: false,
    });
    material.positionNode = Fn(() => {
      const wind = game.wind.offsetNode(positionLocal.xz).mul(SWAY.wind);
      const flutter = sin(
        game.ticker.elapsedScaledUniform.mul(SWAY.flutterSpeed).add(positionLocal.x.add(positionLocal.z).mul(0.7)),
      ).mul(SWAY.flutter);
      return positionLocal.add(vec3(wind.x.add(flutter), 0, wind.y.add(flutter)).mul(sway));
    })();
    return material;
  }

  update(): void {
    const { world, view } = getGame();
    const screenPosition = world.visualVehicle?.screenPosition;
    if (screenPosition) this.#seeThroughPosition.value.copy(screenPosition);
    const radius = view.spherical.radius.current;
    this.#seeThroughRadius.value = (SEE_THROUGH_RADIUS / radius) * this.seeThroughMultiplier;
  }
}
