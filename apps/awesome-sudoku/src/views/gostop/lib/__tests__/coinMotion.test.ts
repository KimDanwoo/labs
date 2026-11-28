import { COIN_FLIGHT_START_MS, COIN_FLYER_GAP_MS, COIN_RAIN, COIN_RAIN_START_MS } from '@views/gostop/config/purse';
import { coinFlyerStyle, coinRainStyle } from '@views/gostop/lib/coinMotion';
import { describe, expect, it } from 'vitest';

describe('엽전 연출', () => {
  it('날아가는 엽전은 순서대로 조금씩 늦게 출발한다', () => {
    expect(coinFlyerStyle(0)).toEqual({ animationDelay: `${COIN_FLIGHT_START_MS}ms` });
    expect(coinFlyerStyle(2)).toEqual({ animationDelay: `${COIN_FLIGHT_START_MS + 2 * COIN_FLYER_GAP_MS}ms` });
  });

  it('올인 엽전 비는 위치·지연·회전을 설정값 그대로 옮긴다', () => {
    expect(coinRainStyle({ left: 13, delayMs: 300, spin: -420 })).toEqual({
      left: '13%',
      animationDelay: `${300 + COIN_RAIN_START_MS}ms`,
      '--spin': '-420deg',
    });
  });

  it('엽전 비는 가로 위치가 겹치지 않는다', () => {
    expect(new Set(COIN_RAIN.map((drop) => drop.left)).size).toBe(COIN_RAIN.length);
  });
});
