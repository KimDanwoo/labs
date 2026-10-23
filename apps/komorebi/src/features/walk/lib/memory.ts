import type { Memory, MemoryPage } from '@features/walk/model/types';
import type { Landmark } from '@shared/world/world';

const DAY_LABEL = '한낮';
const EVENING_LABEL = '해 질 녘';

/** The moment of discovery shows what is seen right now. */
export function liveMemory(landmark: Landmark, isEvening: boolean): Memory {
  const page = isEvening
    ? { label: EVENING_LABEL, text: landmark.eveningText }
    : { label: DAY_LABEL, text: landmark.text };
  return { landmark, pages: [page] };
}

/** Re-reading from the diary shows the day page, plus the dusk page once it has been seen. */
export function diaryMemory(landmark: Landmark, hasEveningPage: boolean): Memory {
  const pages: MemoryPage[] = [{ label: DAY_LABEL, text: landmark.text }];
  if (hasEveningPage) pages.push({ label: EVENING_LABEL, text: landmark.eveningText });
  return { landmark, pages };
}
