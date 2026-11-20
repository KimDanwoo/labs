import { ELDER_TREE } from '@views/ride/config/elderTree';

type Point = [number, number, number];

export interface TreeBranch {
  key: string;
  points: Point[];
  radius: number;
}

export interface LeafCluster {
  key: number;
  position: Point;
  tipPosition: Point;
  color: string;
}

const ROOT_ANGLE = 1.256;
const GOLDEN_ANGLE = 2.39996;
const CLUSTER_COLORS = ['#748c6a', '#9dac88'] as const;

export function rootBranches(): TreeBranch[] {
  return Array.from({ length: ELDER_TREE.rootCount }, (_, i) => {
    const a = i * ROOT_ANGLE;
    return {
      key: `root-${i}`,
      points: [
        [0, 1, 0],
        [Math.cos(a) * 2, 0.5, Math.sin(a) * 2],
        [Math.cos(a) * 4, -0.2, Math.sin(a) * 4],
      ] as Point[],
      radius: ELDER_TREE.rootRadius,
    };
  });
}

export function crownClusters(): { branches: TreeBranch[]; clusters: LeafCluster[] } {
  const clusters: LeafCluster[] = [];
  const branches: TreeBranch[] = [];
  for (let i = 0; i < ELDER_TREE.clusterCount; i++) {
    const a = i * GOLDEN_ANGLE,
      x = Math.cos(a) * (8 + (i % 3)),
      z = Math.sin(a) * (7 + (i % 4)),
      y = 13 + (i % 4);
    branches.push({
      key: `limb-${i}`,
      points: [
        [-0.5, 8 + (i % 3), 0],
        [x * 0.45, y - 2, z * 0.4],
        [x, y, z],
      ],
      radius: 0.35 + (i % 2) * 0.15,
    });
    clusters.push({
      key: i,
      position: [x, y, z],
      tipPosition: [x + 1, y + 0.9, z - 0.7],
      color: CLUSTER_COLORS[i % 2]!,
    });
  }
  return { branches, clusters };
}
