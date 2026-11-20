import { float, Fn, luminance, mix, texture, uniform, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial, revealNode } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';

type ConvertibleMaterial = THREE.MeshStandardMaterial | THREE.MeshLambertNodeMaterial;

interface EmissiveGradientOptions {
  inner: THREE.ColorRepresentation;
  outer: THREE.ColorRepresentation;
  intensity: number;
  isNormalized: boolean;
}

const EMISSIVE_GRADIENTS: Record<string, EmissiveGradientOptions> = {
  emissiveOrangeRadialGradient: { inner: '#ff8641', outer: '#ff3e00', intensity: 1.7, isNormalized: true },
  emissivePurpleRadialGradient: { inner: '#454bbc', outer: '#ff2eb4', intensity: 1.7, isNormalized: true },
  emissiveBlueRadialGradient: { inner: '#91f0ff', outer: '#128fff', intensity: 1.7, isNormalized: true },
  emissiveGreenRadialGradient: { inner: '#f8ffa6', outer: '#74ff00', intensity: 1.5, isNormalized: true },
  emissiveWhiteRadialGradient: { inner: '#ffffff', outer: '#666666', intensity: 2.7, isNormalized: false },
};
const RED_GRADIENT = { name: 'redGradient', top: '#ff3a3a', bottom: '#721551' } as const;
const TRAIL_GRADIENT = [
  { stop: 0, value: '#ffb646' },
  { stop: 0.5, value: '#ff347e' },
  { stop: 1, value: '#01005f' },
] as const;
const TRAIL_GRADIENT_HEIGHT = 16;
const RADIAL_GRADIENT_SCALE = 2;
const LABEL_MATERIALS = new Set(['projectsLabels', 'blackboardLabels']);

function trailGradientTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = TRAIL_GRADIENT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  const gradient = context.createLinearGradient(0, 0, 0, TRAIL_GRADIENT_HEIGHT);
  for (const { stop, value } of TRAIL_GRADIENT) gradient.addColorStop(stop, value);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, TRAIL_GRADIENT_HEIGHT);
  const result = new THREE.Texture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.needsUpdate = true;
  return result;
}

function isConvertible(material: THREE.Material): material is ConvertibleMaterial {
  return material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshLambertNodeMaterial;
}

function isPreserved(material: THREE.Material): boolean {
  return Boolean(material.userData.prevent);
}

function baseAlpha({ alphaMap, opacity }: ConvertibleMaterial): THREE.Node<'float'> {
  return alphaMap ? texture(alphaMap).r : float(opacity);
}

function convert(base: ConvertibleMaterial): MeshDefaultMaterial {
  const { map } = base;
  const isLabel = LABEL_MATERIALS.has(base.name) && map !== null;
  const colorNode = map ? texture(map).rgb : vec3(base.color.r, base.color.g, base.color.b);
  const alphaNode = isLabel ? texture(map).r : baseAlpha(base);
  const material = new MeshDefaultMaterial({ colorNode, alphaNode, transparent: isLabel || base.transparent });
  material.name = base.name;
  material.premultipliedAlpha = isLabel;
  material.map = map;
  return material;
}

const PALETTE = 'palette';

export class Materials {
  readonly trailGradient = trailGradientTexture();
  readonly #named = new Map<string, THREE.Material>();
  readonly #unnamed = new WeakMap<THREE.Material, THREE.Material>();
  readonly #emissiveOutputs = new Map<string, THREE.Node<'vec4'>>();

  constructor() {
    const palette = new MeshDefaultMaterial({ colorNode: texture(getGame().texture('paletteTexture')).rgb });
    palette.name = PALETTE;
    this.#named.set(PALETTE, palette);
    for (const [name, options] of Object.entries(EMISSIVE_GRADIENTS)) this.emissiveGradient(name, options);
    this.createGradient(RED_GRADIENT.name, RED_GRADIENT.top, RED_GRADIENT.bottom);
  }

  has(name: string): boolean {
    return this.#named.has(name);
  }

  get(name: string): THREE.Material {
    const material = this.#named.get(name);
    if (!material) throw new Error(`Unknown material: ${name}`);
    return material;
  }

  emissiveGradient(name: string, { inner, outer, intensity, isNormalized }: EmissiveGradientOptions): THREE.Material {
    const existing = this.#named.get(name);
    if (existing) return existing;

    const gradient = mix(
      uniform(new THREE.Color(inner)),
      uniform(new THREE.Color(outer)),
      uv().sub(0.5).length().mul(RADIAL_GRADIENT_SCALE),
    );
    const baseColor = isNormalized ? gradient.div(luminance(gradient)) : gradient;
    const intensityUniform = uniform(intensity);
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
    material.name = name;
    const outputNode = Fn(() => vec4(revealNode(baseColor.mul(intensityUniform)), 1))();
    material.outputNode = outputNode;
    this.#emissiveOutputs.set(name, outputNode);
    material.fog = false;
    this.#named.set(name, material);
    return material;
  }

  emissiveOutput(name: string): THREE.Node<'vec4'> {
    const output = this.#emissiveOutputs.get(name);
    if (!output) throw new Error(`Unknown emissive material: ${name}`);
    return output;
  }

  createGradient(name: string, top: THREE.ColorRepresentation, bottom: THREE.ColorRepresentation): THREE.Material {
    const colorNode = mix(uniform(new THREE.Color(top)), uniform(new THREE.Color(bottom)), uv().y);
    const material = new MeshDefaultMaterial({ colorNode });
    material.name = name;
    this.#named.set(name, material);
    return material;
  }

  resolve(base: THREE.Material): THREE.Material {
    if (!base.name) return this.#resolveUnnamed(base);
    const existing = this.#named.get(base.name);
    if (existing) return existing;
    const material = isConvertible(base) ? convert(base) : base;
    this.#named.set(base.name, material);
    return material;
  }

  #resolveUnnamed(base: THREE.Material): THREE.Material {
    const known = this.#unnamed.get(base);
    if (known) return known;
    const material = isConvertible(base) ? convert(base) : base;
    this.#unnamed.set(base, material);
    this.#unnamed.set(material, material);
    return material;
  }

  updateObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (child.material instanceof THREE.Material && !isPreserved(child.material)) {
        child.material = this.resolve(child.material);
      }
    });
  }
}
