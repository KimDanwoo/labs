import { color, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { Foliage } from './foliage';

export interface TreesOptions {
  visual: THREE.Object3D;
  references: readonly THREE.Object3D[];
  colorA: string;
  colorB: string;
}

const TRUNK = { halfHeight: 2.5, radius: 0.15 } as const;

function findParts(visual: THREE.Object3D): { body: THREE.Mesh; leaves: THREE.Mesh[] } {
  const leaves: THREE.Mesh[] = [];
  let body: THREE.Mesh | null = null;
  visual.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child.name.startsWith('treeLeaves')) leaves.push(child);
    else if (child.name.startsWith('treeBody')) body = child;
  });
  if (!body) throw new Error('Tree model has no body');
  return { body, leaves };
}

export class Trees {
  readonly leaves: Foliage;

  constructor({ visual, references, colorA, colorB }: TreesOptions) {
    const game = getGame();
    const parts = findParts(visual);
    this.#addTrunks(parts.body, references);

    const leafReferences = references.flatMap((tree) =>
      parts.leaves.map((leaves) => {
        const reference = new THREE.Object3D();
        reference.applyMatrix4(leaves.matrix.clone().premultiply(tree.matrixWorld));
        return reference;
      }),
    );
    this.leaves = new Foliage({
      references: leafReferences,
      colorA: uniform(color(colorA)),
      colorB: uniform(color(colorB)),
      isSeeThrough: true,
    });

    for (const tree of references) {
      game.objects.add(null, {
        type: 'fixed',
        position: tree.position.clone().add(new THREE.Vector3(0, TRUNK.halfHeight, 0)),
        rotation: tree.quaternion,
        friction: 0.7,
        sleeping: true,
        colliders: [{ shape: 'cylinder', parameters: [TRUNK.halfHeight, TRUNK.radius], category: 'object' }],
        onCollision: (force, position) => game.audio.groups.get('hitDefault')?.playRandomNext(force, position),
      });
    }
  }

  #addTrunks(body: THREE.Mesh, references: readonly THREE.Object3D[]): void {
    const game = getGame();
    game.materials.updateObject(body);
    const trunks = new THREE.InstancedMesh(body.geometry, body.material, references.length);
    trunks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    trunks.castShadow = true;
    trunks.receiveShadow = true;
    for (const [index, tree] of references.entries()) trunks.setMatrixAt(index, tree.matrix);
    game.scene.add(trunks);
  }
}
