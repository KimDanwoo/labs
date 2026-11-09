import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DataTexture,
  Float32BufferAttribute,
  IcosahedronGeometry,
  MathUtils,
  RGBAFormat,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FLORA } from '../model/constants/flora';

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
    const ripple = 1 + Math.sin(x * 5 + z * 3) * Math.cos(y * 4 - z * 2) * 0.055 + Math.sin(z * 8 + y * 6) * 0.025;
    position.setXYZ(i, x * ripple, y * ripple, z * ripple);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function makeConiferGeometry() {
  const geometry = new ConeGeometry(FLORA.conifer.radius, FLORA.conifer.tierHeight, 20, 8);
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

export function makeRockGeometry(detail: number) {
  const base = new IcosahedronGeometry(FLORA.rock.radius, detail);
  const geometry = mergeVertices(base);
  base.dispose();
  const points = geometry.getAttribute('position');
  const colors: number[] = [];
  const moss = new Color('#8a9a78');
  const tint = new Color();
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      y = points.getY(i),
      z = points.getZ(i);
    const noise = Math.sin(x * 4 + z * 3) * Math.cos(y * 5 - z * 2);
    points.setXYZ(i, x * (1 + noise * 0.14), y * (1 + noise * 0.18), z * (1 + noise * 0.1));
    tint.setRGB(1, 1, 1).lerp(moss, MathUtils.smoothstep(y / FLORA.rock.radius, 0.05, 0.8) * 0.7);
    colors.push(tint.r, tint.g, tint.b);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
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
