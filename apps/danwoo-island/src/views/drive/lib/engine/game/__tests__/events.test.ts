import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Events } from '@views/drive/lib/engine/game/events';

describe('Events', () => {
  it('order 오름차순으로 호출하고 인자를 그대로 넘긴다', () => {
    const events = new Events<{ tick: [number] }>();
    const calls: string[] = [];
    events.on('tick', (delta) => calls.push(`late:${delta}`), 10);
    events.on('tick', (delta) => calls.push(`early:${delta}`), 0);
    events.on('tick', (delta) => calls.push(`default:${delta}`));
    events.trigger('tick', 16);
    assert.deepEqual(calls, ['early:16', 'default:16', 'late:16']);
  });

  it('같은 order는 등록한 순서대로 호출한다', () => {
    const events = new Events<{ tick: [] }>();
    const calls: string[] = [];
    events.on('tick', () => calls.push('first'), 10);
    events.on('tick', () => calls.push('early'), 0);
    events.on('tick', () => calls.push('second'), 10);
    events.on('tick', () => calls.push('third'), 10);
    events.trigger('tick');
    assert.deepEqual(calls, ['early', 'first', 'second', 'third']);
  });

  it('off는 지정한 리스너만, 인자가 없으면 이벤트 전체를 지운다', () => {
    const events = new Events<{ ping: [] }>();
    let count = 0;
    const listener = (): void => {
      count += 1;
    };
    events.on('ping', listener).on('ping', () => (count += 10));
    events.off('ping', listener).trigger('ping');
    assert.equal(count, 10);
    events.off('ping').trigger('ping');
    assert.equal(count, 10);
  });
});
