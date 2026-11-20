import { CONTROLS_SEEN_STORAGE_KEY } from '@views/walk/config/walk';

let seenBeforeThisVisit: boolean | null = null;

export function wasControlsHintSeen(): boolean {
  if (seenBeforeThisVisit !== null) return seenBeforeThisVisit;
  try {
    seenBeforeThisVisit = localStorage.getItem(CONTROLS_SEEN_STORAGE_KEY) !== null;
    localStorage.setItem(CONTROLS_SEEN_STORAGE_KEY, '1');
  } catch {
    seenBeforeThisVisit = false;
  }
  return seenBeforeThisVisit;
}
