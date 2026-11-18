import type { KeyboardEvent } from 'react';

import { SUBMIT_KEY } from '@shared/config/keyboard';

export function isSubmitShortcut(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && event.key === SUBMIT_KEY;
}
