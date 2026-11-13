const FARTHEST = 0.12;
const NEAREST = 0.65;
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

export const sceneX = (x: number) => x * SCENE_SCALE_X - SCENE_HALF_WIDTH;
export const sceneY = (z: number) => SCENE_HALF_HEIGHT - z * SCENE_SCALE_Z;
export const worldFromScene = (x: number, y: number) => ({
  x: (x + SCENE_HALF_WIDTH) / SCENE_SCALE_X,
  z: (SCENE_HALF_HEIGHT - y) / SCENE_SCALE_Z,
});
