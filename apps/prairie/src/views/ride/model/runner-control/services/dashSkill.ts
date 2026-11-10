export const DASH_SKILL = {
  duration: 1.2,
  attack: 0.18,
  release: 0.45,
  cooldown: 3,
  minHeight: 2.5,
  speed: 100 / 3.6,
  fovBoost: 14,
} as const;

export function createDashState() {
  return { active: false, elapsed: 0, cooldown: 0, wasPressed: false, strength: 0 };
}

export function updateDash(state: ReturnType<typeof createDashState>, pressed: boolean, height: number, delta: number) {
  state.cooldown = Math.max(0, state.cooldown - delta);
  if (pressed && !state.wasPressed && !state.active && state.cooldown === 0 && height >= DASH_SKILL.minHeight) {
    state.active = true;
    state.elapsed = 0;
    state.cooldown = DASH_SKILL.duration + DASH_SKILL.cooldown;
  }
  state.wasPressed = pressed;
  if (!state.active) return;
  state.elapsed = Math.min(DASH_SKILL.duration, state.elapsed + delta);
  const attack = Math.min(1, state.elapsed / DASH_SKILL.attack);
  const release = Math.min(1, (DASH_SKILL.duration - state.elapsed) / DASH_SKILL.release);
  const t = Math.max(0, Math.min(attack, release));
  state.strength = t * t * (3 - 2 * t);
  if (state.elapsed === DASH_SKILL.duration || height <= 0) {
    state.active = false;
    state.strength = 0;
  }
}
