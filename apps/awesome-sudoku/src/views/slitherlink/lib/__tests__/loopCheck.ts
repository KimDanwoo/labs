import { EDGE } from '@views/slitherlink/config/board';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import type { Clue, EdgeState, GridTopology } from '@views/slitherlink/model/types/slitherlink';

const lineCountAround = (lines: readonly boolean[], ids: readonly number[]): number =>
  ids.filter((id) => itemAt(lines, id)).length;

export const isSingleLoop = (lines: readonly boolean[], topology: GridTopology): boolean => {
  const degrees = topology.vertexEdges.map((ids) => lineCountAround(lines, ids));
  if (degrees.some((degree) => degree !== 0 && degree !== 2)) return false;
  const loopVertices = degrees.flatMap((degree, vertex) => (degree === 2 ? [vertex] : []));
  if (loopVertices.length === 0) return false;

  const reached = new Set([itemAt(loopVertices, 0)]);
  const stack = [itemAt(loopVertices, 0)];
  for (let vertex = stack.pop(); vertex !== undefined; vertex = stack.pop()) {
    for (const edge of itemAt(topology.vertexEdges, vertex)) {
      if (!itemAt(lines, edge)) continue;
      const next = itemAt(topology.edgeVertices, edge).find((end) => end !== vertex) ?? vertex;
      if (reached.has(next)) continue;
      reached.add(next);
      stack.push(next);
    }
  }
  return reached.size === loopVertices.length;
};

export const cluesMatch = (lines: readonly boolean[], clues: readonly Clue[], topology: GridTopology): boolean =>
  clues.every((clue, cell) => clue === null || lineCountAround(lines, itemAt(topology.cellEdges, cell)) === clue);

export const toLines = (edges: readonly EdgeState[]): boolean[] => edges.map((state) => state === EDGE.LINE);

const regionLines = (mask: number, topology: GridTopology): boolean[] =>
  topology.edgeCells.map((cells) => cells.filter((cell) => (mask >> cell) & 1).length === 1);

const loopsByTopology = new Map<GridTopology, boolean[][]>();

const allLoops = (topology: GridTopology): boolean[][] => {
  const cached = loopsByTopology.get(topology);
  if (cached) return cached;
  const loops: boolean[][] = [];
  for (let mask = 1; mask < 2 ** topology.cellCount; mask += 1) {
    const lines = regionLines(mask, topology);
    if (isSingleLoop(lines, topology)) loops.push(lines);
  }
  loopsByTopology.set(topology, loops);
  return loops;
};

export const bruteForceSolutions = (clues: readonly Clue[], topology: GridTopology): boolean[][] =>
  allLoops(topology).filter((lines) => cluesMatch(lines, clues, topology));
