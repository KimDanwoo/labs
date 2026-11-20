import { instance } from 'three/tsl';
import * as THREE from 'three/webgpu';

export function applyInstanceMatrix(matrices: THREE.InstancedBufferAttribute): void {
  const node: unknown = instance(matrices);
  if (!(node instanceof THREE.Node)) throw new Error('instance() did not return a node');
  node.toStack();
}
