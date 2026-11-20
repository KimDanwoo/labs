import * as THREE from 'three/webgpu';

import { createParts, type Triple } from '@views/drive/lib/engine/game/world/islandGeometry';
import {
  islandModelGeometry,
  islandPaletteMaterial,
  type IslandModelKey,
} from '@views/drive/lib/engine/game/world/islandModels';

interface Glass {
  size: Triple;
  position: Triple;
}

const LAMP_GLASS = 'lantern';

function paletteMesh(key: IslandModelKey, matrix: THREE.Matrix4): THREE.Mesh {
  const mesh = new THREE.Mesh(islandModelGeometry(key, { matrix }), islandPaletteMaterial(key));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function modelMesh(key: IslandModelKey, offset: Triple): THREE.Mesh {
  return paletteMesh(key, new THREE.Matrix4().makeTranslation(...offset));
}

function withGlass(mesh: THREE.Mesh, glass: Glass): THREE.Group {
  const parts = createParts();
  parts.box(LAMP_GLASS, glass.size, { position: glass.position });
  const group = parts.build();
  const glassMesh = group.getObjectByName(LAMP_GLASS);
  if (glassMesh) glassMesh.name = 'glass';
  return group.add(mesh);
}

export function createGardenLamp(): THREE.Group {
  return withGlass(modelMesh('gardenLamp', [0, 0.12, 0]), { size: [0.28, 0.2, 0.28], position: [0, 0.33, 0] });
}

export function createLampPost(): THREE.Group {
  return withGlass(modelMesh('lampPost', [0, -0.03, 0]), { size: [0.32, 0.38, 0.32], position: [0, 1.39, 0] });
}

export function createCoconutCrate(): THREE.Group {
  return new THREE.Group().add(paletteMesh('coconutCrate', new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
}
