import { RIPPLE_SLOTS } from '@views/player/config/renderer';
import { RIPPLE_MS } from '@views/player/config/stage';

const RIPPLE_STRIDE = 4;

const ripples = Array.from({ length: RIPPLE_SLOTS }, () => ({
  x: 0,
  y: 0,
  age: 1,
  amp: 1,
  life: RIPPLE_MS,
  seed: 0,
  fromClick: false,
}));

export const rippleBuffer = new Float32Array(RIPPLE_SLOTS * RIPPLE_STRIDE);
export const seedBuffer = new Float32Array(RIPPLE_SLOTS);

export function claimRipple(x: number, y: number, amp: number, life: number, fromClick: boolean) {
  const open = fromClick ? ripples : ripples.filter((candidate) => !(candidate.fromClick && candidate.age < 1));
  if (open.length === 0) return;
  const slot = open.reduce((a, b) => (b.age > a.age ? b : a));
  slot.fromClick = fromClick;
  slot.x = x;
  slot.y = y;
  slot.age = 0;
  slot.amp = amp;
  slot.life = life;
  slot.seed = Math.random();
}

export function advanceRipples(delta: number) {
  let energy = 0;
  let slot = 0;
  for (const ripple of ripples) {
    if (ripple.age < 1) {
      ripple.age = Math.min(1, ripple.age + delta / ripple.life);
      energy += (1 - ripple.age) * ripple.amp;
    }
    rippleBuffer[slot] = ripple.x;
    rippleBuffer[slot + 1] = ripple.y;
    rippleBuffer[slot + 2] = ripple.age;
    rippleBuffer[slot + 3] = ripple.amp;
    seedBuffer[slot / RIPPLE_STRIDE] = ripple.seed;
    slot += RIPPLE_STRIDE;
  }
  return energy;
}
