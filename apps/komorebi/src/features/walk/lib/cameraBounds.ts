/** Keep the subject visible where possible, but never expose space outside the painting. */
export function constrainCameraAxis(
  center: number,
  halfView: number,
  halfImage: number,
  subjectMin: number,
  subjectMax: number,
) {
  const visibleHalf = halfView * 0.98;
  const subjectCenter = Math.max(subjectMax - visibleHalf, Math.min(subjectMin + visibleHalf, center));
  const limit = Math.max(0, halfImage - halfView);
  return Math.max(-limit, Math.min(limit, subjectCenter));
}
