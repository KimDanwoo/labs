export type RovingStep = -1 | 1;

export function stepPosition(current: number, step: RovingStep, length: number): number {
  return (current + step + length) % length;
}

const KEY_TARGET: Record<string, (current: number, length: number) => number> = {
  ArrowLeft: (current, length) => stepPosition(current, -1, length),
  ArrowRight: (current, length) => stepPosition(current, 1, length),
  Home: () => 0,
  End: (_current, length) => length - 1,
};

export function keyToPosition(key: string, current: number, length: number): number | null {
  const target = KEY_TARGET[key];
  return target ? target(current, length) : null;
}
