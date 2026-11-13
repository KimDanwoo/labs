import * as THREE from 'three';
import { COAST_BOAT_OUTLINE } from '../model/world/coastBoat';
import { WATER } from '../model/world/water';
import type { Region } from '../model/world/world';
import { canvasTexture } from './art';

const SIZE = { width: 384, height: 256 };
const STILL = 'rgb(0, 128, 128)';
const BOAT_REGION: Region = 'coast';
const EDGE_BLUR = 'blur(2px)';
const FOAM_URL = '/art/sea-foam.webp';
const GLITTER_URL = '/art/sea-glitter.webp';

const channel = (value: number) => Math.round(128 + 127 * value);

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
    if (region === BOAT_REGION) {
      c.fillStyle = STILL;
      c.beginPath();
      COAST_BOAT_OUTLINE.forEach(([x, z]) => c.lineTo((x / 100) * SIZE.width, (z / 100) * SIZE.height));
      c.fill();
    }
  });
  // Data, not colour: the shader must read the channels exactly as painted.
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

export function createWaterMaps(loader: THREE.TextureLoader) {
  const maps = new Map<Region, THREE.Texture>();
  const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  blank.needsUpdate = true;
  const foam = { value: blank as THREE.Texture };
  const glitter = { value: blank as THREE.Texture };
  let isDisposed = false;
  loader
    .loadAsync(GLITTER_URL)
    .then((texture) => {
      if (isDisposed) {
        texture.dispose();
        return;
      }
      // Grayscale glint shapes, black where there is none; cells must not blur into each other.
      texture.colorSpace = THREE.NoColorSpace;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      glitter.value = texture;
    })
    .catch(() => undefined);
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
    foam,
    glitter,
    dispose() {
      isDisposed = true;
      maps.forEach((map) => map.dispose());
      blank.dispose();
      if (foam.value !== blank) foam.value.dispose();
      if (glitter.value !== blank) glitter.value.dispose();
    },
  };
}
