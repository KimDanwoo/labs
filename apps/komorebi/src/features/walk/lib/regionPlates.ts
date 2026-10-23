import { WORLDS, type Region } from '@shared/world/world';
import * as THREE from 'three';

export type RegionPlates = {
  get: (region: Region) => THREE.Texture | undefined;
  /** One shared request per region; a failed request is forgotten so a later visit can retry. */
  ensure: (region: Region) => Promise<THREE.Texture>;
  /** Loads the remaining regions one at a time so they do not compete with the first view. */
  preload: (regions: Region[]) => void;
  dispose: () => void;
};

export function preparePaintingTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export function createRegionPlates(loader: THREE.TextureLoader): RegionPlates {
  const textures = new Map<Region, THREE.Texture>();
  const requests = new Map<Region, Promise<THREE.Texture>>();
  let isDisposed = false;

  function ensure(region: Region) {
    if (isDisposed) return Promise.reject(new DOMException('Scene disposed', 'AbortError'));
    const ready = textures.get(region);
    if (ready) return Promise.resolve(ready);
    const pending = requests.get(region);
    if (pending) return pending;
    const request = loader.loadAsync(WORLDS[region].image).then(
      (texture) => {
        requests.delete(region);
        if (isDisposed) {
          texture.dispose();
          throw new DOMException('Scene disposed', 'AbortError');
        }
        textures.set(region, preparePaintingTexture(texture));
        return texture;
      },
      (error: unknown) => {
        requests.delete(region);
        throw error;
      },
    );
    requests.set(region, request);
    return request;
  }

  return {
    get: (region) => textures.get(region),
    ensure,
    preload(regions) {
      void regions.reduce<Promise<unknown>>(
        (previous, region) => previous.then(() => ensure(region).catch(() => undefined)),
        Promise.resolve(),
      );
    },
    dispose() {
      isDisposed = true;
      textures.forEach((texture) => texture.dispose());
      textures.clear();
    },
  };
}
