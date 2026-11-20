import type { Region } from '@views/walk/model/world/world';
import { WORLDS } from '@views/walk/model/world/worlds';
import * as THREE from 'three';

type TextureSource = { loadAsync: (url: string) => Promise<THREE.Texture> };

export type RegionPlates = {
  get: (region: Region) => THREE.Texture | undefined;
  ensure: (region: Region) => Promise<THREE.Texture>;
  focus: (regions: Region[]) => void;
  dispose: () => void;
};

export function nearbyRegions(region: Region): Region[] {
  return [region, ...new Set(WORLDS[region].portals.map((portal) => portal.to))];
}

export function preparePaintingTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

const abandoned = () => new DOMException('Painting no longer needed', 'AbortError');

export function createRegionPlates(loader: TextureSource, initial: Region[]): RegionPlates {
  const textures = new Map<Region, THREE.Texture>();
  const requests = new Map<Region, Promise<THREE.Texture>>();
  let wanted = new Set(initial);
  let generation = 0;
  let isDisposed = false;

  function ensure(region: Region) {
    if (isDisposed) return Promise.reject(abandoned());
    if (!wanted.has(region)) return Promise.reject(abandoned());
    const ready = textures.get(region);
    if (ready) return Promise.resolve(ready);
    const pending = requests.get(region);
    if (pending) return pending;
    const request = loader.loadAsync(WORLDS[region].image).then(
      (texture) => {
        requests.delete(region);
        const shouldAbandon = isDisposed || !wanted.has(region);
        if (shouldAbandon) {
          texture.dispose();
          throw abandoned();
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

  async function loadInTurn(regions: Region[], queue: number) {
    for (const region of regions) {
      if (queue !== generation) return;
      await ensure(region).catch(() => undefined);
    }
  }

  return {
    get: (region) => textures.get(region),
    ensure,
    focus(regions) {
      wanted = new Set(regions);
      textures.forEach((texture, region) => {
        if (wanted.has(region)) return;
        texture.dispose();
        textures.delete(region);
      });
      generation += 1;
      void loadInTurn(regions, generation);
    },
    dispose() {
      isDisposed = true;
      generation += 1;
      textures.forEach((texture) => texture.dispose());
      textures.clear();
    },
  };
}
