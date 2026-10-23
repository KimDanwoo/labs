import { SHORES, type ShoreSegment } from '@shared/world/shore';
import { WATER } from '@shared/world/water';
import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';

const SIZE = { width: 384, height: 256 };
const STILL = 'rgb(0, 128, 128)';
const EDGE_BLUR = 'blur(2px)';
const SHORE_SIZE = { width: 768, height: 512 };
/** Signed distance to the shore, in square painting units, that the red channel spans either side of 0.5. */
const SHORE_REACH = 0.06;
const FOAM_URL = '/art/sea-foam.webp';

const channel = (value: number) => Math.round(128 + 127 * value);
const toByte = (value: number) => Math.round(255 * Math.max(0, Math.min(1, value)));

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

type Square = [number, number];
const toSquare = ([x, z]: [number, number]): Square => [(x / 100) * 1.5, z / 100];

/** Inverse-square falloff, in square painting units, for blending how hard nearby stretches of shore break. */
const BLEND_RADIUS = 0.03;

/**
 * Signed distance from a point to the nearest shoreline (positive out at sea), with how hard waves break there
 * blended across nearby stretches so the foam never steps where one stretch of shore meets the next.
 */
export function nearestShore(point: Square, segments: ShoreSegment[]) {
  let best = Infinity;
  let strength = 0;
  let weights = 0;
  for (const segment of segments) {
    const [ax, az] = toSquare(segment.a);
    const [bx, bz] = toSquare(segment.b);
    const [dx, dz] = [bx - ax, bz - az];
    const t = Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - az) * dz) / (dx * dx + dz * dz || 1)));
    const [qx, qz] = [point[0] - (ax + dx * t), point[1] - (az + dz * t)];
    const distance = Math.hypot(qx, qz);
    const weight = 1 / (distance * distance + BLEND_RADIUS * BLEND_RADIUS);
    strength += segment.strength * weight;
    weights += weight;
    if (distance >= Math.abs(best)) continue;
    const isSeaward = qx * segment.incoming[0] + qz * segment.incoming[1] <= 0;
    best = isSeaward ? distance : -distance;
  }
  return { distance: best, strength: strength / weights };
}

/**
 * For the shader's breaking waves: red is the signed distance to the shore around 0.5, alpha how hard waves break
 * there. Rows run bottom-up to match the painting's UVs.
 */
function paintShore(region: Region) {
  const segments = SHORES[region];
  if (!segments) {
    const calm = new THREE.DataTexture(new Uint8Array([255, 0, 0, 0]), 1, 1);
    calm.needsUpdate = true;
    return calm;
  }
  const { width, height } = SHORE_SIZE;
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const point: Square = [((column + 0.5) / width) * 1.5, 1 - (row + 0.5) / height];
      const { distance, strength } = nearestShore(point, segments);
      const i = (row * width + column) * 4;
      data[i] = toByte(0.5 + distance / (2 * SHORE_REACH));
      data[i + 3] = toByte(strength);
    }
  }
  const texture = new THREE.DataTexture(data, width, height);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const cached = <T extends THREE.Texture>(paint: (region: Region) => T) => {
  const maps = new Map<Region, T>();
  return {
    of(region: Region) {
      const map = maps.get(region) ?? paint(region);
      maps.set(region, map);
      return map;
    },
    dispose: () => maps.forEach((map) => map.dispose()),
  };
};

/**
 * Water and shore maps per region, painted the first time each painting is shown, and the tiling foam the shader
 * carries along them (blank until loaded, so water simply shows no foam until then).
 */
export function createWaterMaps(loader: THREE.TextureLoader) {
  const water = cached(paintWater);
  const shores = cached(paintShore);
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
    of: water.of,
    shoreOf: shores.of,
    /** Shared uniform for the foam texture, swapped in once it has loaded. */
    foam,
    dispose() {
      isDisposed = true;
      water.dispose();
      shores.dispose();
      blank.dispose();
      if (foam.value !== blank) foam.value.dispose();
    },
  };
}
