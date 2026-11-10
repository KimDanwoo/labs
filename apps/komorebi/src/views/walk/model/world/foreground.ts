import { WORLD_OBJECTS } from './objects';
import type { Point, Region } from './world';

type PixelPoint = readonly [number, number];
type Baseline = readonly [PixelPoint, PixelPoint];

/** Match occlusion to the object's ground contact, including sloping fences. */
export type Foreground = { region: Region; baseline: Baseline; outline: [number, number][] };
export const FOREGROUNDS: Foreground[] = [];
const polygon = (region: Region, baseline: number | Baseline, outline: [number, number][]) =>
  FOREGROUNDS.push({
    region,
    baseline:
      typeof baseline === 'number'
        ? [
            [0, baseline],
            [1536, baseline],
          ]
        : baseline,
    outline,
  });
const rail = (region: Region, baseline: Baseline, x1: number, y1: number, x2: number, y2: number, thickness: number) =>
  polygon(region, baseline, [
    [x1, y1],
    [x2, y2],
    [x2, y2 + thickness],
    [x1, y1 + thickness],
  ]);

export function isForegroundInFront(layer: Foreground, position: Point, region: Region) {
  if (layer.region !== region) return false;
  const [[x1, y1], [x2, y2]] = layer.baseline;
  const x = position.x * 15.36;
  const t = x2 === x1 ? 0 : Math.max(0, Math.min(1, (x - x1) / (x2 - x1)));
  const groundY = y1 + (y2 - y1) * t;
  // Use grounded feet, never head height or the animated jump position.
  return position.z * 10.24 < groundY;
}

/** Something standing in the painting, with the render order its sprite draws at. */
export type Walker = Point & { order: number };
const LIFT = 0.05;

/**
 * Render order for a foreground layer: just above everyone standing behind it, so it still draws under anyone in
 * front (nearer walkers always carry a higher order). Null when it hides nobody and need not draw at all.
 */
export function foregroundOrder(layer: Foreground, walkers: Walker[], region: Region): number | null {
  const hidden = walkers.filter((walker) => isForegroundInFront(layer, walker, region));
  if (hidden.length === 0) return null;
  return Math.max(...hidden.map((walker) => walker.order)) + LIFT;
}

for (const object of WORLD_OBJECTS) polygon(object.region, object.groundY, object.outline);

// River bridge: front handrail, lower beam, and individual posts.
rail(
  'river',
  [
    [474, 544],
    [1080, 544],
  ],
  474,
  490,
  1080,
  493,
  10,
);
rail(
  'river',
  [
    [474, 544],
    [1080, 544],
  ],
  477,
  519,
  1063,
  523,
  7,
);
for (const [x, y, width] of [
  [466, 485, 17],
  [596, 488, 15],
  [708, 488, 15],
  [828, 489, 14],
  [1048, 488, 16],
])
  polygon('river', 544, [
    [x!, y!],
    [x! + width!, y!],
    [x! + width!, 544],
    [x!, 544],
  ]);
rail(
  'river',
  [
    [1096, 536],
    [1215, 558],
  ],
  1096,
  492,
  1215,
  521,
  9,
);
rail(
  'river',
  [
    [389, 542],
    [450, 523],
  ],
  389,
  500,
  450,
  479,
  9,
);
polygon('river', 536, [
  [1091, 481],
  [1106, 483],
  [1103, 536],
  [1089, 534],
]);
polygon('river', 542, [
  [382, 501],
  [395, 500],
  [397, 539],
  [382, 542],
]);

// Village bridge slopes away from the camera.
rail(
  'village',
  [
    [1314, 456],
    [1473, 431],
  ],
  1298,
  413,
  1482,
  384,
  9,
);
rail(
  'village',
  [
    [1314, 456],
    [1473, 431],
  ],
  1317,
  443,
  1470,
  417,
  7,
);
for (const [x, y, bottom] of [
  [1314, 408, 456],
  [1387, 397, 445],
  [1464, 383, 431],
])
  polygon('village', bottom! + 2, [
    [x!, y!],
    [x! + 9, y! - 1],
    [x! + 9, bottom!],
    [x!, bottom! + 2],
  ]);
// Foreground garden fence along the left fork.
rail(
  'village',
  [
    [154, 471],
    [538, 604],
  ],
  154,
  421,
  538,
  553,
  9,
);
for (const [x, y, bottom] of [
  [151, 414, 471],
  [305, 468, 534],
  [457, 517, 582],
  [526, 541, 604],
])
  polygon('village', bottom!, [
    [x!, y!],
    [x! + 10, y! + 2],
    [x! + 10, bottom!],
    [x!, bottom!],
  ]);

// Stone lanterns beside the shrine approach.
for (const x of [490, 993])
  polygon('forest', 603, [
    [x, 603],
    [x + 80, 603],
    [x + 75, 575],
    [x + 53, 566],
    [x + 52, 531],
    [x + 68, 522],
    [x + 68, 511],
    [x + 60, 511],
    [x + 60, 489],
    [x + 77, 487],
    [x + 76, 475],
    [x + 51, 457],
    [x + 50, 441],
    [x + 40, 435],
    [x + 31, 446],
    [x + 31, 459],
    [x + 7, 475],
    [x + 4, 486],
    [x + 23, 491],
    [x + 23, 512],
    [x + 13, 513],
    [x + 15, 527],
    [x + 32, 532],
    [x + 30, 566],
    [x + 8, 577],
  ]);

// Only the seafront stretch remains; the harbour junction is completely open.
rail(
  'coast',
  [
    [956, 627],
    [1403, 649],
  ],
  965,
  566,
  1536,
  584,
  33,
);
for (const [x, y] of [
  [945, 552],
  [1148, 566],
  [1392, 574],
]) {
  polygon('coast', y! + 75, [
    [x!, y!],
    [x! + 23, y! + 2],
    [x! + 19, y! + 75],
    [x! - 2, y! + 73],
  ]);
}
