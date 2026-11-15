export type PanelState = 'open' | 'opening' | 'closed' | 'closing';

export function isShown(state: PanelState): boolean {
  return state === 'open' || state === 'opening';
}
