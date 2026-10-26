/** Physical keys stay stable when Korean IME changes event.key to ㅈ/ㅁ/ㄴ/ㅇ. */
export function gameKey(event: { code: string; key: string }) {
  const physical: Record<string, string> = {
    KeyW: 'w',
    KeyA: 'a',
    KeyS: 's',
    KeyD: 'd',
    KeyE: 'e',
    KeyM: 'm',
    ArrowUp: 'arrowup',
    ArrowDown: 'arrowdown',
    ArrowLeft: 'arrowleft',
    ArrowRight: 'arrowright',
    Space: ' ',
    ShiftLeft: 'shift',
    ShiftRight: 'shift',
  };
  return physical[event.code] ?? event.key.toLowerCase();
}

/** Eight-way pad with a quiet centre; diagonal input has the same world speed. */
export function padDirection(x: number, y: number): string[] {
  if (Math.hypot(x, y) < 0.2) return [];
  const keys = [];
  const threshold = Math.sin(Math.PI / 8);
  const length = Math.hypot(x, y);
  if (Math.abs(x) / length > threshold) keys.push(x > 0 ? 'd' : 'a');
  if (Math.abs(y) / length > threshold) keys.push(y > 0 ? 's' : 'w');
  return keys;
}

/** Unnormalised step from held keys: opposite keys cancel, WASD and arrows count as the same direction. */
export function keyboardDirection(keys: ReadonlySet<string>) {
  const held = (...names: string[]) => Number(names.some((name) => keys.has(name)));
  return {
    dx: held('d', 'arrowright') - held('a', 'arrowleft'),
    dz: held('s', 'arrowdown') - held('w', 'arrowup'),
  };
}

const CONTROL_TAGS = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A']);

/** Keys pressed on a focused control (Space on a button, typing in a field) belong to that control, not the walk. */
export function isControlTarget(target: { tagName: string; isContentEditable: boolean }): boolean {
  return CONTROL_TAGS.has(target.tagName) || target.isContentEditable;
}
