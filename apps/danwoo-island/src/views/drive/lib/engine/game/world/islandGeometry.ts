import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import {
  isGlow,
  islandMaterialByKey,
  isVertexColored,
  paintVertices,
  VERTEX_COLOR_KEY,
  type PartName,
} from './islandMaterials';

export const OCTAGON = 8;
export const FULL_TURN = Math.PI * 2;
export const QUARTER_TURN = FULL_TURN / 4;
export type Triple = readonly [number, number, number];

export interface PartTransform {
  position?: Triple;
  rotation?: Triple;
  scale?: Triple;
  matrix?: THREE.Matrix4 | null;
}

export interface HipRoof {
  width: number;
  depth: number;
  height: number;
  ridgeRatio?: number;
  position?: Triple;
  matrix?: THREE.Matrix4 | null;
}

const SHADOW_MIN_RADIUS = 0.3;
const SHADOWLESS_SUFFIX = ':shadowless';
const DEFAULT_RIDGE_RATIO = 0.55;
const ROD_SIDES = 5;
const LCG = { multiplier: 1664525, increment: 1013904223, modulus: 4294967296 } as const;

export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * LCG.multiplier + LCG.increment) % LCG.modulus;
    return state / LCG.modulus;
  };
}

function hipRoofGeometry(width: number, depth: number, height: number, ridgeRatio: number): THREE.BufferGeometry {
  const w = width / 2;
  const d = depth / 2;
  const r = (width * ridgeRatio) / 2;
  const corners = {
    frontLeft: [-w, 0, d],
    frontRight: [w, 0, d],
    backRight: [w, 0, -d],
    backLeft: [-w, 0, -d],
    ridgeLeft: [-r, height, 0],
    ridgeRight: [r, height, 0],
  } as const;
  type Corner = keyof typeof corners;
  const faces: readonly (readonly Corner[])[] = [
    ['frontLeft', 'frontRight', 'ridgeRight'],
    ['frontLeft', 'ridgeRight', 'ridgeLeft'],
    ['backRight', 'backLeft', 'ridgeLeft'],
    ['backRight', 'ridgeLeft', 'ridgeRight'],
    ['frontRight', 'backRight', 'ridgeRight'],
    ['backLeft', 'frontLeft', 'ridgeLeft'],
    ['frontLeft', 'backLeft', 'backRight'],
    ['frontLeft', 'backRight', 'frontRight'],
  ];
  const geometry = new THREE.BufferGeometry();
  const positions = faces.flat().flatMap((key) => corners[key]);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function castsShadow(geometry: THREE.BufferGeometry): boolean {
  geometry.computeBoundingSphere();
  return (geometry.boundingSphere?.radius ?? 0) >= SHADOW_MIN_RADIUS;
}

export interface Parts {
  add: (name: PartName, geometry: THREE.BufferGeometry, transform?: PartTransform) => void;
  box: (name: PartName, size: Triple, transform?: PartTransform) => void;
  prism: (
    name: PartName,
    radiusTop: number,
    radiusBottom: number,
    height: number,
    transform?: PartTransform,
    sides?: number,
  ) => void;
  rod: (name: PartName, radius: number, from: Triple, to: Triple, sides?: number) => void;
  hipRoof: (name: PartName, roof: HipRoof) => void;
  build: (matrix?: THREE.Matrix4) => THREE.Group;
}

function transformGeometry(
  geometry: THREE.BufferGeometry,
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], matrix = null }: PartTransform,
): THREE.BufferGeometry {
  geometry.scale(...scale);
  geometry.rotateX(rotation[0]);
  geometry.rotateY(rotation[1]);
  geometry.rotateZ(rotation[2]);
  geometry.translate(...position);
  if (matrix) geometry.applyMatrix4(matrix);
  return geometry;
}

function finishGeometry(name: PartName, geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  if (flat !== geometry) geometry.dispose();
  if (!isGlow(name) && flat.hasAttribute('uv')) flat.deleteAttribute('uv');
  flat.computeVertexNormals();
  if (isVertexColored(name)) paintVertices(flat, name);
  return flat;
}

export function createParts(): Parts {
  const batches = new Map<string, THREE.BufferGeometry[]>();

  const add = (name: PartName, geometry: THREE.BufferGeometry, transform: PartTransform = {}): void => {
    const flat = finishGeometry(name, transformGeometry(geometry, transform));
    const batchName = isVertexColored(name) ? VERTEX_COLOR_KEY : name;
    const key = `${batchName}${castsShadow(flat) ? '' : SHADOWLESS_SUFFIX}`;
    const batch = batches.get(key) ?? [];
    batch.push(flat);
    batches.set(key, batch);
  };

  const box = (name: PartName, size: Triple, transform?: PartTransform): void =>
    add(name, new THREE.BoxGeometry(...size), transform);

  const prism = (
    name: PartName,
    radiusTop: number,
    radiusBottom: number,
    height: number,
    transform?: PartTransform,
    sides = OCTAGON,
  ): void => add(name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides), transform);

  const rod = (name: PartName, radius: number, from: Triple, to: Triple, sides = ROD_SIDES): void => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const geometry = new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), sides);
    const direction = end.clone().sub(start).normalize();
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction));
    const [x, y, z] = start.add(end).multiplyScalar(0.5).toArray();
    geometry.translate(x, y, z);
    add(name, geometry);
  };

  const hipRoof = (
    name: PartName,
    { width, depth, height, ridgeRatio = DEFAULT_RIDGE_RATIO, position, matrix = null }: HipRoof,
  ): void => add(name, hipRoofGeometry(width, depth, height, ridgeRatio), { position, matrix });

  const build = (matrix = new THREE.Matrix4()): THREE.Group => {
    const group = new THREE.Group();
    for (const [key, geometries] of batches) {
      const isShadowless = key.endsWith(SHADOWLESS_SUFFIX);
      const name = isShadowless ? key.slice(0, -SHADOWLESS_SUFFIX.length) : key;
      const mesh = new THREE.Mesh(mergeGeometries(geometries), islandMaterialByKey(name));
      for (const geometry of geometries) geometry.dispose();
      mesh.name = name;
      mesh.castShadow = !isShadowless;
      mesh.userData.preventShadow = isShadowless;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(matrix);
      group.add(mesh);
    }
    return group;
  };

  return { add, box, prism, rod, hipRoof, build };
}
