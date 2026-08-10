import { toRegions } from '@entities/stardoku/model/__tests__/fixtures';
import { PUZZLE_DIFFICULTY } from '@entities/stardoku/model/constants';
import { LOGIC_RULE, countSolutions, solveByLogic } from '@entities/stardoku/model/solver';
import { describe, expect, it } from 'vitest';

/** 1칸 구역(D) 엔트리 + 기본 기법만으로 완주되는 유일해 퍼즐 (생성기 프로토타입 산출물) */
const SOLVABLE_MAP = toRegions(['CAAAAA', 'CAABBB', 'CCEEBB', 'CCEEDF', 'CCEEFF', 'CEEEEF']);
const SOLVABLE_SOLUTION = [1, 3, 0, 4, 2, 5];

/** 해가 2개인 불량 구역 배치 */
const AMBIGUOUS_MAP = toRegions(['AABBBB', 'AABBBC', 'AABBBC', 'DDEEEC', 'DDEEEC', 'DDEEFC']);

describe('solveByLogic', () => {
  it('기본 기법만으로 완주하고 정답 배치를 찾는다', () => {
    const result = solveByLogic(SOLVABLE_MAP);

    expect(result.solved).toBe(true);
    expect(result.stars).toHaveLength(6);
    for (const star of result.stars) {
      expect(SOLVABLE_SOLUTION[star.row]).toBe(star.col);
    }
  });

  it('첫 수는 1칸 구역에서 나온다 (region-single)', () => {
    const result = solveByLogic(SOLVABLE_MAP);
    expect(result.rules[0]).toBe(LOGIC_RULE.REGION_SINGLE);
  });

  it('T1 배치 연쇄만으로 풀리는 판은 easy로 등급된다', () => {
    expect(solveByLogic(SOLVABLE_MAP).difficulty).toBe(PUZZLE_DIFFICULTY.EASY);
  });

  it('해가 여러 개인 판은 완주하지 못한다', () => {
    expect(solveByLogic(AMBIGUOUS_MAP).solved).toBe(false);
  });
});

describe('countSolutions', () => {
  it('유일해 판은 1을 반환한다', () => {
    expect(countSolutions(SOLVABLE_MAP)).toBe(1);
  });

  it('해가 2개 이상인 판을 감지한다', () => {
    expect(countSolutions(AMBIGUOUS_MAP)).toBeGreaterThanOrEqual(2);
  });
});
