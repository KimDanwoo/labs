const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let media: MediaQueryList | undefined;

export function prefersReducedMotion(): boolean {
  media ??= window.matchMedia(REDUCED_MOTION_QUERY);
  return media.matches;
}
