import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RedFormat, RepeatWrapping } from 'three';

export const SURFACE_KIND = { bark: 'bark', stone: 'stone', wool: 'wool' } as const;
type SurfaceKind = (typeof SURFACE_KIND)[keyof typeof SURFACE_KIND];

/** Small periodic relief maps add surface detail without external textures or extra geometry. */
export function makeSurfaceBump(kind: SurfaceKind) {
  const size = 64;
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2,
        v = (y / size) * Math.PI * 2;
      const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const grain = hash - Math.floor(hash);
      let height = 0.5;
      if (kind === SURFACE_KIND.bark) {
        height += Math.sin(u * 9 + Math.sin(v * 3) * 0.55) * 0.2;
        height += Math.sin(u * 21 - Math.sin(v * 5) * 0.3) * 0.1 + grain * 0.12;
      } else if (kind === SURFACE_KIND.stone) {
        height += Math.sin(u * 5 + Math.sin(v * 3)) * Math.sin(v * 7) * 0.1 + grain * 0.18;
        height -= Math.max(0, grain - 0.84) * 1.2;
      } else {
        height += Math.sin(u * 11 + Math.sin(v * 9)) * Math.sin(v * 13 + Math.sin(u * 7)) * 0.3;
      }
      data[y * size + x] = Math.round(Math.min(1, Math.max(0, height)) * 255);
    }
  }
  const texture = new DataTexture(data, size, size, RedFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
