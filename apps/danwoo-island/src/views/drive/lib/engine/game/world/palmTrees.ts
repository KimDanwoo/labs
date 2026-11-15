import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  attribute,
  Fn,
  mix,
  positionLocal,
  screenSize,
  screenUV,
  sin,
  step,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { islandModelGeometry } from './islandModels';
import { addTrunkColliders } from './trees';

const TRUNK_BASE_X = 0.9;
const TRUNK_RADIUS = 0.26;
const SWAY = { start: 1.5, wind: 0.35, flutter: 0.06, flutterSpeed: 1.7 } as const;
const CROWN_START = 4.3;
const SCALE_RANGE = [1.1, 1.35] as const;
const SEE_THROUGH_RADIUS = 3;
const SWAY_MARGIN = 0.5;
const TICK_ORDER = 10;

function palmGeometry(): THREE.BufferGeometry {
  const geometry = islandModelGeometry('palmTree');
  geometry.computeBoundingBox();
  const bottom = geometry.boundingBox?.min.y ?? 0;
  geometry.translate(TRUNK_BASE_X, -bottom, 0);
  return geometry;
}

function heightAttributes(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute('position');
  const top = geometry.boundingBox?.max.y ?? 1;
  const sway = new Float32Array(positions.count);
  const crown = new Float32Array(positions.count);
  for (let index = 0; index < positions.count; index += 1) {
    const height = positions.getY(index);
    sway[index] = THREE.MathUtils.clamp((height - SWAY.start) / (top - SWAY.start), 0, 1) ** 1.5;
    crown[index] = height > CROWN_START ? 1 : 0;
  }
  geometry.setAttribute('sway', new THREE.BufferAttribute(sway, 1));
  geometry.setAttribute('crown', new THREE.BufferAttribute(crown, 1));
}

function plantedGeometry(base: THREE.BufferGeometry, tree: THREE.Object3D): THREE.BufferGeometry {
  const scale = THREE.MathUtils.randFloat(...SCALE_RANGE);
  const matrix = tree.matrix.clone().multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
  return base.clone().applyMatrix4(matrix);
}

export class PalmTrees {
  seeThroughMultiplier = 1;
  readonly #seeThroughPosition = uniform(vec2());
  readonly #seeThroughRadius = uniform(0);

  constructor(references: readonly THREE.Object3D[]) {
    const game = getGame();
    const base = palmGeometry();
    base.computeBoundingBox();
    heightAttributes(base);
    const merged = mergeGeometries(references.map((tree) => plantedGeometry(base, tree)));
    if (!merged) throw new Error('Palm trees could not be merged');
    merged.computeBoundingSphere();
    if (merged.boundingSphere) merged.boundingSphere.radius += SWAY_MARGIN;

    const mesh = new THREE.Mesh(merged, this.#material());
    mesh.name = 'palmTrees';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    game.scene.add(mesh);
    addTrunkColliders(references, TRUNK_RADIUS);
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #material(): MeshDefaultMaterial {
    const game = getGame();
    const sway = attribute('sway', 'float');
    const crown = attribute('crown', 'float');
    const alphaNode = Fn(() => {
      const toVehicle = screenUV.sub(this.#seeThroughPosition).mul(vec2(screenSize.x.div(screenSize.y), 1));
      return mix(1, step(this.#seeThroughRadius, toVehicle.length()), crown);
    })();
    const material = new MeshDefaultMaterial({
      colorNode: texture(game.texture('paletteTexture')).rgb,
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
