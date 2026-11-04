import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

/** Folded leaf diamonds share one geometry and remain batchable across the forest. */
export function makeLeafCanopy(radius: number, leaves: number): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const normal = new Vector3();
  const across = new Vector3();
  const along = new Vector3();
  const up = new Vector3(0, 1, 0);
  const hash = (n: number) => {
    const value = Math.sin(n * 127.1 + 43.7) * 43758.5453;
    return value - Math.floor(value);
  };
  for (let i = 0; i < leaves; i++) {
    const y = 1 - (2 * (i + 0.5)) / leaves;
    const angle = i * 2.39996323;
    const ring = Math.sqrt(1 - y * y);
    const shell = radius * (0.48 + hash(i + 4) * 0.52);
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    normal.set(x, y * 0.45 + 0.6, z).normalize();
    across.crossVectors(up, normal).normalize();
    along.crossVectors(normal, across).normalize();
    const size = radius * (0.24 + hash(i + 13) * 0.19);
    const corners = [
      [-1, 0, 0],
      [0, -0.42, 0],
      [1, 0, 0],
      [0, 0.42, 0],
      [0, 0, 0.12],
    ] as const;
    const tint = 0.76 + hash(i + 9) * 0.24;
    for (const vertex of [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]) {
      const corner = corners[vertex]!;
      positions.push(
        x * shell + (across.x * corner[0] + along.x * corner[1] + normal.x * corner[2]) * size,
        y * shell + (across.y * corner[0] + along.y * corner[1] + normal.y * corner[2]) * size,
        z * shell + (across.z * corner[0] + along.z * corner[1] + normal.z * corner[2]) * size,
      );
      colors.push(tint, tint, tint * 0.94);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
