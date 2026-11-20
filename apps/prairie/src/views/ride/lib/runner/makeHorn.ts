import { HORN } from '@views/ride/model/runner/constants';
import { CatmullRomCurve3, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three';

export type HornGeometry = {
  body: LatheGeometry;
  ridge: TubeGeometry;
};

const PROFILE_STEPS = 16;
const LATHE_SEGMENTS = 24;
const SPIRAL_POINTS = 100;
const SPIRAL_LENGTH = 0.96;
const SPIRAL_TURNS = 4;
const TAPER_POWER = 0.85;
const RIDGE_RADIUS = 0.005;
const RIDGE_RADIAL_SEGMENTS = 6;

export function makeHorn(): HornGeometry {
  const profile = Array.from({ length: PROFILE_STEPS + 1 }, (_, i) => {
    const t = i / PROFILE_STEPS;
    return new Vector2(HORN.radius * Math.pow(1 - t, TAPER_POWER), t * HORN.height);
  });
  const body = new LatheGeometry(profile, LATHE_SEGMENTS);
  const points = body.getAttribute('position');
  for (let i = 0; i < points.count; i += 1) {
    const t = points.getY(i) / HORN.height;
    points.setZ(i, points.getZ(i) - HORN.bend * t * t);
  }
  body.computeVertexNormals();
  const spiral = Array.from({ length: SPIRAL_POINTS }, (_, i) => {
    const t = (i / (SPIRAL_POINTS - 1)) * SPIRAL_LENGTH;
    const r = HORN.radius * Math.pow(1 - t, TAPER_POWER);
    const angle = t * Math.PI * 2 * SPIRAL_TURNS;
    return new Vector3(Math.cos(angle) * r, t * HORN.height, Math.sin(angle) * r - HORN.bend * t * t);
  });
  const ridge = new TubeGeometry(
    new CatmullRomCurve3(spiral),
    SPIRAL_POINTS,
    RIDGE_RADIUS,
    RIDGE_RADIAL_SEGMENTS,
    false,
  );
  return { body, ridge };
}
