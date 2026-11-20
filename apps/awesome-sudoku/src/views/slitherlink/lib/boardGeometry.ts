import {
  BOARD_PADDING,
  CELL_UNIT,
  CLUE_FONT,
  CROSS_HALF,
  DOT_RADIUS_RATIO,
  LINE_WIDTH,
} from '@views/slitherlink/config/boardView';
import { boardSpan } from '@views/slitherlink/lib/boardHit';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { vertexCoord } from '@views/slitherlink/lib/lattice';
import { getTopology } from '@views/slitherlink/lib/topology';
import type { GridTopology } from '@views/slitherlink/model/types/slitherlink';

export interface SvgPoint {
  x: number;
  y: number;
}

export interface EdgeSegment {
  edge: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BoardStyle {
  lineWidth: number;
  dotRadius: number;
  clueFontSize: number;
}

export interface BoardLayout {
  viewBox: string;
  dots: SvgPoint[];
  cellCenters: SvgPoint[];
  segments: EdgeSegment[];
  style: BoardStyle;
}

const vertexPoint = (size: number, vertex: number): SvgPoint => {
  const { row, col } = vertexCoord(size, vertex);
  return { x: BOARD_PADDING + col * CELL_UNIT, y: BOARD_PADDING + row * CELL_UNIT };
};

const cellCenter = (size: number, cell: number): SvgPoint => ({
  x: BOARD_PADDING + ((cell % size) + 0.5) * CELL_UNIT,
  y: BOARD_PADDING + (Math.floor(cell / size) + 0.5) * CELL_UNIT,
});

const edgeSegment = (topology: GridTopology, edge: number): EdgeSegment => {
  const [from, to] = itemAt(topology.edgeVertices, edge);
  const start = vertexPoint(topology.size, from);
  const end = vertexPoint(topology.size, to);
  return { edge, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
};

const boardStyle = (size: number): BoardStyle => {
  const lineWidth = LINE_WIDTH.BASE + LINE_WIDTH.PER_CELL * size;
  return {
    lineWidth,
    dotRadius: lineWidth * DOT_RADIUS_RATIO,
    clueFontSize: CLUE_FONT.BASE + CLUE_FONT.PER_CELL * size,
  };
};

const layoutCache = new Map<number, BoardLayout>();

const buildBoardLayout = (topology: GridTopology): BoardLayout => {
  const span = boardSpan(topology.size);
  return {
    viewBox: `0 0 ${span} ${span}`,
    dots: Array.from({ length: topology.vertexCount }, (_, vertex) => vertexPoint(topology.size, vertex)),
    cellCenters: Array.from({ length: topology.cellCount }, (_, cell) => cellCenter(topology.size, cell)),
    segments: topology.edgeVertices.map((_, edge) => edgeSegment(topology, edge)),
    style: boardStyle(topology.size),
  };
};

export const getBoardLayout = (size: number): BoardLayout => {
  const cached = layoutCache.get(size);
  if (cached) return cached;
  const layout = buildBoardLayout(getTopology(size));
  layoutCache.set(size, layout);
  return layout;
};

export const crossPath = ({ x1, y1, x2, y2 }: EdgeSegment): string => {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return `M${cx - CROSS_HALF} ${cy - CROSS_HALF}L${cx + CROSS_HALF} ${cy + CROSS_HALF}M${cx + CROSS_HALF} ${cy - CROSS_HALF}L${cx - CROSS_HALF} ${cy + CROSS_HALF}`;
};
