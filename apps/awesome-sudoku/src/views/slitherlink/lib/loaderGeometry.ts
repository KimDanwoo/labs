import { LOADER_GRID, LOADER_LOOP } from '@views/slitherlink/config/loader';
import type { SvgPoint } from '@views/slitherlink/lib/boardGeometry';

const toSvg = (col: number, row: number): SvgPoint => ({
  x: LOADER_GRID.padding + col * LOADER_GRID.cell,
  y: LOADER_GRID.padding + row * LOADER_GRID.cell,
});

export const LOADER_SPAN = LOADER_GRID.padding * 2 + LOADER_GRID.size * LOADER_GRID.cell;

export const loaderDots = (): SvgPoint[] =>
  Array.from({ length: (LOADER_GRID.size + 1) ** 2 }, (_, index) =>
    toSvg(index % (LOADER_GRID.size + 1), Math.floor(index / (LOADER_GRID.size + 1))),
  );

export const loaderLoopPath = (): string =>
  `${LOADER_LOOP.map(([col, row], index) => {
    const { x, y } = toSvg(col, row);
    return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }).join('')}Z`;
