import { RANK_TONE } from '@views/guess-word/config/game';
import { rankView } from '@views/guess-word/lib/rankView';
import { describe, expect, it } from 'vitest';

const entry = (word: string, rank: number | null) => ({ word, similarity: 0, rank, order: 1 });

describe('rankView', () => {
  it('정답은 꽉 찬 막대로 보여준다', () => {
    expect(rankView(entry('사랑', null), '사랑')).toEqual({ tone: RANK_TONE.ANSWER, rank: null, progress: 1 });
  });

  it('1위는 막대가 가득, 1000위는 거의 비어 있다', () => {
    expect(rankView(entry('a', 1), null).progress).toBe(1);
    expect(rankView(entry('a', 1000), null).progress).toBeCloseTo(0.001);
  });

  it('1000위 밖은 막대 없이 표시한다', () => {
    expect(rankView(entry('a', null), null)).toEqual({ tone: RANK_TONE.FAR, rank: null, progress: 0 });
  });
});
