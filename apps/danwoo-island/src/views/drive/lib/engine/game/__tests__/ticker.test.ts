import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Ticker } from '@views/drive/lib/engine/game/ticker';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';

const FRAME_MS = 16;
const FAST_FRAME_MS = 8;
const FAST_FRAMES = 8;

describe('Ticker', () => {
  it('wait 콜백은 지정한 프레임에서 tick 리스너보다 먼저 한 번 실행한다', () => {
    const ticker = new Ticker();
    const calls: string[] = [];
    ticker.events.on('tick', () => calls.push('tick'));
    ticker.wait(2, () => calls.push('wait'));
    ticker.update(FRAME_MS);
    ticker.update(FRAME_MS * 2);
    ticker.update(FRAME_MS * 3);
    assert.deepEqual(calls, ['tick', 'wait', 'tick', 'tick']);
  });

  it('0프레임 wait 콜백은 다음 프레임에 실행한다', () => {
    const ticker = new Ticker();
    const calls: string[] = [];
    ticker.wait(0, () => calls.push('wait'));
    ticker.update(FRAME_MS);
    ticker.update(FRAME_MS * 2);
    assert.deepEqual(calls, ['wait']);
  });

  it('120Hz 화면에서는 한 프레임씩 건너뛰어 60프레임으로 돈다', () => {
    const ticker = new Ticker();
    let ticks = 0;
    ticker.events.on('tick', () => {
      ticks += 1;
    });
    for (let frame = 1; frame <= FAST_FRAMES; frame += 1) ticker.update(frame * FAST_FRAME_MS);
    assert.equal(ticks, FAST_FRAMES / 2);
  });

  it('delta는 maxDelta로 제한하고 scale을 곱해 누적한다', () => {
    const ticker = new Ticker();
    ticker.update(1000);
    assert.equal(ticker.delta, ticker.maxDelta);
    assert.equal(ticker.elapsedScaled, ticker.maxDelta * ticker.scale);
  });
});

describe('TICK_ORDER', () => {
  it('프레임 실행 순서대로 적혀 있다', () => {
    const orders: number[] = Object.values(TICK_ORDER);
    assert.deepEqual(
      orders,
      [...orders].sort((a, b) => a - b),
    );
  });
});
