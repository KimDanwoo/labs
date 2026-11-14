import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { type GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';

export type TextureFormat = 'texture' | 'textureKtx';

interface TextureSpec {
  kind: 'texture';
  name: string;
  path: string;
  format: TextureFormat;
  configure?: (texture: THREE.Texture) => void;
}

interface ModelSpec {
  kind: 'model';
  name: string;
  path: string;
}

export type ResourceSpec = TextureSpec | ModelSpec;
export type LoadedResource = THREE.Texture | GLTF;
export type Resources = Record<string, LoadedResource>;
export type LoadProgress = (remaining: number, total: number) => void;

export function isModel(resource: LoadedResource): resource is GLTF {
  return 'scene' in resource;
}

const BASIS_TRANSCODER_PATH = './basis/';
const DRACO_DECODER_PATH = './draco/';

export function textureResource(
  name: string,
  path: string,
  format: TextureFormat,
  configure?: (texture: THREE.Texture) => void,
): ResourceSpec {
  return { kind: 'texture', name, path, format, configure };
}

export function modelResource(name: string, path: string): ResourceSpec {
  return { kind: 'model', name, path };
}

export class ResourcesLoader {
  readonly #cache = new Map<string, LoadedResource>();
  #textureLoader: THREE.TextureLoader | null = null;
  #ktx2Loader: KTX2Loader | null = null;
  #gltfLoader: GLTFLoader | null = null;

  async load(specs: readonly ResourceSpec[], onProgress?: LoadProgress): Promise<Resources> {
    let remaining = specs.length;
    const entries = await Promise.all(
      specs.map(async (spec) => {
        const resource = await this.#loadCached(spec);
        remaining -= 1;
        onProgress?.(remaining, specs.length);
        return [spec.name, resource] as const;
      }),
    );
    return Object.fromEntries(entries);
  }

  async #loadCached(spec: ResourceSpec): Promise<LoadedResource> {
    const cached = this.#cache.get(spec.path);
    if (cached) return cached;
    const resource = await this.#loadFresh(spec);
    this.#cache.set(spec.path, resource);
    return resource;
  }

  async #loadFresh(spec: ResourceSpec): Promise<LoadedResource> {
    if (spec.kind === 'model') return this.#gltf().loadAsync(spec.path);
    const texture = await this.#textureLoaderFor(spec.format).loadAsync(spec.path);
    spec.configure?.(texture);
    return texture;
  }

  #textureLoaderFor(format: TextureFormat): THREE.TextureLoader | KTX2Loader {
    if (format === 'textureKtx') return this.#ktx2();
    this.#textureLoader ??= new THREE.TextureLoader();
    return this.#textureLoader;
  }

  #ktx2(): KTX2Loader {
    if (this.#ktx2Loader) return this.#ktx2Loader;
    const renderer = getGame().rendering.renderer;
    if (!renderer) throw new Error('Renderer is not ready for KTX2 textures');
    this.#ktx2Loader = new KTX2Loader().setTranscoderPath(BASIS_TRANSCODER_PATH).detectSupport(renderer);
    return this.#ktx2Loader;
  }

  #gltf(): GLTFLoader {
    if (this.#gltfLoader) return this.#gltfLoader;
    const draco = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
    draco.preload();
    this.#gltfLoader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(this.#ktx2());
    return this.#gltfLoader;
  }
}
