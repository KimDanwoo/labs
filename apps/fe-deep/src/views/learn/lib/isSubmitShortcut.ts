import type { KeyboardEvent } from 'react';

import { SUBMIT_KEY } from '../config/studyCard';

export function isSubmitShortcut(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && event.key === SUBMIT_KEY;
}
