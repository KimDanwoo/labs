import { WORLD_OBJECTS } from './objects';
import type { Point, Region } from './world';

type PixelPoint = readonly [number, number];
/** Ground boundaries traced on the 1536 × 1024 paintings, separate from navigation routes. */
const GROUND: Record<Region, readonly PixelPoint[][]> = {
  shops: [
    // Cleared school approach: continuous pavement across the whole left branch.
    [
      [0, 518],
      [130, 540],
      [275, 547],
      [440, 546],
      [655, 552],
      [710, 601],
      [694, 684],
      [545, 675],
      [350, 669],
      [180, 665],
      [0, 648],
    ],
    [
      [746, 310],
      [765, 272],
      [746, 240],
      [780, 238],
      [867, 264],
      [891, 306],
      [950, 430],
      [1014, 557],
      [1040, 602],
      [959, 594],
      [883, 310],
    ],
    [
      [176, 553],
      [275, 543],
      [326, 521],
      [399, 523],
      [444, 539],
      [521, 528],
      [565, 508],
      [662, 509],
      [655, 566],
      [514, 623],
      [230, 590],
    ],
    [
      [559, 488],
      [567, 452],
      [645, 446],
      [711, 418],
      [730, 365],
      [748, 359],
      [713, 480],
      [681, 528],
      [600, 529],
    ],
    [
      [948, 464],
      [1008, 464],
      [1088, 495],
      [1130, 515],
      [1183, 530],
      [1200, 564],
      [1280, 582],
      [1400, 619],
      [1536, 628],
      [1536, 671],
      [1350, 659],
      [1080, 650],
      [1010, 690],
    ],
    [
      [650, 693],
      [1037, 687],
      [1160, 1024],
      [535, 1024],
    ],
    [
      [746, 300],
      [886, 300],
      [955, 478],
      [1020, 560],
      [1180, 580],
      [1360, 620],
      [1536, 634],
      [1536, 666],
      [1300, 650],
      [1080, 650],
      [1010, 690],
      [1130, 1024],
      [565, 1024],
      [640, 710],
      [665, 678],
      [595, 645],
      [480, 630],
      [360, 602],
      [230, 590],
      [170, 580],
      [0, 587],
      [0, 554],
      [180, 550],
      [365, 543],
      [560, 520],
      [660, 490],
      [705, 402],
    ],
  ],
  village: [
    [
      [1460, 420],
      [1536, 420],
      [1536, 342],
      [1496, 333],
      [1478, 306],
      [1449, 288],
      [1410, 271],
      [1378, 258],
      [1365, 273],
      [1404, 290],
      [1425, 316],
      [1448, 340],
      [1465, 363],
    ],
    [
      [0, 327],
      [50, 322],
      [101, 322],
      [113, 339],
      [75, 352],
      [100, 376],
      [68, 386],
      [0, 371],
    ],
    [
      [183, 395],
      [202, 366],
      [242, 365],
      [268, 379],
      [248, 414],
    ],
    [
      [388, 452],
      [409, 419],
      [455, 402],
      [493, 407],
      [488, 421],
      [456, 428],
      [433, 463],
    ],
    [
      [0, 332],
      [90, 363],
      [205, 401],
      [363, 433],
      [540, 477],
      [738, 535],
      [920, 494],
      [1100, 461],
      [1248, 420],
      [1310, 415],
      [1488, 390],
      [1536, 372],
      [1536, 414],
      [1480, 431],
      [1310, 455],
      [1245, 457],
      [1090, 500],
      [960, 534],
      [830, 589],
      [829, 684],
      [870, 785],
      [990, 1024],
      [515, 1024],
      [635, 791],
      [710, 699],
      [700, 610],
      [592, 565],
      [457, 522],
      [300, 472],
      [140, 423],
      [0, 381],
    ],
  ],
  river: [
    [
      [0, 466],
      [520, 462],
      [520, 511],
      [440, 524],
      [350, 549],
      [240, 550],
      [0, 528],
    ],
    [
      [1040, 465],
      [1210, 451],
      [1536, 442],
      [1536, 549],
      [1320, 530],
      [1210, 518],
      [1080, 509],
    ],
    [
      [514, 464],
      [1046, 464],
      [1050, 522],
      [501, 520],
    ],
    [
      [280, 685],
      [443, 683],
      [422, 770],
      [389, 816],
      [371, 881],
      [350, 940],
      [330, 960],
      [290, 960],
      [255, 926],
      [233, 875],
      [207, 817],
      [244, 764],
    ],
    [
      [0, 469],
      [280, 464],
      [514, 463],
      [1045, 464],
      [1210, 452],
      [1536, 443],
      [1536, 490],
      [1210, 504],
      [1080, 506],
      [1046, 505],
      [510, 505],
      [455, 512],
      [380, 544],
      [410, 606],
      [453, 670],
      [420, 770],
      [362, 862],
      [350, 940],
      [330, 960],
      [260, 960],
      [245, 908],
      [230, 820],
      [267, 723],
      [280, 657],
      [251, 601],
      [218, 550],
      [0, 511],
    ],
  ],
  coast: [
    // Open harbour junction replaces the old guardrail and shrub bottleneck.
    [
      [240, 599],
      [280, 552],
      [345, 523],
      [399, 495],
      [464, 465],
      [551, 435],
      [623, 410],
      [655, 386],
      [683, 410],
      [675, 481],
      [704, 505],
      [765, 550],
      [840, 598],
      [902, 635],
      [900, 676],
      [720, 660],
      [480, 637],
      [300, 620],
    ],
    [
      [0, 542],
      [110, 570],
      [240, 597],
      [450, 620],
      [750, 646],
      [1030, 662],
      [1250, 672],
      [1536, 680],
      [1536, 735],
      [1030, 720],
      [745, 700],
      [475, 680],
      [245, 640],
      [110, 610],
      [0, 580],
    ],
    [
      [238, 729],
      [303, 742],
      [279, 803],
      [268, 829],
      [324, 853],
      [354, 879],
      [405, 896],
      [447, 920],
      [502, 940],
      [510, 970],
      [452, 970],
      [411, 944],
      [362, 923],
      [319, 901],
      [270, 882],
      [227, 856],
      [212, 833],
    ],
    [
      [165, 596],
      [185, 563],
      [199, 535],
      [255, 522],
      [321, 512],
      [391, 487],
      [461, 461],
      [507, 452],
      [526, 471],
      [493, 501],
      [474, 532],
      [346, 545],
      [267, 541],
      [250, 603],
    ],
    [
      [450, 471],
      [487, 446],
      [544, 429],
      [593, 421],
      [625, 407],
      [646, 385],
      [657, 353],
      [692, 353],
      [728, 341],
      [786, 329],
      [844, 315],
      [891, 318],
      [920, 327],
      [916, 338],
      [850, 353],
      [776, 372],
      [705, 391],
      [664, 424],
      [621, 445],
      [543, 457],
      [502, 477],
    ],
    [
      [0, 547],
      [110, 575],
      [245, 607],
      [475, 642],
      [745, 664],
      [1030, 681],
      [1536, 696],
      [1536, 843],
      [1270, 844],
      [1080, 837],
      [830, 814],
      [600, 792],
      [375, 765],
      [238, 749],
      [140, 692],
      [75, 655],
      [0, 608],
    ],
  ],
  forest: [
    [
      [184, 690],
      [260, 644],
      [355, 610],
      [486, 586],
      [500, 612],
      [572, 613],
      [585, 591],
      [697, 567],
      [879, 567],
      [986, 586],
      [996, 613],
      [1076, 613],
      [1086, 592],
      [1239, 593],
      [1290, 620],
      [1375, 669],
      [1452, 718],
      [1438, 771],
      [1384, 811],
      [1275, 842],
      [1120, 867],
      [975, 890],
      [629, 904],
      [450, 910],
      [257, 884],
      [223, 829],
      [208, 775],
      [169, 754],
    ],
    [
      [711, 458],
      [688, 437],
      [656, 435],
      [627, 417],
      [650, 398],
      [714, 398],
      [737, 374],
      [850, 374],
      [867, 397],
      [938, 401],
      [965, 417],
      [942, 435],
      [889, 440],
      [853, 458],
    ],
    [
      [715, 453],
      [720, 420],
      [742, 388],
      [850, 388],
      [862, 420],
      [853, 453],
      [872, 577],
      [985, 614],
      [1170, 628],
      [1390, 709],
      [1390, 795],
      [1220, 849],
      [975, 876],
      [918, 1024],
      [625, 1024],
      [653, 879],
      [450, 850],
      [242, 800],
      [212, 738],
      [246, 674],
      [422, 622],
      [665, 581],
    ],
  ],
  school: [
    [
      [158, 585],
      [265, 578],
      [282, 504],
      [348, 467],
      [433, 437],
      [420, 416],
      [463, 397],
      [617, 365],
      [710, 370],
      [727, 347],
      [861, 347],
      [869, 378],
      [1092, 393],
      [1220, 383],
      [1313, 410],
      [1365, 448],
      [1343, 506],
      [1334, 563],
      [1404, 629],
      [1536, 641],
      [1536, 674],
      [1440, 730],
      [1403, 792],
      [1288, 810],
      [1194, 842],
      [1038, 856],
      [959, 908],
      [703, 923],
      [648, 875],
      [538, 861],
      [414, 849],
      [319, 831],
      [253, 817],
      [205, 765],
      [145, 745],
      [108, 707],
      [127, 665],
      [157, 639],
    ],
    [
      [0, 606],
      [38, 631],
      [83, 654],
      [118, 672],
      [166, 675],
      [177, 710],
      [111, 714],
      [67, 698],
      [0, 730],
    ],
    [
      [272, 397],
      [310, 371],
      [348, 349],
      [370, 349],
      [366, 374],
      [389, 385],
      [421, 382],
      [458, 364],
      [500, 363],
      [550, 362],
      [619, 365],
      [611, 401],
      [461, 410],
      [417, 436],
      [399, 423],
      [389, 405],
      [367, 402],
      [350, 402],
      [329, 399],
      [315, 418],
      [295, 424],
    ],
    [
      [720, 376],
      [862, 376],
      [915, 382],
      [1050, 392],
      [1220, 388],
      [1270, 420],
      [1325, 454],
      [1325, 570],
      [1440, 650],
      [1450, 787],
      [1200, 804],
      [995, 820],
      [905, 870],
      [937, 1024],
      [694, 1024],
      [710, 873],
      [630, 827],
      [370, 816],
      [210, 746],
      [180, 661],
      [270, 626],
      [290, 547],
      [440, 460],
      [640, 429],
    ],
  ],
};

