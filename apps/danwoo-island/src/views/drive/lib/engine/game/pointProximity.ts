export type PointState = 'hidden' | 'open' | 'concealed';

export interface PlanePosition<P> {
  distanceTo(other: P): number;
}

export interface ProximityPoint<P> {
  readonly position: PlanePosition<P>;
  readonly state: PointState;
}

const NEAR_DISTANCE = 2.5;
const RETEST_DISTANCE = 0.2;

export function needsRetest(traveled: number, isRequested: boolean): boolean {
  const isSettled = traveled <= RETEST_DISTANCE && !isRequested;
  return !isSettled;
}

export function nearbyPoints<P, T extends ProximityPoint<P>>(items: readonly T[], player: P): T[] {
  return items.filter((item) => item.position.distanceTo(player) < NEAR_DISTANCE);
}

export function lastVisiblePoint<T extends { readonly state: PointState }>(nearby: readonly T[]): T | null {
  return nearby.filter((item) => item.state !== 'hidden').at(-1) ?? null;
}
