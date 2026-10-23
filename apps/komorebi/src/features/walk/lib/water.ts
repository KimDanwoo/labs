import { WATER } from '@shared/world/water';
import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';

const SIZE = { width: 384, height: 256 };
const STILL = 'rgb(0, 128, 128)';
const EDGE_BLUR = 'blur(2px)';
const FOAM_URL = '/art/sea-foam.webp';

const channel = (value: number) => Math.round(128 + 127 * value);

/**
 * A small map of where each painting's water lies for the shader: red marks water, green and blue carry the
 * on-painting flow (scaled by its speed) around a neutral 128, so still water reads as no flow.
 */
function paintWater(region: Region) {
  const texture = canvasTexture(SIZE.width, SIZE.height, (c) => {
    c.fillStyle = STILL;
    c.fillRect(0, 0, SIZE.width, SIZE.height);
    c.filter = EDGE_BLUR;
    for (const { outline, flow, speed } of WATER[region]) {
      c.fillStyle = `rgb(255, ${channel(flow[0] * speed)}, ${channel(flow[1] * speed)})`;
      c.beginPath();
      outline.forEach(([x, z]) => c.lineTo((x / 100) * SIZE.width, (z / 100) * SIZE.height));
      c.fill();
    }
  });
  // Data, not colour: the shader must read the channels exactly as painted.
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Water maps per region, painted the first time each painting is shown, and the tiling foam the shader carries
 * along them (blank until loaded, so water simply shows no foam until then).
 */
export function createWaterMaps(loader: THREE.TextureLoader) {
  const maps = new Map<Region, THREE.Texture>();
  const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  blank.needsUpdate = true;
  const foam = { value: blank as THREE.Texture };
  let isDisposed = false;
  loader
    .loadAsync(FOAM_URL)
    .then((texture) => {
      if (isDisposed) {
        texture.dispose();
        return;
      }
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.NoColorSpace;
      foam.value = texture;
    })
    .catch(() => undefined);
  return {
    of(region: Region) {
      const map = maps.get(region) ?? paintWater(region);
      maps.set(region, map);
      return map;
    },
    /** Shared uniform for the foam texture, swapped in once it has loaded. */
    foam,
    dispose() {
      isDisposed = true;
      maps.forEach((map) => map.dispose());
      blank.dispose();
      if (foam.value !== blank) foam.value.dispose();
    },
  };
}
