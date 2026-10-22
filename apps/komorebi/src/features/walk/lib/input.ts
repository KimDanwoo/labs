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
