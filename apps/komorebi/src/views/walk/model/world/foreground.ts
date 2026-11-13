import { WORLD_OBJECTS } from './objects';
import type { Point, Region } from './world';

type PixelPoint = readonly [number, number];
type Baseline = readonly [PixelPoint, PixelPoint];

export type Foreground = {
  region: Region;
  baseline: Baseline;
  outline: [number, number][];
  pieces?: [number, number][][];
};
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

export type Walker = Point & { order: number };
const LIFT = 0.05;

export function foregroundOrder(layer: Foreground, walkers: Walker[], region: Region): number | null {
  const hidden = walkers.filter((walker) => isForegroundInFront(layer, walker, region));
  if (hidden.length === 0) return null;
  const behind = Math.max(...hidden.map((walker) => walker.order));
  const inFront = walkers.filter((walker) => !isForegroundInFront(layer, walker, region)).map((walker) => walker.order);
  const nearestFront = Math.min(...inFront);
  const gap = nearestFront - behind;
  return behind + (gap > 0 ? Math.min(LIFT, gap / 2) : LIFT);
}

for (const object of WORLD_OBJECTS) polygon(object.region, object.groundY, object.outline);

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

function classroomFurniture(groundY: number, pieces: [number, number][][]): void {
  const points = pieces.flat();
  const left = Math.min(...points.map(([x]) => x));
  const right = Math.max(...points.map(([x]) => x));
  const top = Math.min(...points.map(([, y]) => y));
  const bottom = Math.max(...points.map(([, y]) => y));
  FOREGROUNDS.push({
    region: 'classroom',
    baseline: [
      [0, groundY],
      [1536, groundY],
    ],
    outline: [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom],
    ],
    pieces,
  });
}

classroomFurniture(715, [
  [
    [220, 579],
    [425, 570],
    [451, 575],
    [428, 598],
    [428, 617],
    [220, 616],
  ],
  [
    [224, 612],
    [235, 613],
    [234, 707],
    [224, 713],
  ],
  [
    [420, 610],
    [431, 605],
    [430, 697],
    [420, 703],
  ],
  [
    [286, 586],
    [369, 586],
    [377, 594],
    [377, 645],
    [286, 645],
  ],
  [
    [283, 643],
    [365, 641],
    [388, 659],
    [310, 676],
  ],
  [
    [293, 671],
    [303, 674],
    [300, 713],
    [289, 715],
  ],
  [
    [371, 666],
    [382, 662],
    [380, 708],
    [369, 713],
  ],
]);
classroomFurniture(800, [
  [
    [130, 627],
    [302, 611],
    [388, 617],
    [363, 645],
    [361, 668],
    [134, 665],
  ],
  [
    [140, 665],
    [149, 665],
    [149, 756],
    [142, 765],
  ],
  [
    [346, 660],
    [359, 657],
    [357, 790],
    [346, 798],
  ],
  [
    [189, 638],
    [202, 632],
    [287, 632],
    [299, 642],
    [299, 689],
    [190, 690],
  ],
  [
    [201, 714],
    [278, 708],
    [309, 727],
    [232, 749],
  ],
  [
    [198, 739],
    [208, 740],
    [207, 797],
    [198, 800],
  ],
  [
    [288, 738],
    [299, 735],
    [297, 797],
    [288, 800],
  ],
]);
classroomFurniture(900, [
  [
    [14, 692],
    [215, 664],
    [303, 679],
    [271, 711],
    [272, 740],
    [15, 730],
  ],
  [
    [27, 729],
    [40, 731],
    [40, 889],
    [27, 896],
  ],
  [
    [250, 741],
    [265, 737],
    [263, 894],
    [250, 899],
  ],
  [
    [286, 711],
    [301, 706],
    [298, 856],
    [286, 861],
  ],
]);
classroomFurniture(918, [
  [
    [72, 710],
    [84, 699],
    [190, 697],
    [202, 714],
    [201, 770],
    [73, 769],
  ],
  [
    [80, 778],
    [179, 766],
    [237, 783],
    [204, 809],
    [84, 804],
  ],
  [
    [74, 805],
    [85, 805],
    [84, 912],
    [73, 915],
  ],
  [
    [198, 809],
    [210, 807],
    [209, 914],
    [198, 918],
  ],
  [
    [232, 806],
    [243, 802],
    [242, 873],
    [232, 878],
  ],
]);
classroomFurniture(716, [
  [
    [1086, 574],
    [1285, 570],
    [1314, 590],
    [1110, 600],
    [1113, 622],
    [1095, 610],
  ],
  [
    [1097, 600],
    [1105, 604],
    [1104, 694],
    [1096, 697],
  ],
  [
    [1117, 615],
    [1127, 618],
    [1126, 713],
    [1116, 716],
  ],
  [
    [1293, 601],
    [1303, 599],
    [1302, 697],
    [1293, 701],
  ],
  [
    [1158, 597],
    [1170, 585],
    [1238, 585],
    [1250, 596],
    [1250, 640],
    [1158, 640],
  ],
  [
    [1165, 645],
    [1236, 640],
    [1270, 660],
    [1190, 675],
  ],
  [
    [1168, 670],
    [1178, 673],
    [1177, 711],
    [1167, 715],
  ],
  [
    [1255, 666],
    [1265, 663],
    [1263, 712],
    [1254, 716],
  ],
]);
classroomFurniture(800, [
  [
    [1153, 622],
    [1335, 612],
    [1405, 636],
    [1180, 651],
    [1184, 676],
    [1160, 667],
  ],
  [
    [1160, 645],
    [1170, 649],
    [1169, 762],
    [1159, 767],
  ],
  [
    [1185, 674],
    [1196, 678],
    [1194, 793],
    [1183, 800],
  ],
  [
    [1383, 650],
    [1396, 646],
    [1394, 757],
    [1383, 765],
  ],
  [
    [1240, 645],
    [1252, 634],
    [1332, 634],
    [1344, 646],
    [1344, 690],
    [1240, 690],
  ],
  [
    [1238, 714],
    [1325, 708],
    [1370, 729],
    [1281, 749],
  ],
  [
    [1246, 744],
    [1257, 745],
    [1256, 796],
    [1246, 800],
  ],
  [
    [1344, 743],
    [1356, 740],
    [1354, 797],
    [1344, 800],
  ],
]);
classroomFurniture(903, [
  [
    [1231, 672],
    [1450, 665],
    [1522, 695],
    [1261, 712],
    [1266, 741],
    [1244, 729],
  ],
  [
    [1241, 718],
    [1253, 722],
    [1251, 857],
    [1240, 863],
  ],
  [
    [1268, 742],
    [1280, 745],
    [1277, 897],
    [1266, 903],
  ],
  [
    [1493, 716],
    [1506, 712],
    [1503, 890],
    [1492, 896],
  ],
]);
classroomFurniture(918, [
  [
    [1344, 711],
    [1357, 699],
    [1454, 698],
    [1468, 712],
    [1465, 768],
    [1344, 769],
  ],
  [
    [1303, 779],
    [1392, 770],
    [1430, 789],
    [1407, 808],
    [1310, 803],
  ],
  [
    [1311, 802],
    [1323, 805],
    [1320, 897],
    [1309, 904],
  ],
  [
    [1343, 809],
    [1355, 810],
    [1353, 915],
    [1342, 918],
  ],
  [
    [1460, 790],
    [1471, 788],
    [1470, 914],
    [1459, 918],
  ],
]);
