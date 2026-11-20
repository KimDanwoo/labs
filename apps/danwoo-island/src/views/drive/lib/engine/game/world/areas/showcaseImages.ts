import gsap from 'gsap';
import { color, Fn, If, mix, step, texture, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import {
  configureImageTexture,
  type Direction,
  type Shades,
} from '@views/drive/lib/engine/game/world/areas/showcaseVisuals';

type ImageResource = { status: 'loading' } | { status: 'loaded'; texture: THREE.Texture };

interface SlideTextures {
  readonly previous: THREE.Texture;
  readonly current: THREE.Texture;
}

interface ShowcaseImagesOptions {
  readonly mesh: THREE.Object3D;
  readonly shades: Shades;
  readonly currentKey: () => string;
  readonly siblingKey: () => string;
}

const IMAGE_ROOT = 'danwoo';
const PLACEHOLDER_COLOR = '#333333';
const SLIDE_SHIFT = 0.25;
const FADE_IN_DURATION = 1;
const SLIDE = { duration: 1, ease: 'power2.inOut' } as const;

export class ShowcaseImages {
  readonly #mesh: THREE.Object3D;
  readonly #shades: Shades;
  readonly #currentKey: () => string;
  readonly #siblingKey: () => string;
  readonly #resources = new Map<string, ImageResource>();
  readonly #loadProgress = uniform(0);
  readonly #slideProgress = uniform(0);
  readonly #slideDirection = uniform(0);
  #textures: SlideTextures | null = null;

  constructor({ mesh, shades, currentKey, siblingKey }: ShowcaseImagesOptions) {
    this.#mesh = mesh;
    this.#shades = shades;
    this.#currentKey = currentKey;
    this.#siblingKey = siblingKey;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.visible = false;
  }

  #createMaterial(textures: SlideTextures): MeshDefaultMaterial {
    const progress = this.#slideProgress;
    const direction = this.#slideDirection;
    const colorNode = Fn(() => {
      const previousUv = uv().toVar();
      const currentUv = uv().toVar();
      currentUv.x.addAssign(progress.oneMinus().mul(-SLIDE_SHIFT).mul(direction));
      previousUv.x.addAssign(progress.mul(SLIDE_SHIFT).mul(direction));
      const previousColor = texture(textures.previous, previousUv).rgb;
      const currentColor = texture(textures.current, currentUv).rgb;
      currentColor.assign(mix(color(PLACEHOLDER_COLOR), currentColor, this.#loadProgress));
      const reveal = uv().x.toVar();
      If(direction.greaterThan(0), () => {
        reveal.assign(reveal.oneMinus());
      });
      return mix(currentColor, previousColor, step(progress, reveal));
    })();
    const material = new MeshDefaultMaterial({ colorNode, hasWater: false });
    const base = material.shadedOutput;
    material.outputNode = Fn(() => vec4(mix(base.rgb, colorNode, this.#shades.images.uniform), base.a))();
    return material;
  }

  #init(loaded: THREE.Texture): SlideTextures {
    const textures = { previous: loaded.clone(), current: loaded.clone() };
    this.#textures = textures;
    this.#mesh.visible = true;
    if (this.#mesh instanceof THREE.Mesh) this.#mesh.material = this.#createMaterial(textures);
    return textures;
  }

  #onLoaded(key: string, loaded: THREE.Texture): void {
    const textures = this.#textures ?? this.#init(loaded);
    if (this.#currentKey() !== key) return;
    textures.current.copy(loaded);
    textures.current.needsUpdate = true;
    gsap.to(this.#loadProgress, { value: 1, duration: FADE_IN_DURATION, overwrite: true });
    this.#load(this.#siblingKey());
  }

  #load(key: string): ImageResource {
    const cached = this.#resources.get(key);
    if (cached) return cached;
    const resource: ImageResource = { status: 'loading' };
    new THREE.TextureLoader().load(`${IMAGE_ROOT}/${key}`, (loaded) => {
      configureImageTexture(loaded);
      this.#resources.set(key, { status: 'loaded', texture: loaded });
      this.#onLoaded(key, loaded);
    });
    this.#resources.set(key, resource);
    return resource;
  }

  update(direction: Direction): void {
    const resource = this.#load(this.#currentKey());
    if (resource.status === 'loaded') this.#load(this.#siblingKey());
    this.#loadProgress.value = resource.status === 'loaded' ? 1 : 0;

    const textures = this.#textures;
    if (textures) {
      textures.previous.copy(textures.current);
      textures.previous.needsUpdate = true;
      if (resource.status === 'loaded') {
        textures.current.copy(resource.texture);
        textures.current.needsUpdate = true;
      }
    }

    gsap.fromTo(this.#slideProgress, { value: 0 }, { value: 1, ...SLIDE, overwrite: true });
    this.#slideDirection.value = direction === 'next' ? 1 : -1;
  }
}
