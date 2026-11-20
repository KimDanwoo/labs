import type { EdgeEnds, GridTopology } from '@views/slitherlink/model/types/slitherlink';

const cache = new Map<number, GridTopology>();

const horizontalEdge = (size: number, row: number, col: number): number => row * size + col;
const verticalEdge = (size: number, row: number, col: number): number => (size + 1) * size + row * (size + 1) + col;
const vertexAt = (size: number, row: number, col: number): number => row * (size + 1) + col;

const range = (length: number): number[] => Array.from({ length }, (_, index) => index);

const buildCellEdges = (size: number): number[][] =>
  range(size * size).map((cell) => {
    const row = Math.floor(cell / size);
    const col = cell % size;
    return [
      horizontalEdge(size, row, col),
      horizontalEdge(size, row + 1, col),
      verticalEdge(size, row, col),
      verticalEdge(size, row, col + 1),
    ];
  });

const buildEdgeVertices = (size: number): EdgeEnds[] => {
  const horizontal = range((size + 1) * size).map((edge): EdgeEnds => {
    const row = Math.floor(edge / size);
    const col = edge % size;
    return [vertexAt(size, row, col), vertexAt(size, row, col + 1)];
  });
  const vertical = range(size * (size + 1)).map((edge): EdgeEnds => {
    const row = Math.floor(edge / (size + 1));
    const col = edge % (size + 1);
    return [vertexAt(size, row, col), vertexAt(size, row + 1, col)];
  });
  return [...horizontal, ...vertical];
};

const invert = (lists: readonly (readonly number[])[], targetCount: number): number[][] => {
  const inverted = range(targetCount).map((): number[] => []);
  lists.forEach((targets, source) => targets.forEach((target) => inverted[target]?.push(source)));
  return inverted;
};

const buildTopology = (size: number): GridTopology => {
  const cellEdges = buildCellEdges(size);
  const edgeVertices = buildEdgeVertices(size);
  const vertexCount = (size + 1) * (size + 1);
  return {
    size,
    cellCount: size * size,
    vertexCount,
    cellEdges,
    edgeCells: invert(cellEdges, edgeVertices.length),
    edgeVertices,
    vertexEdges: invert(edgeVertices, vertexCount),
  };
};

export const getTopology = (size: number): GridTopology => {
  const cached = cache.get(size);
  if (cached) return cached;
  const topology = buildTopology(size);
  cache.set(size, topology);
  return topology;
};
