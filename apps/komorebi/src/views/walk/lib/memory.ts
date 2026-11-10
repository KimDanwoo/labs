import { TIME, TIME_LABEL, TIME_ORDER, type TimeOfDay } from '../model/constants/walk';
import type { Memory } from '../model/types/memory';
import type { Landmark } from '../model/world/world';

const TEXT_BY_TIME = {
  [TIME.day]: (landmark: Landmark) => landmark.text,
  [TIME.evening]: (landmark: Landmark) => landmark.eveningText,
  [TIME.night]: (landmark: Landmark) => landmark.nightText,
} satisfies Record<TimeOfDay, (landmark: Landmark) => string>;

const page = (landmark: Landmark, time: TimeOfDay) => ({ label: TIME_LABEL[time], text: TEXT_BY_TIME[time](landmark) });

/** The moment of discovery shows what is seen right now. */
export function liveMemory(landmark: Landmark, time: TimeOfDay): Memory {
  return { landmark, pages: [page(landmark, time)] };
}

/** Re-reading from the diary shows only the pages actually kept, in the order of the day. */
export function diaryMemory(landmark: Landmark, keptAt: readonly TimeOfDay[]): Memory {
  return { landmark, pages: TIME_ORDER.filter((time) => keptAt.includes(time)).map((time) => page(landmark, time)) };
}
