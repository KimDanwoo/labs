import { BufferGeometry, Float32BufferAttribute } from 'three';

export function makeBladeGeometry(segments: number): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const detail: number[] = [];
  let leaves = 2;
  if (segments === 2) leaves = 4;
  if (segments >= 3) leaves = 5;
  for (let leaf = 0; leaf < leaves; leaf += 1) {
    const angle = leaf * 1.9;
    const height = 0.32 + (Math.sin(leaf * 2.4) * 0.5 + 0.5) * 0.22;
    const offset = positions.length / 3;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const halfWidth = 0.028 * (1 - t) * (0.7 + Math.sin(t * Math.PI) * 0.6);
      const bend = (leaf === 0 ? 0.26 : 0.2) * t * t;
      for (const side of [-1, 1]) {
        const x = side * halfWidth;
        positions.push(
          x * Math.cos(angle) - bend * Math.sin(angle),
          height * t,
          -x * Math.sin(angle) - bend * Math.cos(angle),
        );
        uvs.push(side === -1 ? 0 : 1, t);
        detail.push(leaf < 2 ? 0 : 1);
      }
    }
    for (let i = 0; i < segments; i += 1) {
      const a = offset + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aDetail', new Float32BufferAttribute(detail, 1));
  geometry.setIndex(indices);
  return geometry;
}
