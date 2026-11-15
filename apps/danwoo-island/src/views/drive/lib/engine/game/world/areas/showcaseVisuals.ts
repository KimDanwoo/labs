import gsap from 'gsap';
import { color, float, Fn, mix, texture, uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial';
import { TextCanvas } from '../../textCanvas';

export type Direction = 'previous' | 'next';

interface Shade {
  readonly uniform: THREE.UniformNode<'float', number>;
  readonly min: number;
  readonly max: number;
}

export interface Shades {
  readonly images: Shade;
  readonly texts: Shade;
}

export interface HoverMaterials {
  readonly inactive: THREE.Material;
  readonly active: THREE.Material;
}

interface TextCanvasSize {
  readonly fontSize: number;
  readonly width: number;
  readonly height: number;
  readonly lineHeight?: number;
}

export const TEXT_DENSITY = 200;
const TEXT_COLOR = '#ffffff';
const HIGHLIGHT_STRENGTH = 1.5;
const SHADE_FADE = { open: 2, close: 1.5 } as const;
const PENDULUM = { angle: 0.75, duration: 0.75, delay: 0.75, offset: 1.5 } as const;

function shade(min: number, max: number): Shade {
  return { uniform: uniform(min), min, max };
}

export function createShades(): Shades {
  return { images: shade(0.1, 0.65), texts: shade(0.1, 0.3) };
}

export function fadeShades(shades: Shades, phase: keyof typeof SHADE_FADE): void {
  for (const { uniform: value, min, max } of [shades.images, shades.texts]) {
    gsap.to(value, {
      value: phase === 'open' ? max : min,
      duration: SHADE_FADE[phase],
      ease: 'power2.inOut',
      overwrite: true,
    });
  }
}

export function textColor(): THREE.Node<'vec3'> {
  return color(TEXT_COLOR).rgb;
}

export function showcaseTextCanvas({ fontSize, width, height, lineHeight }: TextCanvasSize): TextCanvas {
  return new TextCanvas({
    fontFamily: 'MaruBuri',
    fontWeight: '700',
    fontSize,
    width,
    height,
    density: TEXT_DENSITY,
    align: 'center',
    lineHeight,
  });
}

export function childStartingWith(parent: THREE.Object3D, prefix: string): THREE.Object3D {
  const child = parent.children.find(({ name }) => name.startsWith(prefix));
  if (!child) throw new Error(`Showcase child is missing: ${prefix}*`);
  return child;
}

export function firstChild(parent: THREE.Object3D): THREE.Object3D {
  const [child] = parent.children;
  if (!child) throw new Error(`Showcase group is empty: ${parent.name}`);
  return child;
}

export function applyTextMaterial(mesh: THREE.Object3D, map: THREE.Texture, shades: Shades): void {
  const material = new MeshDefaultMaterial({ hasWater: false, alphaNode: texture(map).r, transparent: true });
  const base = material.shadedOutput;
  material.outputNode = Fn(() => vec4(mix(base.rgb, textColor(), shades.texts.uniform), base.a))();
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  if (mesh instanceof THREE.Mesh) mesh.material = material;
}

export function highlightTextMaterial(
  map: THREE.Texture,
  shades: Shades,
  highlight: THREE.UniformNode<'float', number>,
  hasLightBounce?: boolean,
): MeshDefaultMaterial {
  const white = textColor();
  const material = new MeshDefaultMaterial({
    colorNode: white,
    hasWater: false,
    hasLightBounce,
    alphaNode: texture(map).r,
    transparent: true,
  });
  const base = material.shadedOutput;
  material.outputNode = Fn(() =>
    vec4(mix(mix(base.rgb, white, shades.texts.uniform), white.mul(HIGHLIGHT_STRENGTH), highlight), base.a),
  )();
  return material;
}

export function createHoverMaterials(shades: Shades): HoverMaterials {
  const white = textColor();
  const inactive = new MeshDefaultMaterial({ colorNode: white, hasWater: false });
  const base = inactive.shadedOutput;
  inactive.outputNode = Fn(() => vec4(mix(base.rgb, textColor(), shades.texts.uniform), 1))();
  const active = new THREE.MeshBasicNodeMaterial({ transparent: true });
  active.outputNode = vec4(white.mul(HIGHLIGHT_STRENGTH), float(1));
  return { inactive, active };
}

export function configureImageTexture(map: THREE.Texture): void {
  map.colorSpace = THREE.SRGBColorSpace;
  map.flipY = false;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearFilter;
  map.generateMipmaps = false;
}

export function swingPendulum([first, second]: readonly THREE.Object3D[]): void {
  if (!first || !second) return;
  first.rotation.reorder('YXZ');
  const tween = { ease: 'power2.out', delay: PENDULUM.delay, duration: PENDULUM.duration };
  gsap.timeline({ yoyo: true, repeat: -1 }).to(first.rotation, { x: PENDULUM.angle, ...tween });
  gsap
    .timeline({ yoyo: true, repeat: -1, delay: PENDULUM.offset })
    .to(second.rotation, { x: -PENDULUM.angle, ...tween });
}
