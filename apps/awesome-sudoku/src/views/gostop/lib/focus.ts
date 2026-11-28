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
