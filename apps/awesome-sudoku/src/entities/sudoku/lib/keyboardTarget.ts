import { KEYBOARD_IGNORED_TARGETS } from '@entities/sudoku/config/board';

export function isBoardShortcut(event: KeyboardEvent): boolean {
  const isModifiedOrComposing = event.metaKey || event.ctrlKey || event.altKey || event.isComposing;
  if (isModifiedOrComposing) return false;
  const { target } = event;
  return !(target instanceof HTMLElement && target.closest(KEYBOARD_IGNORED_TARGETS) !== null);
}
