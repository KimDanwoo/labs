import { FLORA } from '@entities/flora/model/constants';
import { ConeGeometry, CylinderGeometry, DataTexture, IcosahedronGeometry, RGBAFormat } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function makeCanopyGeometry(detail: number) {
  const base = new IcosahedronGeometry(FLORA.canopy.radius, detail);
  base.deleteAttribute('uv');
  base.deleteAttribute('normal');
  const geometry = mergeVertices(base);
  base.dispose();
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i);
    const ripple = 1 + Math.sin(x * 5 + z * 3) * Math.cos(y * 4 - z * 2) * 0.13 + Math.sin(z * 8 + y * 6) * 0.045;
    position.setXYZ(i, x * ripple, y * ripple, z * ripple);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function makeConiferGeometry() {
  const geometry = new ConeGeometry(FLORA.conifer.radius, FLORA.conifer.tierHeight, 13, 5);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const ripple = 1 + Math.sin(angle * 7 + y * 4) * 0.13 + Math.sin(angle * 11 - y * 3) * 0.07;
    position.setXYZ(i, x * ripple, y + Math.sin(angle * 5) * 0.09, z * ripple);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function makeTrunkGeometry() {
  const geometry = new CylinderGeometry(FLORA.trunk.radiusTop, FLORA.trunk.radiusBottom, 1, 9, 4);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i) + 0.5;
    position.setX(i, position.getX(i) + Math.sin(y * Math.PI) * 0.08);
    position.setZ(i, position.getZ(i) + Math.sin(y * Math.PI * 1.3) * 0.035);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function makeShadowTexture() {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const radius = Math.hypot(((x + 0.5) / size) * 2 - 1, ((y + 0.5) / size) * 2 - 1);
      const offset = (y * size + x) * 4;
      pixels.set([255, 255, 255, Math.round(Math.max(0, 1 - radius) ** 1.4 * 255)], offset);
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}
