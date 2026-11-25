import { isValidGuess, normalizeGuess, readGuessWord } from '@entities/guess-word/lib/guessInput';
import { describe, expect, it } from 'vitest';

describe('normalizeGuess', () => {
  it('공백을 지우고 NFC로 맞춘다', () => {
    expect(normalizeGuess(' 사 랑 ')).toBe('사랑');
    expect(normalizeGuess('사랑'.normalize('NFD'))).toBe('사랑');
  });

  it.each([
    ['수요일날', '수요일'],
    ['토요일날', '토요일'],
    ['금욜', '금요일'],
    ['요일날', '요일날'],
  ])('같은 뜻의 다른 표기 %s는 %s로 맞춘다', (raw, expected) => {
    expect(normalizeGuess(raw)).toBe(expected);
  });
});

describe('isValidGuess', () => {
  it.each(['사랑', '고속도로', '눈'])('완성형 한글 단어 %s는 받는다', (word) => {
    expect(isValidGuess(word)).toBe(true);
  });

  it.each(['', 'love', 'ㅋㅋ', '사랑1', '가나다라마바사아자'])('%s는 거른다', (word) => {
    expect(isValidGuess(word)).toBe(false);
  });
});

describe('readGuessWord', () => {
  it('요청 본문에서 word 문자열만 꺼내고, 형식이 다르면 빈 문자열을 준다', () => {
    expect(readGuessWord({ word: '바다' })).toBe('바다');
    expect(readGuessWord({ word: 1 })).toBe('');
    expect(readGuessWord(null)).toBe('');
  });
});
