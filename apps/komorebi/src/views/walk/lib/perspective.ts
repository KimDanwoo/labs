const FARTHEST = 0.12;
const NEAREST = 0.65;
/** How large the child (and the animals sized against them) stand over the painting's perspective. */
export const CHILD_SIZE = 2.1;

/** Painted-map depth runs from the distant top (0) to the foreground (100). */
export function characterScale(depth: number) {
  const distanceFromHorizon = Math.max(0, Math.min(1, (depth - 12) / 88));
  return FARTHEST + distanceFromHorizon * (NEAREST - FARTHEST);
}

const SCENE_HALF_WIDTH = 60;
const SCENE_HALF_HEIGHT = 40;
const SCENE_SCALE_X = 1.2;
const SCENE_SCALE_Z = 0.8;

/** World x (0–100 across the painting) to the scene plane's x, centred on the origin. */
export const sceneX = (x: number) => x * SCENE_SCALE_X - SCENE_HALF_WIDTH;
/** World depth (0 at the horizon) to the scene plane's y, which grows upward. */
export const sceneY = (z: number) => SCENE_HALF_HEIGHT - z * SCENE_SCALE_Z;
export const worldFromScene = (x: number, y: number) => ({
  x: (x + SCENE_HALF_WIDTH) / SCENE_SCALE_X,
  z: (SCENE_HALF_HEIGHT - y) / SCENE_SCALE_Z,
});
