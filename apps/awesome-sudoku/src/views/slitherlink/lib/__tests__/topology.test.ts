import { getTopology } from '@views/slitherlink/lib/topology';
import { describe, expect, it } from 'vitest';

describe('getTopology', () => {
  it('2×2 판의 칸·점·변 번호가 맞물린다', () => {
    const topology = getTopology(2);

    expect(topology.cellCount).toBe(4);
    expect(topology.vertexCount).toBe(9);
    expect(topology.edgeVertices).toHaveLength(12);
    expect(topology.cellEdges[0]).toEqual([0, 2, 6, 7]);
    expect(topology.cellEdges[3]).toEqual([3, 5, 10, 11]);
    expect(topology.edgeVertices[0]).toEqual([0, 1]);
    expect(topology.edgeVertices[6]).toEqual([0, 3]);
  });

  it.each([3, 5, 10])('%i칸 판에서 테두리 변은 칸 하나, 안쪽 변은 칸 둘에 붙는다', (size) => {
    const topology = getTopology(size);
    const cellCounts = topology.edgeCells.map((cells) => cells.length);

    expect(cellCounts.filter((count) => count === 1)).toHaveLength(4 * size);
    expect(cellCounts.filter((count) => count === 2)).toHaveLength(2 * size * (size - 1));
  });

  it.each([3, 5, 10])('%i칸 판에서 모서리 점은 변 2개, 테두리 점은 3개, 안쪽 점은 4개다', (size) => {
    const degrees = getTopology(size).vertexEdges.map((edges) => edges.length);

    expect(degrees.filter((degree) => degree === 2)).toHaveLength(4);
    expect(degrees.filter((degree) => degree === 3)).toHaveLength(4 * (size - 1));
    expect(degrees.filter((degree) => degree === 4)).toHaveLength((size - 1) ** 2);
  });

  it('같은 크기는 한 번 만든 구조를 다시 쓴다', () => {
    expect(getTopology(7)).toBe(getTopology(7));
  });
});