// Reject distant polygons and edges before doing exact footprint intersections.
function prepareGeometry(polygons: readonly PixelPoint[][]) {
  return polygons.map((outline) => ({
    outline,
    minX: Math.min(...outline.map(([x]) => x)),
    maxX: Math.max(...outline.map(([x]) => x)),
    minY: Math.min(...outline.map(([, y]) => y)),
    maxY: Math.max(...outline.map(([, y]) => y)),
    edges: outline.map((a, i) => {
      const b = outline[(i + 1) % outline.length]!;
      return {
        a,
        b,
        minX: Math.min(a[0], b[0]),
        maxX: Math.max(a[0], b[0]),
        minY: Math.min(a[1], b[1]),
        maxY: Math.max(a[1], b[1]),
      };
    }),
  }));
}
const GROUND_GEOMETRY = {
  village: prepareGeometry(GROUND.village),
  river: prepareGeometry(GROUND.river),
  coast: prepareGeometry(GROUND.coast),
  forest: prepareGeometry(GROUND.forest),
  school: prepareGeometry(GROUND.school),
  shops: prepareGeometry(GROUND.shops),
};
const OBJECT_GEOMETRY = WORLD_OBJECTS.map((object) => ({
  region: object.region,
  ...prepareGeometry([object.footprint])[0]!,
}));
const COLLISION_GEOMETRY = Object.fromEntries(
  Object.entries(GROUND_GEOMETRY).map(([region, shapes]) => [
    region,
    [...shapes, ...OBJECT_GEOMETRY.filter((object) => object.region === region)],
  ]),
);

