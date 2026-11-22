export interface LocalPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const PITCH = {
  groundY: -3.27,
  centerZ: -1.15,
  goalLineX: -15.2,
  endX: 10.8,
  halfWidth: 3.2,
  halfwayX: -2.2,
} as const;

export const GOAL = { depth: 2.2, halfWidth: 1.7, height: 2.7 } as const;

const PLAY_ZONE = { minX: -19, maxX: 24, halfWidth: 6.5, fallDepth: 2 } as const;

export function isBallInGoal({ x, y, z }: LocalPoint, radius: number): boolean {
  const hasCrossedLine = x < PITCH.goalLineX - radius;
  const isBetweenPosts = Math.abs(z - PITCH.centerZ) < GOAL.halfWidth;
  const isUnderBar = y < PITCH.groundY + GOAL.height;
  return hasCrossedLine && isBetweenPosts && isUnderBar;
}

export function isBallOffPitch({ x, y, z }: LocalPoint): boolean {
  const isPastEnds = x < PLAY_ZONE.minX || x > PLAY_ZONE.maxX;
  const isPastSides = Math.abs(z - PITCH.centerZ) > PLAY_ZONE.halfWidth;
  const hasFallen = y < PITCH.groundY - PLAY_ZONE.fallDepth;
  return isPastEnds || isPastSides || hasFallen;
}
