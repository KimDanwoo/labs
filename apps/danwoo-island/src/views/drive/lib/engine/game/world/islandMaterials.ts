import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import { attribute, color } from 'three/tsl';
import * as THREE from 'three/webgpu';

const SHADES = {
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

export type PartName = ShadeName | keyof typeof GLOW;
const SIGNAGE_FACES = new Set<string>(['glass']);
function isPartName(name: string): name is PartName {
  return name in SHADES || name in GLOW;
}

type ShadeName = keyof typeof SHADES;
const shadedMaterials = new Map<string, MeshDefaultMaterial>();
export const VERTEX_COLOR_KEY = 'shaded';
let vertexColorMaterial: MeshDefaultMaterial | null = null;
function sharedVertexColorMaterial(): MeshDefaultMaterial {
  if (vertexColorMaterial) return vertexColorMaterial;
  vertexColorMaterial = new MeshDefaultMaterial({ colorNode: attribute('color', 'vec3') });
  vertexColorMaterial.userData.prevent = true;
  return vertexColorMaterial;
}
export function isVertexColored(name: PartName): name is ShadeName {
  return !isGlow(name) && !SIGNAGE_FACES.has(name);
}
export function paintVertices(geometry: THREE.BufferGeometry, name: ShadeName): void {
  const { count } = geometry.getAttribute('position');
  const { r, g, b } = new THREE.Color(SHADES[name]);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) colors.set([r, g, b], index * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
export function isGlow(name: string): name is keyof typeof GLOW {
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
export function islandMaterialByKey(name: string): THREE.Material {
  if (name === VERTEX_COLOR_KEY) return sharedVertexColorMaterial();
  if (!isPartName(name)) throw new Error(`Unknown island material: ${name}`);
  return islandMaterial(name);
}

export const PALETTE_SLOTS = 32;
const PALETTE_ROW = 0.5;

type SlotRepaint = ReadonlyMap<number, number>;

function paletteSlot(u: number): number {
  return Math.floor(u * PALETTE_SLOTS);
}

export function repaintSlots(geometry: THREE.BufferGeometry, repaint: SlotRepaint): void {
  const uv = geometry.getAttribute('uv');
  if (!uv) return;
  for (let vertex = 0; vertex < uv.count; vertex += 1) {
    const slot = repaint.get(paletteSlot(uv.getX(vertex)));
    if (slot !== undefined) uv.setXY(vertex, (slot + 0.5) / PALETTE_SLOTS, PALETTE_ROW);
  }
  uv.needsUpdate = true;
}
