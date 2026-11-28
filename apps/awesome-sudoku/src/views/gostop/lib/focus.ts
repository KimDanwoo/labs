export function focusNeighborCard(button: HTMLButtonElement): void {
  if (document.activeElement !== button) return;
  const item = button.closest('li');
  const neighbor = item?.nextElementSibling ?? item?.previousElementSibling;
  neighbor?.querySelector<HTMLButtonElement>('button')?.focus();
}
