const FARTHEST = 0.12;
const NEAREST = 0.65;
/** How large the child (and the animals sized against them) stand over the painting's perspective. */
export const CHILD_SIZE = 2.1;

/** Painted-map depth runs from the distant top (0) to the foreground (100). */
export function characterScale(depth: number) {
  const distanceFromHorizon = Math.max(0, Math.min(1, (depth - 12) / 88));
  return FARTHEST + distanceFromHorizon * (NEAREST - FARTHEST);
}
