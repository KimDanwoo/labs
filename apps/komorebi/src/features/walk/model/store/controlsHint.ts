import { CONTROLS_SEEN_STORAGE_KEY } from '@features/walk/model/constants';

let seenBeforeThisVisit: boolean | null = null;

/** Read once per visit so marking the hint as seen does not hide it mid-visit. */
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
