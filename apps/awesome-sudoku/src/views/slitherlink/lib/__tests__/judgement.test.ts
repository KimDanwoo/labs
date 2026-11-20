import { EDGE } from '@views/slitherlink/config/board';
import { JUDGEMENT } from '@views/slitherlink/config/judgement';
import { judgeDrawing } from '@views/slitherlink/lib/judgement';
import { regionBoundary } from '@views/slitherlink/lib/loopRegion';
import { getTopology } from '@views/slitherlink/lib/topology';
import type { EdgeState } from '@views/slitherlink/model/types/slitherlink';
import { describe, expect, it } from 'vitest';

const topology = getTopology(2);
const solution = regionBoundary([true, true, true, false], topology);
const blank = (): EdgeState[] => solution.map(() => EDGE.UNKNOWN);
const withLines = (lineEdges: readonly number[]): EdgeState[] =>
  blank().map((state, edge) => (lineEdges.includes(edge) ? EDGE.LINE : state));
const solutionLines = solution.flatMap((state, edge) => (state === EDGE.LINE ? [edge] : []));

describe('judgeDrawing', () => {
  it('아무것도 긋지 않았으면 그리는 중이다', () => {
    expect(judgeDrawing(blank(), solution, topology)).toBe(JUDGEMENT.DRAWING);
  });

  it('정답 선을 모두 그으면 X 표시와 상관없이 성공이다', () => {
    const drawn = withLines(solutionLines).map((state) => (state === EDGE.UNKNOWN ? EDGE.CROSS : state));

    expect(judgeDrawing(withLines(solutionLines), solution, topology)).toBe(JUDGEMENT.SOLVED);
    expect(judgeDrawing(drawn, solution, topology)).toBe(JUDGEMENT.SOLVED);
  });

  it('닫힌 고리지만 정답이 아니면 틀린 고리다', () => {
    const singleCell = topology.cellEdges[0] ?? [];

    expect(judgeDrawing(withLines(singleCell), solution, topology)).toBe(JUDGEMENT.WRONG_LOOP);
  });

  it('끊긴 선이 남아 있으면 그리는 중이다', () => {
    expect(judgeDrawing(withLines(solutionLines.slice(1)), solution, topology)).toBe(JUDGEMENT.DRAWING);
  });
});
