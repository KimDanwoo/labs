import { TIME_LABEL, type TimeOfDay } from '@views/walk/config/walk';

export function keptLabel(times: TimeOfDay[]) {
  if (!times.length) return '아직 만나지 않은 풍경';
  return `${times.map((time) => TIME_LABEL[time]).join(' · ')}의 추억`;
}
