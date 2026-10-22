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