function contains(outline: readonly PixelPoint[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, ay] = outline[i]!;
    const [bx, by] = outline[j]!;
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

const FOOT_SAMPLES: readonly PixelPoint[] = [
  [-13, -4],
  [0, -4],
  [13, -4],
  [-13, 0],
  [0, 0],
  [13, 0],
  [-13, 4],
  [0, 4],
  [13, 4],
];

/** Check the whole footprint, including the middle of concave corners and seams. */
export function isOnGround(x: number, z: number, region: Region) {
  const scale = Math.max(0.45, Math.min(1, (z - 15) / 70));
  return FOOT_SAMPLES.every(([dx, dy]) => {
    const px = x * 15.36 + dx * scale,
      py = z * 10.24 + dy * scale;
    if (
      OBJECT_GEOMETRY.some(
        (object) =>
          object.region === region &&
          px >= object.minX &&
          px <= object.maxX &&
          py >= object.minY &&
          py <= object.maxY &&
          contains(object.outline, px, py),
      )
    )
      return false;
    return GROUND_GEOMETRY[region].some(
      (shape) =>
        px >= shape.minX && px <= shape.maxX && py >= shape.minY && py <= shape.maxY && contains(shape.outline, px, py),
    );
  });
}

/** Check every boundary crossing, including slivers a fixed sampling interval can skip. */
export function hasGroundBetween(from: Point, to: Point, region: Region): boolean {
  const cuts = [0, 1];
  if (to.z !== from.z)
    for (const depth of [46.5, 85]) {
      const t = (depth - from.z) / (to.z - from.z);
      if (t > 0 && t < 1) cuts.push(t);
    }
  cuts.sort((a, b) => a - b);
  const at = (t: number): Point => ({ x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t });
  const foot = (p: Point, dx: number, dy: number): PixelPoint => {
    const scale = Math.max(0.45, Math.min(1, (p.z - 15) / 70));
    return [p.x * 15.36 + dx * scale, p.z * 10.24 + dy * scale];
  };
  for (let k = 1; k < cuts.length; k++) {
    const lo = cuts[k - 1]!,
      hi = cuts[k]!;
    const crossings = [lo, hi];
    for (const [dx, dy] of FOOT_SAMPLES) {
      const a = foot(at(lo), dx, dy),
        b = foot(at(hi), dx, dy);
      const vx = b[0] - a[0],
        vy = b[1] - a[1];
      const minX = Math.min(a[0], b[0]),
        maxX = Math.max(a[0], b[0]);
      const minY = Math.min(a[1], b[1]),
        maxY = Math.max(a[1], b[1]);
      for (const shape of COLLISION_GEOMETRY[region]!)
        for (const edge of shape.edges) {
          if (maxX < edge.minX || minX > edge.maxX || maxY < edge.minY || minY > edge.maxY) continue;
          const c = edge.a,
            d = edge.b;
          const wx = d[0] - c[0],
            wy = d[1] - c[1];
          const denominator = vx * wy - vy * wx;
          if (Math.abs(denominator) < 1e-10) continue;
          const cx = c[0] - a[0],
            cy = c[1] - a[1];
          const t = (cx * wy - cy * wx) / denominator;
          const u = (cx * vy - cy * vx) / denominator;
          if (t > 0 && t < 1 && u >= 0 && u <= 1) crossings.push(lo + t * (hi - lo));
        }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 1; i < crossings.length; i++) {
      const p = at((crossings[i - 1]! + crossings[i]!) / 2);
      if (!isOnGround(p.x, p.z, region)) return false;
    }
  }
  return isOnGround(from.x, from.z, region) && isOnGround(to.x, to.z, region);
}
