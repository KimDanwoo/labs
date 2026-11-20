import { itemAt } from '@views/slitherlink/lib/itemAt';
import type { GridTopology } from '@views/slitherlink/model/types/slitherlink';

export interface LatticeCoord {
  row: number;
  col: number;
}

export const vertexIndex = (size: number, { row, col }: LatticeCoord): number => row * (size + 1) + col;

export const vertexCoord = (size: number, vertex: number): LatticeCoord => ({
  row: Math.floor(vertex / (size + 1)),
  col: vertex % (size + 1),
});

export const edgeBetween = (topology: GridTopology, from: number, to: number): number | null => {
  const edge = topology.vertexEdges[from]?.find((candidate) => itemAt(topology.edgeVertices, candidate).includes(to));
  return edge ?? null;
};

export const stepToward = (size: number, from: number, to: number): number => {
  const start = vertexCoord(size, from);
  const target = vertexCoord(size, to);
  const rowGap = target.row - start.row;
  const colGap = target.col - start.col;
  if (Math.abs(rowGap) >= Math.abs(colGap))
    return vertexIndex(size, { row: start.row + Math.sign(rowGap), col: start.col });
  return vertexIndex(size, { row: start.row, col: start.col + Math.sign(colGap) });
};

export const latticeDistance = (size: number, from: number, to: number): number => {
  const start = vertexCoord(size, from);
  const target = vertexCoord(size, to);
  return Math.abs(target.row - start.row) + Math.abs(target.col - start.col);
};
