import { isValidGuess, normalizeGuess } from '@entities/guess-word/lib/guessInput';
import { describe, expect, it } from 'vitest';

describe('normalizeGuess', () => {
  it('공백을 지우고 NFC로 맞춘다', () => {
    expect(normalizeGuess(' 사 랑 ')).toBe('사랑');
    expect(normalizeGuess('사랑'.normalize('NFD'))).toBe('사랑');
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
