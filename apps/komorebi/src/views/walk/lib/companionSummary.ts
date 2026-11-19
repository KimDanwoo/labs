import { FRIENDSHIP_MAX, TANK_CAPACITY, catBond } from './companions';

export function companionSummary(isTank: boolean, tankCount: number, friendship: number): string {
  if (isTank) return `함께 사는 물고기 ${tankCount}/${TANK_CAPACITY}`;
  return `${catBond(friendship).name} · ${'♥'.repeat(friendship)}${'♡'.repeat(FRIENDSHIP_MAX - friendship)}`;
}
