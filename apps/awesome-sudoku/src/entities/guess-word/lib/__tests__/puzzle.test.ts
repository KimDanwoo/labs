import { buildPuzzle, createWordData } from '@entities/guess-word/lib/puzzle';
import {
  createWordVectors,
  elementwiseMax,
  foldSenses,
  nearestNeighbors,
  toDisplaySimilarity,
} from '@entities/guess-word/lib/similarity';
import { describe, expect, it } from 'vitest';

const DIMENSIONS = 2;
const WORDS = ['정답', '가깝다', '중간', '멀다', '반대'];
const VALUES = Int8Array.from([100, 0, 90, 10, 50, 50, 0, 100, -100, 0]);

function wordData(answers: string[] = ['정답']) {
  return createWordData(WORDS, answers, createWordVectors(VALUES, DIMENSIONS), []);
}

describe('similarity', () => {
  it('자기 자신을 뺀 가까운 순서로 이웃을 고른다', () => {
    const similarities = Float32Array.from([1, 0.9, 0.7, 0, -1]);
    expect(nearestNeighbors(similarities, 0, 3)).toEqual([1, 2, 3]);
  });

  it('화면 표시 값은 100을 곱해 소수 둘째 자리까지 반올림한다', () => {
    expect(toDisplaySimilarity(0.123456)).toBe(12.35);
  });
});

describe('foldSenses', () => {
  it('뜻이 여러 개인 단어는 정답과 가장 가까운 뜻의 유사도를 쓴다', () => {
    const rows = Float32Array.from([1, 0.1, 0.2, 0.9, 0.05]);
    expect(Array.from(foldSenses(rows, 3, [1, 2]))).toEqual([1, Math.fround(0.9), Math.fround(0.2)]);
  });
});

describe('elementwiseMax', () => {
  it('같은 위치끼리 가장 큰 값을 고른다', () => {
    const merged = elementwiseMax([Float32Array.from([1, 0, 0.5]), Float32Array.from([0, 2, 0.25])]);
    expect(Array.from(merged)).toEqual([1, 2, 0.5]);
  });
});

describe('정답이 다의어일 때', () => {
  it('정답의 다른 뜻과 가까운 단어도 그 뜻의 유사도를 받는다', () => {
    const values = Int8Array.from([100, 0, 0, 100, -100, 0, 0, 100]);
    const data = createWordData(['정답', '다른뜻단어', '먼말'], ['정답'], createWordVectors(values, DIMENSIONS), [
      '정답',
    ]);
    const puzzle = buildPuzzle(data, 1);
    expect(puzzle.similarities[1]).toBeCloseTo(1);
    expect(puzzle.similarities[2]).toBeCloseTo(0);
  });
});

describe('createWordData', () => {
  it('어휘에 없는 정답이 있으면 실패한다', () => {
    expect(() => wordData(['없는말'])).toThrow('없는말');
  });

  it('뜻별 벡터의 단어가 어휘에 없으면 실패한다', () => {
    expect(() => createWordData(WORDS, ['정답'], createWordVectors(VALUES, DIMENSIONS), ['없는말'])).toThrow('없는말');
  });
});

describe('buildPuzzle', () => {
  const puzzle = buildPuzzle(wordData(), 1);

  it('날짜에 맞는 정답을 고르고 정답은 순위에서 뺀다', () => {
    expect(puzzle.answer).toBe(0);
    expect(puzzle.rankByIndex.has(0)).toBe(false);
  });

  it('유사도가 높은 순서로 1위부터 순위를 매긴다', () => {
    expect(puzzle.rankByIndex.get(1)).toBe(1);
    expect(puzzle.rankByIndex.get(2)).toBe(2);
    expect(puzzle.rankByIndex.get(4)).toBe(4);
  });

  it('1위 힌트는 가장 가까운 단어의 유사도다', () => {
    expect(puzzle.hints[0]).toEqual({ rank: 1, similarity: toDisplaySimilarity(puzzle.similarities[1] ?? 0) });
  });
});
