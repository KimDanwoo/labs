import { KEYBOARD_CLICK_DETAIL } from '@views/gostop/config/game';

export function focusNeighborCard(button: HTMLButtonElement): void {
  if (document.activeElement !== button) return;
  const item = button.closest('li');
  const neighbor = item?.nextElementSibling ?? item?.previousElementSibling;
  neighbor?.querySelector<HTMLButtonElement>('button')?.focus();
}

export const isKeyboardClick = (event: Pick<MouseEvent, 'detail'>): boolean => event.detail === KEYBOARD_CLICK_DETAIL;

export function shouldFocusHand(isPending: boolean, isSettled: boolean, handSize: number): boolean {
  if (!isPending) return false;
  if (!isSettled) return false;
  return handSize > 0;
}

const CHOICE_PICK_SELECTOR = '[data-choice-pick]';
const CHOICE_MOVE_KEYS: ReadonlySet<string> = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function moveChoiceFocus(
  event: Pick<KeyboardEvent, 'key' | 'preventDefault'> & { currentTarget: HTMLElement },
): void {
  if (!CHOICE_MOVE_KEYS.has(event.key)) return;
  const picks = event.currentTarget.closest('ul')?.querySelectorAll<HTMLButtonElement>(CHOICE_PICK_SELECTOR) ?? [];
  const other = Array.from(picks).find((pick) => pick !== event.currentTarget);
  if (!other) return;
  event.preventDefault();
  other.focus();
}
