import { LANDMARKS } from '../../model/exploration/world';
import { terrainHeightAt } from '../scene/terrain';

type Point = [number, number, number];

export interface GardenColumnSpec {
  key: number;
  position: Point;
  rotation: Point;
  height: number;
  vine: number[][];
}

const COLUMN_COUNT = 8;
const COLUMN_RADIUS = 11;
const VINE_POINTS = 14;
const VINE_STEP = 0.65;
const VINE_RADIUS = 0.95;

export function gardenColumns(): GardenColumnSpec[] {
  const place = LANDMARKS[1];
  return Array.from({ length: COLUMN_COUNT }, (_, i) => {
    const a = (i * Math.PI) / (COLUMN_COUNT / 2),
      x = Math.cos(a) * COLUMN_RADIUS,
      z = Math.sin(a) * COLUMN_RADIUS,
      height = 2.5 + (i % 3);
    return {
      key: i,
      position: [x, terrainHeightAt(place.x + x, place.z + z) - terrainHeightAt(place.x, place.z), z],
      rotation: [0, a, i % 2 ? 0.08 : -0.04],
      height,
      vine: Array.from({ length: VINE_POINTS }, (_, j) => [
        Math.cos(j * VINE_STEP) * VINE_RADIUS,
        (j * height) / VINE_POINTS,
        Math.sin(j * VINE_STEP) * VINE_RADIUS,
      ]),
    };
  });
}
