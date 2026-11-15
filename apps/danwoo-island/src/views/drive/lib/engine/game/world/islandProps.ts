import * as THREE from 'three/webgpu';

import { createParts, seededRandom, type Triple } from './islandGeometry';
import { islandModelGeometry, islandPaletteMaterial, type IslandModelKey } from './islandModels';

interface Glass {
  size: Triple;
  position: Triple;
}

const LAMP_GLASS = 'lantern';
const FIELDSTONE_SEED = 11;
const FIELDSTONE_JITTER = { min: 0.86, range: 0.22 } as const;
const FIELDSTONE_SCALE: Triple = [0.68, 0.37, 0.82];

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
  return withGlass(modelMesh('lampPost', [0.305, -0.03, 0]), { size: [0.32, 0.4, 0.32], position: [0.62, 1, 0] });
}

export function createBeachBench(): THREE.Group {
  return new THREE.Group().add(modelMesh('beachBench', [0, -0.105, -0.015]));
}

export function createRopeFence(): THREE.Group {
  return new THREE.Group().add(modelMesh('ropeFence', [0, -0.42, 0]));
}

export function createCoconutCrate(): THREE.Group {
  return new THREE.Group().add(paletteMesh('coconutCrate', new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
}

function jitterVertices(geometry: THREE.BufferGeometry): void {
  const random = seededRandom(FIELDSTONE_SEED);
  const { position } = geometry.attributes;
  if (!position) return;
  const jitterByVertex = new Map<string, number>();
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    const jitter = jitterByVertex.get(key) ?? FIELDSTONE_JITTER.min + random() * FIELDSTONE_JITTER.range;
    jitterByVertex.set(key, jitter);
    position.setXYZ(index, x * jitter, y * jitter, z * jitter);
  }
}

export function createFieldstone(): THREE.Group {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  jitterVertices(geometry);
  const parts = createParts();
  parts.add('fieldstone', geometry, { scale: FIELDSTONE_SCALE });
  return parts.build();
}
