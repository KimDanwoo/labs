export function todayString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

export function addDays(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0] ?? '';
}
