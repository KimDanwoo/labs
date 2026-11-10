export const SPIN_SKILL = { duration: 0.9, cooldown: 1.5, minHeight: 2.5, pivotHeight: 1.3 } as const;

export function createSpinState() {
  return { elapsed: 0, cooldown: 0, active: false, wasPressed: false, angle: 0 };
}

export function updateSpin(state: ReturnType<typeof createSpinState>, pressed: boolean, height: number, delta: number) {
  state.cooldown = Math.max(0, state.cooldown - delta);
  if (pressed && !state.wasPressed && !state.active && state.cooldown === 0 && height >= SPIN_SKILL.minHeight) {
    state.active = true;
    state.elapsed = 0;
    state.cooldown = SPIN_SKILL.duration + SPIN_SKILL.cooldown;
  }
  state.wasPressed = pressed;
  if (!state.active) return;
  state.elapsed = Math.min(SPIN_SKILL.duration, state.elapsed + delta);
  const t = state.elapsed / SPIN_SKILL.duration;
  state.angle = Math.PI * 2 * t * t * (3 - 2 * t);
  if (t === 1) {
    state.active = false;
    state.angle = 0;
  }
}
