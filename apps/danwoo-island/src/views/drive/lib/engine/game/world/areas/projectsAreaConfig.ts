import type { ProjectContent } from '@views/drive/lib/engine/data/worldContent';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { Area } from '@views/drive/lib/engine/game/world/areas/area';
import type { Direction } from '@views/drive/lib/engine/game/world/areas/showcaseVisuals';
import { color, Fn, texture, uv } from 'three/tsl';
import * as THREE from 'three/webgpu';

export type ImageLanding = 'first' | 'last';
export const CINEMATIC_OFFSETS = {
  position: new THREE.Vector3(4.65, 4, 4.85),
  target: new THREE.Vector3(-3.0, 1.6, -4.6),
};
const CHARCOAL_COLOR = 0x6f6a87;
export const CHARCOAL_THRESHOLD = { base: 0.25, amplitude: 0.1, phase: 0.5, initial: 0.2 } as const;
export function wrapIndex(index: number, count: number): number {
  if (index > count - 1) return 0;
  if (index < 0) return count - 1;
  return index;
}
function assignMaterial(object: THREE.Object3D, material: THREE.Material): void {
  if (object instanceof THREE.Mesh) object.material = material;
}
const FORGE_TOOLS = ['hammer', 'blade', 'grinder', 'blower'] as const;
export function hideForgeTools(require: (name: string) => THREE.Object3D): void {
  for (const name of FORGE_TOOLS) {
    require(name).traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry = new THREE.BufferGeometry();
    });
  }
}

export function siblingImage(
  projects: readonly ProjectContent[],
  { index, imageIndex: currentImage, direction }: { index: number; imageIndex: number; direction: Direction },
): string {
  const current = projects[index];
  if (!current) return '';
  let projectIndex = index;
  let imageIndex = currentImage + (direction === 'previous' ? -1 : 1);
  if (imageIndex < 0) {
    projectIndex = wrapIndex(projectIndex - 1, projects.length);
    imageIndex = (projects[projectIndex]?.images.length ?? 1) - 1;
  } else if (imageIndex > current.images.length - 1) {
    projectIndex = wrapIndex(projectIndex + 1, projects.length);
    imageIndex = 0;
  }
  return projects[projectIndex]?.images[imageIndex] ?? '';
}

export function adjacentTitles(
  projects: readonly ProjectContent[],
  index: number,
): { previous: readonly string[]; next: readonly string[] } {
  const count = projects.length;
  return {
    previous: projects[wrapIndex(index - 1, count)]?.titleSmall ?? [],
    next: projects[(index + 1) % count]?.titleSmall ?? [],
  };
}

export function fireCharcoal(
  game: Area['game'],
  charcoal: THREE.Object3D,
  threshold: THREE.UniformNode<'float', number>,
): void {
  const { noises } = game;
  const alphaNode = Fn(() => texture(noises.voronoi, uv()).g.sub(threshold))();
  assignMaterial(
    charcoal,
    new MeshDefaultMaterial({
      colorNode: color(CHARCOAL_COLOR).rgb,
      alphaNode,
      hasWater: false,
      hasLightBounce: false,
      hasSeeThrough: true,
    }),
  );
}

export function landingImageIndex(current: ProjectContent | null, landing: ImageLanding, direction: Direction): number {
  const isFirstImage = landing === 'first' || direction === 'next';
  return isFirstImage ? 0 : (current?.images.length ?? 1) - 1;
}

export function charcoalThresholdAt(elapsed: number): number {
  return -Math.sin(elapsed - CHARCOAL_THRESHOLD.phase) * CHARCOAL_THRESHOLD.amplitude + CHARCOAL_THRESHOLD.base;
}
