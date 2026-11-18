const PERCENT = 100;

export function toPercent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * PERCENT) : 0;
}
