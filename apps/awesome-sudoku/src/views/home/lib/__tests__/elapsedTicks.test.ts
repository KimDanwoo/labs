import { elapsedTicks } from '@views/home/lib/elapsedTicks';
import { describe, expect, it } from 'vitest';

const SECOND = 1000;

describe('elapsedTicks', () => {
  it('제때 온 1초 틱은 1초를 더한다', () => {
    expect(elapsedTicks(SECOND, SECOND)).toEqual({ ticks: 1, carryMs: 0 });
  });

  it('탭이 뒤에 있어 늦게 온 틱은 흐른 만큼 더하고 남은 시간을 넘긴다', () => {
    expect(elapsedTicks(61_400, SECOND)).toEqual({ ticks: 61, carryMs: 400 });
  });

  it('1초가 안 되면 더하지 않고 다음 틱으로 넘긴다', () => {
    expect(elapsedTicks(600, SECOND)).toEqual({ ticks: 0, carryMs: 600 });
  });

  it('시계가 뒤로 가도 음수를 더하지 않는다', () => {
    expect(elapsedTicks(-500, SECOND)).toEqual({ ticks: 0, carryMs: 0 });
  });
});
