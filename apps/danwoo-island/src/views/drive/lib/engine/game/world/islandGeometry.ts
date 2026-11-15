import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { color } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';

export const OCTAGON = 8;
export const FULL_TURN = Math.PI * 2;

export const SHADES = {
  stone: '#a39a90',
  stoneDark: '#857c74',
  wood: '#9a5b34',
  woodDark: '#6b3d24',
  fieldstone: '#9a948b',
  thatch: '#d6a548',
  thatchRope: '#a3772c',
  iron: '#3b3a3f',
  glass: '#bfe3ea',
  earth: '#b9956b',
  basalt: '#625b58',
  basaltDark: '#423d3c',
  neonBoard: '#2a2230',
  metalDark: '#3a3a40',
  cabinetWood: '#8a4f2c',
  grille: '#c9b48a',
  timber: '#bb8650',
  slate: '#2f3a33',
  bunting1: '#36AFC0',
  bunting2: '#F47F75',
  bunting3: '#F6CF68',
  bunting4: '#FFF1D6',
  bunting5: '#AA91CC',
  bronze: '#b0803a',
  bamboo: '#D7B66F',
  coconutShell: '#76503A',
  palmLeaf: '#398767',
  sand: '#F1DEB7',
  lagoon: '#49BDC5',
  mango: '#F4B94F',
  pineapple: '#EDBC46',
  terracotta: '#c46a43',
} as const;

const GLOW = {
  lantern: { name: 'emissiveSeokdeungGradient', inner: '#fff1b8', outer: '#ffad3d', intensity: 1.6 },
} as const;

export type ShadeName = keyof typeof SHADES;
export type PartName = ShadeName | keyof typeof GLOW;
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

export interface MeshComponent {
  offsets: number[];
  box: THREE.Box3;
}

const SIGNAGE_FACES = new Set<string>(['glass']);
const SHADOW_MIN_RADIUS = 0.3;
const SHADOWLESS_SUFFIX = ':shadowless';
const DEFAULT_RIDGE_RATIO = 0.55;
const ROD_SIDES = 5;
const LCG = { multiplier: 1664525, increment: 1013904223, modulus: 4294967296 } as const;
const shadedMaterials = new Map<string, MeshDefaultMaterial>();

function isGlow(name: string): name is keyof typeof GLOW {
  return name in GLOW;
}

function shadedMaterial(name: ShadeName): MeshDefaultMaterial {
  const cached = shadedMaterials.get(name);
  if (cached) return cached;
  const isLit = !SIGNAGE_FACES.has(name);
  const material = new MeshDefaultMaterial({
    colorNode: color(SHADES[name]).rgb,
    hasCoreShadows: isLit,
    hasDropShadows: isLit,
  });
  material.userData.prevent = true;
  shadedMaterials.set(name, material);
  return material;
}

export function islandMaterial(name: PartName): THREE.Material {
  if (!isGlow(name)) return shadedMaterial(name);
  const { name: materialName, inner, outer, intensity } = GLOW[name];
  return getGame().materials.emissiveGradient(materialName, { inner, outer, intensity, isNormalized: true });
}

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

export function createParts(): Parts {
  const batches = new Map<string, THREE.BufferGeometry[]>();

  const add = (
    name: PartName,
    geometry: THREE.BufferGeometry,
    { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], matrix = null }: PartTransform = {},
  ): void => {
    geometry.scale(...scale);
    geometry.rotateX(rotation[0]);
    geometry.rotateY(rotation[1]);
    geometry.rotateZ(rotation[2]);
    geometry.translate(...position);
    if (matrix) geometry.applyMatrix4(matrix);
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    if (!isGlow(name) && flat.hasAttribute('uv')) flat.deleteAttribute('uv');
    flat.computeVertexNormals();
    const key = `${name}${castsShadow(flat) ? '' : SHADOWLESS_SUFFIX}`;
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

function isPartName(name: string): name is PartName {
  return name in SHADES || name in GLOW;
}

function islandMaterialByKey(name: string): THREE.Material {
  if (!isPartName(name)) throw new Error(`Unknown island material: ${name}`);
  return islandMaterial(name);
}

export function meshComponents(geometry: THREE.BufferGeometry): { index: number[]; components: MeshComponent[] } {
  const { position } = geometry.attributes;
  if (!position) throw new Error('Geometry has no positions');
  const index = geometry.index
    ? Array.from(geometry.index.array)
    : Array.from({ length: position.count }, (_, vertex) => vertex);
  const canonical = new Map<string, number>();
  const parent = Array.from({ length: position.count }, (_, vertex) => vertex);
  const find = (start: number): number => {
    let vertex = start;
    while (parent[vertex] !== vertex) {
      const grandparent = parent[parent[vertex] ?? vertex] ?? vertex;
      parent[vertex] = grandparent;
      vertex = grandparent;
    }
    return vertex;
  };
  const representative = (vertex: number): number => {
    const key = [position.getX(vertex), position.getY(vertex), position.getZ(vertex)]
      .map((value) => value.toFixed(3))
      .join();
    const existing = canonical.get(key);
    if (existing !== undefined) return existing;
    canonical.set(key, vertex);
    return vertex;
  };
  const roots = index.map(representative);
  for (let offset = 0; offset < roots.length; offset += 3) {
    const first = roots[offset] ?? 0;
    for (const other of [roots[offset + 1], roots[offset + 2]]) {
      if (other !== undefined) parent[find(other)] = find(first);
    }
  }

  const components = new Map<number, MeshComponent>();
  const point = new THREE.Vector3();
  for (let offset = 0; offset < index.length; offset += 3) {
    const root = find(roots[offset] ?? 0);
    const component = components.get(root) ?? { offsets: [], box: new THREE.Box3() };
    components.set(root, component);
    component.offsets.push(offset);
    for (const vertex of index.slice(offset, offset + 3))
      component.box.expandByPoint(point.fromBufferAttribute(position, vertex));
  }
  return { index, components: [...components.values()] };
}

export function removeComponents(
  mesh: THREE.Mesh,
  shouldRemove: (component: MeshComponent) => boolean,
): MeshComponent[] {
  const { index, components } = meshComponents(mesh.geometry);
  const removed = components.filter(shouldRemove);
  const removedOffsets = new Set(removed.flatMap((component) => component.offsets));
  const kept: number[] = [];
  for (let offset = 0; offset < index.length; offset += 3) {
    if (!removedOffsets.has(offset)) kept.push(...index.slice(offset, offset + 3));
  }
  mesh.geometry.setIndex(kept);
  return removed;
}
