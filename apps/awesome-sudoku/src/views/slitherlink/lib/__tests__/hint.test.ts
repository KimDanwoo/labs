import { EDGE } from '@views/slitherlink/config/board';
import { seededRandom } from '@views/slitherlink/lib/__tests__/seededRandom';
import { pickHint } from '@views/slitherlink/lib/hint';
import { regionBoundary } from '@views/slitherlink/lib/loopRegion';
import { getTopology } from '@views/slitherlink/lib/topology';
import type { EdgeState } from '@views/slitherlink/model/types/slitherlink';
import { describe, expect, it } from 'vitest';

const solution = regionBoundary([true, false, false, false], getTopology(2));
const lineEdge = solution.indexOf(EDGE.LINE);
const crossEdge = solution.indexOf(EDGE.CROSS);
const blank = (): EdgeState[] => solution.map(() => EDGE.UNKNOWN);

describe('pickHint', () => {
  it('정답이 아닌 곳에 그은 선을 먼저 X로 고친다', () => {
    const edges = blank();
    edges[crossEdge] = EDGE.LINE;

    expect(pickHint(edges, solution, seededRandom(1))).toEqual({ edge: crossEdge, state: EDGE.CROSS });
  });

  it('정답 선에 잘못 놓은 X를 먼저 선으로 고친다', () => {
    const edges = blank();
    edges[lineEdge] = EDGE.CROSS;

    expect(pickHint(edges, solution, seededRandom(1))).toEqual({ edge: lineEdge, state: EDGE.LINE });
  });

  it('틀린 곳이 없으면 아직 긋지 않은 정답 선 하나를 알려 준다', () => {
    const hint = pickHint(blank(), solution, seededRandom(3));

    expect(hint?.state).toBe(EDGE.LINE);
    expect(solution[hint?.edge ?? -1]).toBe(EDGE.LINE);
  });

  it('정답 선을 모두 그었으면 알려 줄 것이 없다', () => {
    const edges = solution.map((state) => (state === EDGE.LINE ? EDGE.LINE : EDGE.UNKNOWN));

    expect(pickHint(edges, solution, seededRandom(1))).toBeNull();
  });
});
