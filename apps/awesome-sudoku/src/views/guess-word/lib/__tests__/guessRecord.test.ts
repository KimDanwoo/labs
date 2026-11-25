import { GUESS_STATUS, NOTICE_KIND } from '@views/guess-word/config/game';
import {
  addGuess,
  blockedGuessNotice,
  emptyRecord,
  latestDay,
  parseRecord,
  revealAnswer,
  solvedTries,
  sortBySimilarity,
  storedDay,
} from '@views/guess-word/lib/guessRecord';
import { describe, expect, it } from 'vitest';

const result = (word: string, similarity: number, isAnswer = false) => ({
  day: 3,
  word,
  similarity,
  rank: isAnswer ? null : 5,
  isAnswer,
});

describe('parseRecord', () => {
  it('저장된 값이 깨졌거나 다른 날 기록이면 빈 기록으로 시작한다', () => {
    expect(parseRecord('broken', 3)).toEqual(emptyRecord(3));
    expect(parseRecord({ day: 2, guesses: [] }, 3)).toEqual(emptyRecord(3));
  });

  it('형식이 맞지 않는 추측은 버리고 나머지를 살린다', () => {
    const stored = {
      day: 3,
      guesses: [{ word: '바다', similarity: 10, rank: null, order: 1 }, { word: 1 }],
      status: 'x',
    };
    expect(parseRecord(stored, 3)).toEqual({
      day: 3,
      guesses: [{ word: '바다', similarity: 10, rank: null, order: 1 }],
      status: GUESS_STATUS.PLAYING,
      answer: null,
    });
  });
});

describe('addGuess', () => {
  it('추측을 순서대로 쌓고 같은 단어는 다시 넣지 않는다', () => {
    const once = addGuess(emptyRecord(3), result('바다', 20));
    const twice = addGuess(once, result('바다', 20));
    expect(twice.guesses).toEqual([{ word: '바다', similarity: 20, rank: 5, order: 1 }]);
  });

  it('정답을 맞히면 맞힌 상태와 정답을 기록한다', () => {
    const solved = addGuess(emptyRecord(3), result('사랑', 100, true));
    expect(solved).toMatchObject({ status: GUESS_STATUS.SOLVED, answer: '사랑' });
  });
});

describe('revealAnswer', () => {
  it('포기하면 정답을 공개하고, 이미 맞힌 기록은 그대로 둔다', () => {
    expect(revealAnswer(emptyRecord(3), { day: 3, word: '사랑' })).toMatchObject({
      status: GUESS_STATUS.GAVE_UP,
      answer: '사랑',
    });
    const solved = addGuess(emptyRecord(3), result('사랑', 100, true));
    expect(revealAnswer(solved, { day: 3, word: '사랑' })).toBe(solved);
  });
});

describe('sortBySimilarity', () => {
  it('유사도가 높은 순으로, 같으면 먼저 입력한 순으로 정렬한다', () => {
    const record = [result('a', 10), result('b', 30), result('c', 10)].reduce(addGuess, emptyRecord(3));
    expect(sortBySimilarity(record.guesses).map(({ word }) => word)).toEqual(['b', 'a', 'c']);
  });
});

describe('blockedGuessNotice', () => {
  it('한글 단어가 아니거나 이미 입력한 단어면 막는다', () => {
    const record = addGuess(emptyRecord(3), result('바다', 20));
    expect(blockedGuessNotice(record, 'sea')).toEqual({ kind: NOTICE_KIND.INVALID, word: 'sea' });
    expect(blockedGuessNotice(record, '바다')).toEqual({ kind: NOTICE_KIND.DUPLICATE, word: '바다' });
    expect(blockedGuessNotice(record, '하늘')).toBeNull();
  });
});

describe('solvedTries', () => {
  it('정답을 맞힌 뒤 더 입력해도 맞힌 순번을 센다', () => {
    const record = [result('바다', 20), result('사랑', 100, true), result('하늘', 30)].reduce(addGuess, emptyRecord(3));
    expect(solvedTries(record)).toBe(2);
    expect(solvedTries(emptyRecord(3))).toBeNull();
  });
});

describe('날짜 기준', () => {
  it('서버가 알려준 날짜 중 가장 최근 날짜를 쓴다', () => {
    expect(latestDay([null, undefined])).toBeNull();
    expect(latestDay([4, 3])).toBe(4);
  });

  it('자정을 넘겨 다음 날 응답이 오면 그날 기록으로 새로 시작해 추측이 보인다', () => {
    const yesterday = addGuess(emptyRecord(3), result('바다', 20));
    const today = addGuess(parseRecord(yesterday, 4), { ...result('하늘', 30), day: 4 });
    expect(parseRecord(today, latestDay([3, 4]) ?? 0).guesses.map(({ word }) => word)).toEqual(['하늘']);
  });

  it('저장된 기록의 날짜를 읽고, 형식이 다르면 null을 준다', () => {
    expect(storedDay({ day: 5 })).toBe(5);
    expect(storedDay('broken')).toBeNull();
  });
});
