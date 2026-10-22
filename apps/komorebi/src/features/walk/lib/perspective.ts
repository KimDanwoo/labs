/** Painted-map depth runs from the distant top (0) to the foreground (100). */
export function characterScale(depth: number) {
  const distanceFromHorizon = Math.max(0, Math.min(1, (depth - 12) / 88));
  return 0.12 + distanceFromHorizon * 0.53;
}
