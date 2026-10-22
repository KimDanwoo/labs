import type { Region } from './world';

type WorldObject = {
  id: string;
  region: Region;
  groundY: number;
  footprint: [number, number][];
  outline: [number, number][];
};

/** Separate the solid base from the visible silhouette of each painted object. */
export const WORLD_OBJECTS: WorldObject[] = [
  {
    id: 'shrine-gate-left',
    region: 'forest',
    groundY: 442,
    footprint: [
      [680, 418],
      [709, 418],
      [709, 442],
      [680, 442],
    ],
    outline: [
      [694, 230],
      [713, 231],
      [704, 414],
      [709, 421],
      [706, 442],
      [680, 442],
      [683, 416],
    ],
  },
  {
    id: 'shrine-gate-right',
    region: 'forest',
    groundY: 442,
    footprint: [
      [870, 418],
      [897, 418],
      [897, 442],
      [870, 442],
    ],
    outline: [
      [871, 231],
      [889, 230],
      [891, 415],
      [897, 421],
      [894, 442],
      [870, 442],
      [871, 415],
    ],
  },
];
