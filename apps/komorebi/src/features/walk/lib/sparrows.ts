import type { Point } from '@shared/world/world';

export const BIRD_STATE = { ground: 'ground', flying: 'flying', perched: 'perched', returning: 'returning' } as const;
type BirdState = (typeof BIRD_STATE)[keyof typeof BIRD_STATE];
export type Sparrow = {
  state: BirdState;
  clock: number;
  age: number;
  home: Point;
  perch: Point;
  at: Point;
  from: Point;
  lift: number;
  seed: number;
};

export function startSparrow(home: Point, perch: Point, seed: number): Sparrow {
  return {
    state: BIRD_STATE.ground,
    clock: 0,
    age: seed,
    home,
    perch,
    at: { ...home },
    from: { ...home },
    lift: 0,
    seed,
  };
}

/** Near feet send a bird up to its branch. It returns only after the path is quiet. */
export function stepSparrow(bird: Sparrow, player: Point, dt: number) {
  bird.age += dt;
  bird.clock += dt;
  const close = Math.hypot(player.x - bird.at.x, player.z - bird.at.z) < 6;
  const homeClear = Math.hypot(player.x - bird.home.x, player.z - bird.home.z) > 10;
  const launch = (state: BirdState) => {
    bird.from = { ...bird.at };
    bird.state = state;
    bird.clock = 0;
  };
  if (bird.state === BIRD_STATE.ground) {
    if (close) {
      launch(BIRD_STATE.flying);
      return;
    }
    const beat = (bird.age + bird.seed) % 4.5;
    const hop = Math.max(0, 1 - Math.abs(beat - 0.3) / 0.3);
    bird.at.x = bird.home.x + Math.sin(bird.age * 0.38 + bird.seed) * 0.7;
    bird.lift = Math.sin((hop * Math.PI) / 2) * 0.16;
    return;
  }
  if (bird.state === BIRD_STATE.perched) {
    if (homeClear && bird.clock > 8 + bird.seed) launch(BIRD_STATE.returning);
    return;
  }
  if (bird.state === BIRD_STATE.returning && !homeClear) {
    launch(BIRD_STATE.flying);
  }
  const target = bird.state === BIRD_STATE.flying ? bird.perch : bird.home;
  const progress = Math.min(1, bird.clock / 1.65);
  const ease = progress * progress * (3 - 2 * progress);
  bird.at.x = bird.from.x + (target.x - bird.from.x) * ease;
  bird.at.z = bird.from.z + (target.z - bird.from.z) * ease;
  bird.lift = Math.sin(progress * Math.PI) * 2.6;
  if (progress === 1) {
    bird.state = bird.state === BIRD_STATE.flying ? BIRD_STATE.perched : BIRD_STATE.ground;
    bird.clock = 0;
    bird.lift = 0;
  }
}
