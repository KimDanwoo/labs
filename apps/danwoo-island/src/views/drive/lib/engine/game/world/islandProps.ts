import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import { createParts, type Parts, type Triple } from '@views/drive/lib/engine/game/world/islandGeometry';
import { fillSlot } from '@views/drive/lib/engine/game/world/islandMaterials';
import {
  islandModelGeometry,
  islandPaletteMaterial,
  type IslandModelKey,
} from '@views/drive/lib/engine/game/world/islandModels';

const LAMP_GLASS = 'lantern';
const SLOT = { bamboo: 1, blue: 3, ink: 5, node: 14, red: 16, stone: 13 } as const;
const POST = { ground: -1.78, top: 1.5, radius: 0.075, nodes: [-1.05, -0.25, 0.55] } as const;
const ARM = { y: 1.42, reach: 0.66, radius: 0.045, brace: 1.08 } as const;
const CHORONG = { x: 0.54, y: 1.02, radius: 0.2, upper: 0.18, lower: 0.24, sides: 8, glowMargin: 0.012 } as const;

interface Piece {
  readonly slot: number;
  readonly geometry: THREE.BufferGeometry;
}

function prism(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  [x, y, z]: Triple,
  sides: number = CHORONG.sides,
): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides).translate(x, y, z);
}

function rod(radius: number, from: THREE.Vector3, to: THREE.Vector3): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), CHORONG.sides);
  const direction = to.clone().sub(from).normalize();
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction));
  const middle = from.clone().add(to).multiplyScalar(0.5);
  return geometry.translate(middle.x, middle.y, middle.z);
}

function bambooPost(): Piece[] {
  const height = POST.top - POST.ground;
  const armStart = new THREE.Vector3(0, ARM.y, 0);
  const armEnd = new THREE.Vector3(ARM.reach, ARM.y + 0.08, 0);
  return [
    { slot: SLOT.stone, geometry: prism(0.2, 0.27, 0.22, [0, POST.ground + 0.11, 0]) },
    { slot: SLOT.bamboo, geometry: prism(POST.radius, POST.radius, height, [0, POST.ground + height / 2, 0], 7) },
    ...POST.nodes.map((y) => ({ slot: SLOT.node, geometry: prism(0.09, 0.09, 0.04, [0, y, 0], 7) })),
    { slot: SLOT.node, geometry: prism(0.095, 0.085, 0.05, [0, POST.top, 0], 7) },
    { slot: SLOT.bamboo, geometry: rod(ARM.radius, armStart, armEnd) },
    { slot: SLOT.bamboo, geometry: rod(0.025, new THREE.Vector3(0, ARM.brace, 0), armStart.clone().lerp(armEnd, 0.5)) },
    { slot: SLOT.ink, geometry: prism(0.012, 0.012, 0.2, [CHORONG.x, ARM.y - 0.03, 0], 5) },
  ];
}

function chorong(): Piece[] {
  const { x, y, radius, upper, lower } = CHORONG;
  const seam = y + (lower - upper) / 2;
  return [
    { slot: SLOT.ink, geometry: prism(0.1, 0.17, 0.07, [x, seam + upper + 0.035, 0]) },
    { slot: SLOT.blue, geometry: prism(radius, radius, upper, [x, seam + upper / 2, 0]) },
    { slot: SLOT.red, geometry: prism(radius, radius, lower, [x, seam - lower / 2, 0]) },
    { slot: SLOT.ink, geometry: prism(0.17, 0.1, 0.07, [x, seam - lower - 0.035, 0]) },
    { slot: SLOT.red, geometry: prism(0.012, 0.04, 0.16, [x, seam - lower - 0.15, 0], 5) },
  ];
}

function paletteMesh(key: IslandModelKey, matrix: THREE.Matrix4): THREE.Mesh {
  const mesh = new THREE.Mesh(islandModelGeometry(key, { matrix }), islandPaletteMaterial(key));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function modelMesh(key: IslandModelKey, offset: Triple): THREE.Mesh {
  return paletteMesh(key, new THREE.Matrix4().makeTranslation(...offset));
}

function withGlass(mesh: THREE.Mesh, addGlass: (parts: Parts) => void): THREE.Group {
  const parts = createParts();
  addGlass(parts);
  const group = parts.build();
  const glassMesh = group.getObjectByName(LAMP_GLASS);
  if (glassMesh) glassMesh.name = 'glass';
  return group.add(mesh);
}

export function createGardenLamp(): THREE.Group {
  return withGlass(modelMesh('gardenLamp', [0, 0.12, 0]), (parts) =>
    parts.box(LAMP_GLASS, [0.28, 0.2, 0.28], { position: [0, 0.33, 0] }),
  );
}

export function createLampPost(): THREE.Group {
  const pieces = [...bambooPost(), ...chorong()];
  const geometry = mergeGeometries(pieces.map(({ slot, geometry: piece }) => fillSlot(piece, slot)));
  for (const { geometry: piece } of pieces) piece.dispose();
  if (!geometry) throw new Error('청사초롱 가로등 형상을 합치지 못했어요.');
  const post = new THREE.Mesh(geometry, islandPaletteMaterial('gardenLamp'));
  post.castShadow = true;
  post.receiveShadow = true;
  const { x, y, radius, upper, lower } = CHORONG;
  const glow = radius + CHORONG.glowMargin;
  return withGlass(post, (parts) => parts.prism(LAMP_GLASS, glow, glow, upper + lower, { position: [x, y, 0] }));
}

export function createCoconutCrate(): THREE.Group {
  return new THREE.Group().add(paletteMesh('coconutCrate', new THREE.Matrix4().makeRotationX(-Math.PI / 2)));
}
