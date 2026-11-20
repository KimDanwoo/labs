import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { initialLevel, QUALITY, Quality } from '@views/drive/lib/engine/game/quality';

const DESKTOP = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130', maxTouchPoints: 0 };
const IPAD = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', maxTouchPoints: 5 };
const PHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile', maxTouchPoints: 5 };
const FAST = { delta: 1 / 60, deltaAverage: 1 / 60 };
const SLOW = { delta: 1 / 12, deltaAverage: 1 / 30 };

function clock(): (quality: Quality, frame: typeof FAST, seconds: number) => void {
  let elapsed = 0;
  return (quality, frame, seconds) => {
    for (const end = elapsed + seconds; elapsed < end; elapsed += frame.delta) {
      quality.observeFrame({ elapsed, deltaAverage: frame.deltaAverage });
    }
  };
}

describe('initialLevel', () => {
  it('데스크톱은 고품질, 휴대폰과 데스크톱 UA로 오는 아이패드는 저품질로 시작한다', () => {
    assert.equal(initialLevel(DESKTOP), QUALITY.high);
    assert.equal(initialLevel(PHONE), QUALITY.low);
    assert.equal(initialLevel(IPAD), QUALITY.low);
  });
});

describe('Quality.observeFrame', () => {
  it('고품질에서 40fps 아래가 3초 넘게 이어지면 한 번 낮추고 알린다', () => {
    const quality = new Quality(DESKTOP);
    const run = clock();
    const changes: number[] = [];
    quality.events.on('change', (level) => changes.push(level));
    run(quality, FAST, 10);
    run(quality, SLOW, 3.5);
    assert.equal(quality.level, QUALITY.low);
    assert.deepEqual(changes, [QUALITY.low]);
  });

  it('로딩 중(처음 8초)과 잠깐의 끊김은 보지 않는다', () => {
    const quality = new Quality(DESKTOP);
    const run = clock();
    run(quality, SLOW, 7);
    run(quality, FAST, 2);
    run(quality, SLOW, 2);
    run(quality, FAST, 1);
    assert.equal(quality.level, QUALITY.high);
  });

  it('사용자가 직접 고른 품질은 자동으로 바꾸지 않는다', () => {
    const quality = new Quality(DESKTOP);
    const run = clock();
    quality.changeLevel(QUALITY.high);
    run(quality, FAST, 10);
    run(quality, SLOW, 10);
    assert.equal(quality.level, QUALITY.high);
  });
});
