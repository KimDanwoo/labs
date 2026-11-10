export type CreatureState = { alert: number; rest: number };
export const createCreatureState = (): CreatureState => ({ alert: 0, rest: 0 });

// A short memory prevents jitter at the proximity boundary; animals settle after
// the rider leaves instead of replaying a new escape on every frame.
export function updateCreature(state: CreatureState, distance: number, radius: number, delta: number): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const dt = Math.min(delta, 0.1);
  if (distance < radius) state.rest = 2.5;
  else state.rest = Math.max(0, state.rest - dt);
  const target = state.rest > 0 ? 1 : 0;
  state.alert += (target - state.alert) * (1 - Math.exp(-dt * (target ? 3 : 0.65)));
}

export function habitatSeed(x: number, z: number, salt = 0): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 43.3) * 43758.5453;
  return n - Math.floor(n);
}

export function crossedArch(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  x: number,
  y: number,
  z: number,
): boolean {
  if (from.z < z === to.z < z || from.z === to.z) return false;
  const t = (z - from.z) / (to.z - from.z);
  const px = from.x + (to.x - from.x) * t - x;
  const py = from.y + (to.y - from.y) * t - y;
  return Math.abs(px) < 5.1 && py >= 0 && py < 9 + Math.sqrt(Math.max(0, 5.1 ** 2 - px ** 2));
}
