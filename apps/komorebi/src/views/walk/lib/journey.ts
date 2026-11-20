import { TIME_ORDER } from '@views/walk/config/walk';
import { LANDMARKS } from '@views/walk/model/world/landmarks';

const ALL_PAGES = LANDMARKS.length * TIME_ORDER.length;

export function journeyLine(placeCount: number, pageCount: number, steps: number) {
  if (pageCount === ALL_PAGES) return '스물한 장의 여름, 낮도 노을도 밤도 모두 모았어요.';
  if (placeCount === LANDMARKS.length) return '일곱 곳을 모두 걸었어요. 다른 시간에도 와 볼까요?';
  return `${steps.toLocaleString()} 걸음만큼 쌓인 여름`;
}
