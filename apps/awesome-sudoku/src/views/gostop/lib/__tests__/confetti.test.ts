import { CONFETTI, CONFETTI_START_MS } from '@views/gostop/config/result';
import { confettiStyle } from '@views/gostop/lib/confetti';
import { describe, expect, it } from 'vitest';

describe('승리 축하 조각', () => {
  it('조각 위치·지연·회전을 설정값 그대로 스타일로 옮긴다', () => {
    expect(confettiStyle({ left: 6, delayMs: 100, turn: -30 })).toEqual({
      left: '6%',
      animationDelay: `${100 + CONFETTI_START_MS}ms`,
      '--turn': '-30deg',
    });
  });

  it('조각마다 가로 위치가 겹치지 않는다', () => {
    expect(new Set(CONFETTI.map((piece) => piece.left)).size).toBe(CONFETTI.length);
  });
});
