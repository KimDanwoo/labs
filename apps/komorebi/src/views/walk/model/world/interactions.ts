import { WORLD_OBJECTS } from './objects';
import { HOME_BED, HOME_DESK, HOME_WARDROBE, LANDMARKS, type Point, type Region } from './world';

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

/** Painted objects can be tapped even when their solid silhouette isn't walkable. */
export function interactionDestination(point: Point, region: Region): Point | null {
  if (region === 'home') {
    const x = point.x * 15.36;
    const y = point.z * 10.24;
    if (x >= 1075 && x <= 1260 && y >= 650 && y <= 780) return HOME_BED;
    if (x >= 558 && x <= 650 && y >= 463 && y <= 552) return HOME_DESK;
    if (x >= 1330 && x <= 1490 && y >= 290 && y <= 600) return HOME_WARDROBE;
    return null;
  }
  return (
    LANDMARKS.find((place) => place.region === region && Math.hypot(point.x - place.x, point.z - place.z) < 3) ?? null
  );
}
