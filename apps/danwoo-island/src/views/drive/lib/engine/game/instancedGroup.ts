import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';

export type InstanceReference = THREE.Object3D & { needsUpdate?: boolean };

export interface InstancedGroupOptions {
  isAutoUpdated?: boolean;
}

interface InstancedPart {
  localMatrix: THREE.Matrix4;
  instance: THREE.InstancedMesh;
}

const TICK_ORDER = 13;

export function referencesFromChildren(children: readonly THREE.Object3D[]): InstanceReference[] {
  return children.map((child) => {
    const reference: InstanceReference = new THREE.Object3D();
    reference.position.copy(child.position);
    reference.rotation.copy(child.rotation);
    reference.scale.copy(child.scale);
    reference.needsUpdate = true;
    return reference;
  });
}

export function baseAndReferencesFromInstances(
  instances: readonly THREE.Object3D[],
): [base: THREE.Object3D, references: InstanceReference[]] {
  const first = instances[0];
  if (!first) throw new Error('No instances to group');
  const base = first.clone();
  base.position.set(0, 0, 0);
  base.rotation.set(0, 0, 0);
  return [base, referencesFromChildren(instances)];
}

export class InstancedGroup {
  static getReferencesFromChildren = referencesFromChildren;
  static getBaseAndReferencesFromInstances = baseAndReferencesFromInstances;

  readonly references: InstanceReference[];
  readonly meshes: InstancedPart[] = [];
  needsUpdate = false;

  constructor(
    references: InstanceReference[],
    group: THREE.Object3D,
    { isAutoUpdated = true }: InstancedGroupOptions = {},
  ) {
    const game = getGame();
    this.references = references;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) this.meshes.push(this.#instance(child));
    });
    if (isAutoUpdated) game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    this.update();
  }

  #instance(mesh: THREE.Mesh): InstancedPart {
    mesh.updateMatrix();
    mesh.updateWorldMatrix(false, false);
    const instance = new THREE.InstancedMesh(mesh.geometry, mesh.material, this.references.length);
    instance.name = mesh.name;
    instance.castShadow = mesh.castShadow;
    instance.receiveShadow = mesh.receiveShadow;
    instance.frustumCulled = mesh.frustumCulled;
    getGame().scene.add(instance);
    return { localMatrix: mesh.matrix, instance };
  }

  updateBoundings(): void {
    for (const { instance } of this.meshes) instance.computeBoundingSphere();
  }

  update(): void {
    let hasUpdated = false;
    for (const [index, reference] of this.references.entries()) {
      if (!this.needsUpdate && !reference.needsUpdate) continue;
      hasUpdated = true;
      reference.needsUpdate = false;
      reference.updateMatrixWorld();
      for (const { localMatrix, instance } of this.meshes) {
        instance.setMatrixAt(index, localMatrix.clone().premultiply(reference.matrixWorld));
      }
    }
    if (hasUpdated) {
      for (const { instance } of this.meshes) instance.instanceMatrix.needsUpdate = true;
    }
    this.needsUpdate = false;
  }
}
