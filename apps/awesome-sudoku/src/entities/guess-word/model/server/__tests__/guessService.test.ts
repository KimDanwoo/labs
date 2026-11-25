import { GUESS_WORD_ERROR, GUESS_WORD_RANK } from '@entities/guess-word/config/guessWord';
import { answerIndex } from '@entities/guess-word/lib/puzzleDay';
import { guessWord, todayHints, yesterdayAnswer } from '@entities/guess-word/model/server/guessService';
import { loadWordData } from '@entities/guess-word/model/server/loadWordData';
import { describe, expect, it } from 'vitest';

const NOW = new Date('2026-11-25T03:00:00Z');

describe('guessService (실제 데이터)', () => {
  it('정답을 맞히면 유사도 100과 정답 표시를 준다', async () => {
    const { answers } = await loadWordData();
    const word = answers[answerIndex(1, answers.length)] ?? '';
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

  it('외래어는 어휘에 없어 unknown을 준다', async () => {
    for (const word of ['컴퓨터', '버스', '쉐도우']) {
      expect(await guessWord(word, NOW)).toEqual({ day: 1, error: GUESS_WORD_ERROR.UNKNOWN });
    }
  });

  it('힌트는 1위·10위·1000위 순서로 유사도가 내려간다', async () => {
    const { hints } = await todayHints(NOW);
    expect(hints.map(({ rank }) => rank)).toEqual([...GUESS_WORD_RANK.hints]);
    const [first, tenth, last] = hints.map(({ similarity }) => similarity);
    expect(first).toBeGreaterThanOrEqual(tenth ?? 0);
    expect(tenth).toBeGreaterThanOrEqual(last ?? 0);
  });

  it('1000위 안 단어는 순위가, 나머지는 null이 온다', async () => {
    const results = await Promise.all(['사랑', '하늘', '바다', '김치찌개'].map((word) => guessWord(word, NOW)));
    for (const result of results) {
      if ('error' in result) throw new Error(result.error);
      const isRanked = result.rank !== null;
      expect(isRanked ? result.rank : GUESS_WORD_RANK.top).toBeLessThanOrEqual(GUESS_WORD_RANK.top);
    }
  });

  it('어제의 정답은 시작일에는 없고, 다음 날부터 전날 정답을 준다', async () => {
    const { answers } = await loadWordData();
    expect(await yesterdayAnswer(NOW)).toEqual({ day: 0, word: null });
    expect(await yesterdayAnswer(new Date('2026-11-26T03:00:00Z'))).toEqual({
      day: 1,
      word: answers[answerIndex(1, answers.length)],
    });
  });

  it('뜻이 여러 개인 단어는 정답과 가까운 뜻으로 계산한다(그림자 ↔ 해=태양)', async () => {
    const sun = await guessWord('해', NOW);
    const star = await guessWord('태양', NOW);
    const isMissing = 'error' in sun || 'error' in star;
    if (isMissing) throw new Error('해·태양이 어휘에 있어야 한다');
    expect(sun.rank).not.toBeNull();
    expect(sun.similarity).toBeGreaterThanOrEqual(star.similarity - 5);
  });
});
