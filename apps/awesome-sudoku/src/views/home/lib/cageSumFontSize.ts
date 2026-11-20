import { CAGE_SUM_FONT_PX } from '@views/home/config/killerCage';

export const cageSumFontSize = (cellSize: number): string =>
  `${Math.min(CAGE_SUM_FONT_PX.max, Math.max(CAGE_SUM_FONT_PX.min, cellSize * CAGE_SUM_FONT_PX.perCell))}px`;
