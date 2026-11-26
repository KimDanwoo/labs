import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { ColliderDescription } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { COVE } from '@views/drive/lib/engine/game/world/layout/tideCove';

const PINES = [
  [-7.8, -2.4, 1.05],
  [-5.7, -3.4, 1.35],
  [-3.9, -3.3, 0.78],
  [3.6, 3.7, 0.85],
  [5.5, 3.1, 1.06],
  [8.7, -1.8, 1.25],
  [9.7, -0.9, 0.78],
] as const;
const FLAKES = 275;
const CEILING = 6.3;

function branches(parent: THREE.Group, snow: boolean): void {
  const color = snow ? '#ecf3f4' : '#40635e';
  const material = new MeshDefaultMaterial({ colorNode: uniform(new THREE.Color(color)).rgb });
  const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), material, PINES.length * 3);
  const object = new THREE.Object3D();
  for (const [index, [x, z, size]] of PINES.entries()) {
    for (let layer = 0; layer < 3; layer++) {
      const radius = (1 - 0.23 * layer) * size;
      const scale = snow ? 0.83 : 1;
      object.position.set(x, (0.92 + layer * 0.72 + (snow ? 0.18 : 0)) * size, z);
      object.rotation.y = index + layer * 0.34;
      object.scale.set(radius * scale, (1.7 - layer * 0.19) * size * scale, radius * scale);
      object.updateMatrix();
      mesh.setMatrixAt(index * 3 + layer, object.matrix);
    }
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

const DRIFTS = [
  [-9.1, -2.6, 2.9, 0.74, 0.97, -0.28],
  [-6.1, -3.8, 3.3, 1.2, 1.05, 0.06],
  [-1.7, -4.3, 2.9, 0.78, 1.12, 0.18],
  [8.3, -2.5, 2.4, 1.08, 1.3, -0.52],
  [10.2, 0.5, 1.75, 0.66, 0.97, 0.52],
  [1.7, 4.45, 2.5, 0.61, 0.95, 0.15],
  [-4, 3.95, 2.8, 0.44, 0.94, -0.12],
] as const;

function snowbanks(parent: THREE.Group): ColliderDescription[] {
  const colliders: ColliderDescription[] = [];
  const base = new THREE.IcosahedronGeometry(1, 1);
  const frost = new THREE.IcosahedronGeometry(1, 1);
  const mesh = (geometry: THREE.BufferGeometry, shade: string) => {
    const material = new MeshDefaultMaterial({ colorNode: uniform(new THREE.Color(shade)).rgb });
    const layer = new THREE.InstancedMesh(geometry, material, DRIFTS.length);
    layer.receiveShadow = true;
    layer.castShadow = true;
    parent.add(layer);
    return layer;
  };
  const ice = mesh(base, '#91bdcb');
  const cap = mesh(frost, '#f6f9fd');
  const object = new THREE.Object3D();
  for (const [index, [x, z, width, height, depth, angle]] of DRIFTS.entries()) {
    object.position.set(x, -0.16, z);
    object.rotation.y = angle;
    object.scale.set(width, height, depth);
    object.updateMatrix();
    ice.setMatrixAt(index, object.matrix);
    object.position.y = height * 0.25;
    object.scale.set(width * 1.07, height * 0.79, depth * 1.04);
    object.updateMatrix();
    cap.setMatrixAt(index, object.matrix);
    const hull = frost.clone().applyMatrix4(object.matrix);
    colliders.push({
      position: parent.position,
      shape: 'hull',
      parameters: [new Float32Array(hull.getAttribute('position').array)],
    });
    hull.dispose();
  }
  return colliders;
}

function snowflakes(): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1),
    new THREE.MeshBasicMaterial({ color: '#f9fcff' }),
    FLAKES,
  );
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, CEILING / 2, 0), COVE.islandRadiusX + 2);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}

export class SnowHeadland {
  readonly colliders: ColliderDescription[];
  constructor(harbor: THREE.Group) {
    const game = getGame();
    const headland = new THREE.Group();
    headland.position.set(COVE.islandX, 0, COVE.islandZ);
    harbor.add(headland);
    this.colliders = snowbanks(headland);
    branches(headland, false);
    branches(headland, true);
    const snow = snowflakes();
    headland.add(snow);
    const seeds = Array.from({ length: FLAKES }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 0.96;
      return {
        x: Math.cos(angle) * radius * COVE.islandRadiusX,
        z: Math.sin(angle) * radius * COVE.islandRadiusZ,
        phase: Math.random() * CEILING,
        speed: 0.52 + Math.random() * 0.51,
        size: 0.033 + Math.random() ** 2 * 0.085,
      };
    });
    const transform = new THREE.Matrix4();
    game.ticker.events.on(
      'tick',
      () => {
        const focus = game.view.optimalArea;
        snow.visible =
          Math.hypot(focus.position.x - COVE.islandX, focus.position.z - COVE.islandZ) <
          focus.radius + COVE.islandRadiusX;
        snow.visible = snow.visible && game.water.tide.value > 0.72;
        if (!snow.visible) return;
        const time = game.ticker.elapsedScaled;
        for (const [index, seed] of seeds.entries()) {
          const height = CEILING - ((time * seed.speed + seed.phase) % CEILING);
          const size = seed.size * Math.min(1, height * 3, (CEILING - height) * 3);
          transform
            .makeScale(size, size, size)
            .setPosition(
              seed.x + 0.24 * Math.sin(time + seed.phase),
              height,
              seed.z + 0.13 * Math.cos(time * 0.7 + index),
            );
          snow.setMatrixAt(index, transform);
        }
        snow.instanceMatrix.needsUpdate = true;
      },
      TICK_ORDER.area,
    );
  }
}
