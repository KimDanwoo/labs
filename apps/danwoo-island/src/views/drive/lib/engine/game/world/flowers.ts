import { alea } from 'seedrandom';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { color, Fn, hash, instanceIndex, mix, positionLocal, step, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { applyInstanceMatrix } from '@views/drive/lib/engine/game/utilities/instanceMatrix';

const rng = alea('flowers');
const CLUSTER = { minCount: 3, extraCount: 8, spread: 3, minScale: 0.6, scaleRange: 0.4 } as const;
const PETALS = 8;
const PETAL_SIZE = 0.08;
const PETAL_DROP = 0.75;
const SHADOW_OFFSET = 0.25;
const UP = new THREE.Vector3(0, 1, 0);
export const BLOSSOMS = { plumeria: '#fff2d6', hibiscus: '#f0786a', orchid: '#f59ac0', allamanda: '#ffd25a' } as const;
const BLOSSOM_SHARE = { bright: 0.45, allamanda: 0.7, orchid: 0.5 } as const;
const BLOSSOM_SEED = { pale: 7, bright: 13 } as const;

function clusterMatrices(references: readonly THREE.Object3D[]): THREE.Matrix4[] {
  return references.flatMap(({ position: center }) => {
    const count = CLUSTER.minCount + Math.floor(rng() * CLUSTER.extraCount);
    return Array.from({ length: count }, () => {
      const object = new THREE.Object3D();
      object.rotation.y = Math.PI * 2 * rng();
      object.position.set(
        center.x + (rng() - 0.5) * CLUSTER.spread,
        center.y,
        center.z + (rng() - 0.5) * CLUSTER.spread,
      );
      object.scale.setScalar(CLUSTER.minScale + rng() * CLUSTER.scaleRange);
      object.updateMatrix();
      return object.matrix;
    });
  });
}

function petal(): THREE.PlaneGeometry {
  const plane = new THREE.PlaneGeometry(PETAL_SIZE, PETAL_SIZE);
  const direction = new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(1, Math.PI * 0.2 * rng(), Math.PI * 2 * rng()),
  );
  const position = direction.clone().setLength(1 + (rng() - 0.5) * 0.5);
  position.y -= PETAL_DROP;
  const matrix = new THREE.Matrix4();
  matrix.lookAt(direction, new THREE.Vector3(), UP);
  matrix.setPosition(position);
  matrix.scale(new THREE.Vector3(1, 1, 1).setScalar(1 + (Math.random() - 0.5)));
  plane.applyMatrix4(matrix);
  return plane;
}

function blossomColor(): THREE.Node<'vec3'> {
  const pale = mix(
    color(BLOSSOMS.plumeria),
    color(BLOSSOMS.allamanda),
    step(BLOSSOM_SHARE.allamanda, hash(instanceIndex.add(BLOSSOM_SEED.pale))),
  );
  const bright = mix(
    color(BLOSSOMS.hibiscus),
    color(BLOSSOMS.orchid),
    step(BLOSSOM_SHARE.orchid, hash(instanceIndex.add(BLOSSOM_SEED.bright))),
  );
  return mix(pale, bright, step(BLOSSOM_SHARE.bright, hash(instanceIndex))).rgb;
}

export class Flowers {
  constructor() {
    const game = getGame();
    const matrices = clusterMatrices(game.model('flowersReferencesModel').scene.children);
    const geometry = mergeGeometries(Array.from({ length: PETALS }, petal));
    geometry.deleteAttribute('uv');

    const instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(matrices.length * 16), 16);
    instanceMatrix.setUsage(THREE.StaticDrawUsage);
    for (const [index, matrix] of matrices.entries()) matrix.toArray(instanceMatrix.array, index * 16);

    const mesh = new THREE.Mesh(geometry, this.#material(instanceMatrix));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = matrices.length;
    mesh.frustumCulled = false;
    game.scene.add(mesh);
  }

  #material(instanceMatrix: THREE.InstancedBufferAttribute): MeshDefaultMaterial {
    const game = getGame();
    const material = new MeshDefaultMaterial({
      side: THREE.DoubleSide,
      colorNode: blossomColor(),
      hasWater: false,
    });
    material.receivedShadowPositionNode = positionLocal.add(game.lighting.directionUniform.mul(uniform(SHADOW_OFFSET)));
    const wind = game.wind.offsetNode(positionLocal.xz);
    const multiplier = positionLocal.y.clamp(0, 1).mul(1);
    material.positionNode = Fn(() => {
      applyInstanceMatrix(instanceMatrix);
      return positionLocal.add(vec3(wind.x, 0, wind.y).mul(multiplier));
    })();
    return material;
  }
}
