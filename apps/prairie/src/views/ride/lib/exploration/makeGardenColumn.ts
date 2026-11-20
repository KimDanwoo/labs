import { LatheGeometry, Vector2 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type ColumnGeometry = { shaft: LatheGeometry; cap: RoundedBoxGeometry };

const LATHE_SEGMENTS = 32;
const FLUTE_COUNT = 8;
const FLUTE_DEPTH = 0.035;

export function makeGardenColumn(height: number): ColumnGeometry {
  const shaft = new LatheGeometry(
    [
      new Vector2(1, 0),
      new Vector2(1, 0.15),
      new Vector2(0.86, 0.25),
      new Vector2(0.74, 0.4),
      new Vector2(0.67, height - 0.5),
      new Vector2(0.8, height - 0.35),
      new Vector2(0.94, height - 0.25),
      new Vector2(0.94, height),
    ],
    LATHE_SEGMENTS,
  );
  const points = shaft.getAttribute('position');
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      y = points.getY(i),
      z = points.getZ(i);
    const flute = 1 - Math.sin(Math.atan2(z, x) * FLUTE_COUNT) ** 2 * FLUTE_DEPTH * Math.sin((y / height) * Math.PI);
    points.setXYZ(i, x * flute, y, z * flute);
  }
  shaft.computeVertexNormals();
  return { shaft, cap: new RoundedBoxGeometry(1.9, 0.35, 1.8, 2, 0.09) };
}
