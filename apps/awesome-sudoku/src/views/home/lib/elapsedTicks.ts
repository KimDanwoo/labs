export interface ElapsedTicks {
  ticks: number;
  carryMs: number;
}

export function elapsedTicks(elapsedMs: number, tickMs: number): ElapsedTicks {
  const ticks = Math.max(0, Math.floor(elapsedMs / tickMs));
  return { ticks, carryMs: Math.max(0, elapsedMs - ticks * tickMs) };
}
