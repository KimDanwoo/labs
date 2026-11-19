import { COVER_WIDTH, MEDIA_MIN_WIDTH } from '../config/projectGrid';
import { planCardRowSizes, type RowSize } from './gridRows';

interface ProjectCardLayout {
  rowSize: RowSize;
  isFullRowOnTablet: boolean;
  coverSizes: string;
}

export function planProjectCardLayouts(cardCount: number): ProjectCardLayout[] {
  const hasOddCount = cardCount % 2 === 1;
  return planCardRowSizes(cardCount).map((rowSize, index) => {
    const isFullRowOnTablet = hasOddCount && index === 0;
    const tabletWidth = isFullRowOnTablet ? COVER_WIDTH.tabletFull : COVER_WIDTH.tabletHalf;
    const coverSizes = [
      `(min-width: ${MEDIA_MIN_WIDTH.desktop}) ${COVER_WIDTH.desktop[rowSize]}`,
      `(min-width: ${MEDIA_MIN_WIDTH.tablet}) ${tabletWidth}`,
      COVER_WIDTH.mobile,
    ].join(', ');
    return { rowSize, isFullRowOnTablet, coverSizes };
  });
}
