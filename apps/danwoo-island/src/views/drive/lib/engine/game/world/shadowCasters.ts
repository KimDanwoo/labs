import * as THREE from 'three/webgpu';

const MIN_CASTER_SIZE = 0.35;
const MIN_CASTER_HEIGHT = 0.06;

const size = new THREE.Vector3();
const worldBox = new THREE.Box3();

function isNegligibleCaster(mesh: THREE.Mesh): boolean {
  const isMultiInstance = mesh instanceof THREE.InstancedMesh || mesh.count > 1;
  if (isMultiInstance) return false;
  const { geometry } = mesh;
  if (!geometry.attributes.position) return false;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return false;
  worldBox.copy(box).applyMatrix4(mesh.matrixWorld).getSize(size);
  return Math.max(size.x, size.y, size.z) < MIN_CASTER_SIZE || size.y < MIN_CASTER_HEIGHT;
}

export function pruneShadowCasters(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!child.castShadow) return;
    if (!isNegligibleCaster(child)) return;
    child.castShadow = false;
    child.userData.preventShadow = true;
  });
}
