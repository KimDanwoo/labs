import { GUESS_WORD_ERROR, GUESS_WORD_RANK } from '@entities/guess-word/config/guessWord';
import { guessWord, todayAnswer, todayHints } from '@entities/guess-word/model/server/guessService';
import { describe, expect, it } from 'vitest';

const NOW = new Date('2026-11-25T03:00:00Z');

describe('guessService (실제 데이터)', () => {
  it('정답을 맞히면 유사도 100과 정답 표시를 준다', async () => {
    const { word } = await todayAnswer(NOW);
    const result = await guessWord(word, NOW);
    expect(result).toMatchObject({ day: 1, word, similarity: 100, rank: null, isAnswer: true });
  });

  it('어휘에 있는 명사는 유사도를 준다', async () => {
    const result = await guessWord('사랑', NOW);
    expect(result).toMatchObject({ day: 1, word: '사랑', isAnswer: false });
  });

  it('한글 단어가 아니면 invalid, 어휘에 없으면 unknown을 준다', async () => {
    expect(await guessWord('love', NOW)).toEqual({ day: 1, error: GUESS_WORD_ERROR.INVALID });
    expect(await guessWord('예쁘다', NOW)).toEqual({ day: 1, error: GUESS_WORD_ERROR.UNKNOWN });
  });

  it('힌트는 1위·10위·1000위 순서로 유사도가 내려간다', async () => {
    const { hints } = await todayHints(NOW);
    expect(hints.map(({ rank }) => rank)).toEqual([...GUESS_WORD_RANK.hints]);
    const [first, tenth, last] = hints.map(({ similarity }) => similarity);
    expect(first).toBeGreaterThanOrEqual(tenth ?? 0);
    expect(tenth).toBeGreaterThanOrEqual(last ?? 0);
  });

  it('1000위 안 단어는 순위가, 나머지는 null이 온다', async () => {
    const results = await Promise.all(['사랑', '컴퓨터', '바다', '김치찌개'].map((word) => guessWord(word, NOW)));
    for (const result of results) {
      if ('error' in result) throw new Error(result.error);
      const isRanked = result.rank !== null;
      expect(isRanked ? result.rank : GUESS_WORD_RANK.top).toBeLessThanOrEqual(GUESS_WORD_RANK.top);
    }
  });
});
