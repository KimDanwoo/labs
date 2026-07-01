export function formatCooldownKo(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

export function formatCooldownShort(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  return `${Math.ceil(totalSec / 60)}m`;
}

export function formatChatTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
