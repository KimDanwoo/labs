import * as THREE from 'three/webgpu';

import { isModel, textureResource, type ResourceSpec, type Resources } from '../resourcesLoader';

const ISLAND_TEXTURES = new Map<string, string>(
  Object.entries({
    circuitBrand: 'areas/island/circuitBrand.webp',
    circuitWebgl: 'areas/island/circuitWebgl.webp',
    circuitWebgpu: 'areas/island/circuitWebgpu.webp',
    circuitThreejs: 'areas/island/circuitThreejs.webp',
    cookieBanner: 'areas/island/cookieBanner.webp',
    projectsCarpet: 'areas/island/projectsCarpet.webp',
    labCarpet: 'areas/island/labCarpet.webp',
    blackboardLabels: 'areas/island/blackboardLabels.webp',
    projectsLabels: 'areas/island/projectsLabels.webp',
    bowlingLabelStrike: 'areas/island/bowlingLabelStrike.webp',
  }),
);

const resourceName = (materialName: string): string =>
  `island${materialName.charAt(0).toUpperCase()}${materialName.slice(1)}Texture`;

export function islandTextureResources(cacheBuster: string): ResourceSpec[] {
  return [...ISLAND_TEXTURES].map(([materialName, path]) =>
    textureResource(resourceName(materialName), `${path}${cacheBuster}`, 'texture'),
  );
}

function matchSampling(replacement: THREE.Texture, original: THREE.Texture): THREE.Texture {
  replacement.flipY = original.flipY;
  replacement.colorSpace = original.colorSpace;
  replacement.wrapS = original.wrapS;
  replacement.wrapT = original.wrapT;
  replacement.needsUpdate = true;
  return replacement;
}

function hasMap(material: unknown): material is THREE.Material & { map: THREE.Texture | null } {
  return (
    material instanceof THREE.Material &&
    'map' in material &&
    (material.map === null || material.map instanceof THREE.Texture)
  );
}

export function applyIslandTextures(root: THREE.Object3D, resources: Resources): void {
  root.traverse((child) => {
    const material: unknown = child instanceof THREE.Mesh ? child.material : null;
    if (!hasMap(material) || !material.map || !ISLAND_TEXTURES.has(material.name)) return;
    const replacement = resources[resourceName(material.name)];
    if (!replacement || isModel(replacement) || material.map === replacement) return;
    material.map = matchSampling(replacement, material.map);
  });
}
