export interface RayTarget {
  active: boolean;
  isIntersecting: boolean;
  isDown: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onDown?: () => void;
  onUp?: () => void;
  onClick?: () => void;
}

interface PointerTravel {
  x: number;
  y: number;
}

const CLICK_TOLERANCE = 25;

export function nearestHit<T>(candidates: readonly T[], distanceOf: (candidate: T) => number | null): T | null {
  let nearest: T | null = null;
  let nearestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = distanceOf(candidate);
    if (distance === null || distance >= nearestDistance) continue;
    nearest = candidate;
    nearestDistance = distance;
  }
  return nearest;
}

function setIntersecting(target: RayTarget, isIntersecting: boolean): void {
  target.isIntersecting = isIntersecting;
  if (isIntersecting) target.onEnter?.();
  else target.onLeave?.();
}

export function focusTarget(candidates: readonly RayTarget[], nearest: RayTarget | null): void {
  for (const candidate of candidates) {
    if (candidate !== nearest && candidate.isIntersecting) setIntersecting(candidate, false);
  }
  if (nearest && !nearest.isIntersecting) setIntersecting(nearest, true);
}

export function pressTarget(target: RayTarget): void {
  target.isDown = true;
  target.onDown?.();
}

export function isClickTravel({ x, y }: PointerTravel): boolean {
  return Math.hypot(x, y) < CLICK_TOLERANCE;
}

export function releaseTargets(targets: readonly RayTarget[], isClick: boolean): void {
  for (const target of targets.filter(({ active }) => active)) {
    if (target.isIntersecting) target.onUp?.();
    if (!target.isDown) continue;
    target.isDown = false;
    if (target.isIntersecting && isClick) target.onClick?.();
    if (!target.isIntersecting) target.onUp?.();
  }
}
