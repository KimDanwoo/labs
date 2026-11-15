import { instance } from 'three/tsl';
import * as THREE from 'three/webgpu';

export function applyInstanceMatrix(matrices: THREE.InstancedBufferAttribute): void {
  // @types/three는 instance()를 void로 선언하지만 실제로는 스택에 올려야 하는 노드를 반환한다 (three/src/nodes/accessors/Instance.js)
  const node: unknown = instance(matrices);
  if (!(node instanceof THREE.Node)) throw new Error('instance() did not return a node');
  node.toStack();
}
