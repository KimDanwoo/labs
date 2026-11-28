import type { SVGAttributes } from 'react';

import type { GameId } from '@entities/game-catalog';

export interface GlyphShape {
  tag: 'path' | 'circle' | 'rect';
  attrs: SVGAttributes<SVGElement>;
}

const FILLED = { fill: 'currentColor', stroke: 'none' } as const;
const BOARD_FRAME: GlyphShape = { tag: 'rect', attrs: { x: 3.5, y: 3.5, width: 17, height: 17, rx: 3.5 } };

export const GAME_GLYPHS: Record<GameId, readonly GlyphShape[]> = {
  guess: [
    { tag: 'circle', attrs: { cx: 10.5, cy: 10.5, r: 6.5 } },
    { tag: 'path', attrs: { d: 'm15.5 15.5 5 5' } },
    { tag: 'path', attrs: { d: 'M8.6 8.9a2 2 0 1 1 2.7 1.9c-.5.2-.8.6-.8 1.1' } },
    { tag: 'circle', attrs: { cx: 10.5, cy: 14, r: 0.6, ...FILLED } },
  ],
  sudoku: [
    BOARD_FRAME,
    { tag: 'path', attrs: { d: 'M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17', strokeWidth: 1.6 } },
  ],
  killer: [
    BOARD_FRAME,
    { tag: 'path', attrs: { d: 'M7.3 7.3h9.4v4.8h-4.6v4.6H7.3z', strokeDasharray: '2.2 2', strokeWidth: 1.7 } },
  ],
  slitherlink: [
    { tag: 'path', attrs: { d: 'M5.5 5.5h6.5v6.5h6.5v6.5h-13z' } },
    { tag: 'circle', attrs: { cx: 18.5, cy: 5.5, r: 1.3, ...FILLED } },
    { tag: 'circle', attrs: { cx: 12, cy: 18.5, r: 1.3, ...FILLED } },
    { tag: 'circle', attrs: { cx: 5.5, cy: 12, r: 1.3, ...FILLED } },
  ],
  gomoku: [
    { tag: 'path', attrs: { d: 'M3.5 8h17M3.5 16h17M8 3.5v17M16 3.5v17', strokeWidth: 1.5, opacity: 0.5 } },
    { tag: 'circle', attrs: { cx: 8, cy: 8, r: 3.3, ...FILLED } },
    { tag: 'circle', attrs: { cx: 16, cy: 16, r: 3.3, fill: 'var(--glyph-hole)' } },
  ],
  walls: [
    { tag: 'rect', attrs: { x: 3.5, y: 5, width: 17, height: 14, rx: 2.5 } },
    {
      tag: 'path',
      attrs: { d: 'M3.5 9.7h17M3.5 14.3h17M9 5v4.7M15 5v4.7M12 9.7v4.6M7.5 14.3V19M16.5 14.3V19', strokeWidth: 1.6 },
    },
  ],
  gostop: [
    { tag: 'rect', attrs: { x: 3.5, y: 6, width: 10, height: 14, rx: 2, transform: 'rotate(-10 8.5 13)' } },
    { tag: 'rect', attrs: { x: 10.5, y: 4, width: 10, height: 14, rx: 2, transform: 'rotate(8 15.5 11)' } },
    { tag: 'circle', attrs: { cx: 15.5, cy: 9.5, r: 2.2, ...FILLED } },
  ],
  lotto: [
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 8.5 } },
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 4.3 } },
    { tag: 'path', attrs: { d: 'M10.6 10.6h2.8l-1.7 3.2', strokeWidth: 1.6 } },
  ],
};
