import { WORLD_OBJECTS } from './objects';
import { CLASSROOM_BOARD, HOME_BED, HOME_DESK, HOME_WARDROBE, LANDMARKS, type Point, type Region } from './world';

const futon = WORLD_OBJECTS.find((object) => object.id === 'home-futon')!;
/** Reach the quilt from any side, rather than only one invisible spot beside its foot. */
export function isNearHomeBed(point: Point, reach = 3.5) {
  if (Math.hypot(point.x - HOME_BED.x, point.z - HOME_BED.z) < reach + 1) return true;
  return futon.footprint.some(([x, y], i) => {
    const [nx, ny] = futon.footprint[(i + 1) % futon.footprint.length]!;
    const a = { x: x / 15.36, z: y / 10.24 };
    const dx = nx / 15.36 - a.x;
    const dz = ny / 10.24 - a.z;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(point.x - a.x - dx * t, point.z - a.z - dz * t) < reach;
  });
}

export const isAtHomeBed = (point: Point) => isNearHomeBed(point, 1.2);

type PaintedTarget = { left: number; top: number; right: number; bottom: number; destination: Point };
const classroomShelf = LANDMARKS.find((place) => place.id === 'classroom')!;
/** Painted furniture, in painting pixels, and the floor spot to walk to when it is tapped. */
const PAINTED_TARGETS: Partial<Record<Region, PaintedTarget[]>> = {
  home: [
    { left: 1075, top: 650, right: 1260, bottom: 780, destination: HOME_BED },
    { left: 558, top: 463, right: 650, bottom: 552, destination: HOME_DESK },
    { left: 1330, top: 290, right: 1490, bottom: 600, destination: HOME_WARDROBE },
  ],
  classroom: [
    { left: 442, top: 255, right: 1097, bottom: 462, destination: CLASSROOM_BOARD },
    { left: 1137, top: 470, right: 1297, bottom: 575, destination: classroomShelf },
  ],
};

/** Painted objects can be tapped even when their solid silhouette isn't walkable. */
export function interactionDestination(point: Point, region: Region): Point | null {
  const x = point.x * 15.36;
  const y = point.z * 10.24;
  const painted = PAINTED_TARGETS[region]?.find(
    (target) => x >= target.left && x <= target.right && y >= target.top && y <= target.bottom,
  );
  if (painted) return painted.destination;
  return (
    LANDMARKS.find((place) => place.region === region && Math.hypot(point.x - place.x, point.z - place.z) < 3) ?? null
  );
}
