import { texture, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';

interface TexturedMeshOptions {
  name?: string;
  matrix?: THREE.Matrix4 | null;
  castShadow?: boolean;
}

export function canvasMaterial(canvasTexture: THREE.Texture): MeshDefaultMaterial {
  const sample = texture(canvasTexture, uv());
  const material = new MeshDefaultMaterial({
    colorNode: sample.rgb,
    alphaNode: sample.a,
    hasDropShadows: false,
    hasSeeThrough: true,
  });
  material.userData.prevent = true;
  return material;
}

export function texturedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  { name, matrix = null, castShadow = true }: TexturedMeshOptions = {},
): THREE.Mesh {
  if (matrix) geometry.applyMatrix4(matrix);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name ?? 'textured';
  mesh.castShadow = castShadow;
  mesh.userData.preventShadow = !castShadow;
  mesh.receiveShadow = true;
  return mesh;
}
