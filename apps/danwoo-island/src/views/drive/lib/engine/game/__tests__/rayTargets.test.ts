import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  focusTarget,
  isClickTravel,
  nearestHit,
  pressTarget,
  type RayTarget,
  releaseTargets,
} from '@views/drive/lib/engine/game/rayTargets';

interface RecordedTarget extends RayTarget {
  name: string;
}

function recordedTargets(calls: string[], ...names: string[]): RecordedTarget[] {
  return names.map((name) => ({
    name,
    active: true,
    isIntersecting: false,
    isDown: false,
    onEnter: () => calls.push(`${name}:enter`),
    onLeave: () => calls.push(`${name}:leave`),
    onDown: () => calls.push(`${name}:down`),
    onUp: () => calls.push(`${name}:up`),
    onClick: () => calls.push(`${name}:click`),
  }));
}

describe('nearestHit', () => {
  it('가장 가까운 대상을 고르고 맞지 않은 대상은 건너뛴다', () => {
    const distances = new Map([
      ['far', 9],
      ['miss', null],
      ['near', 2],
    ]);
    assert.equal(
      nearestHit([...distances.keys()], (name) => distances.get(name) ?? null),
      'near',
    );
  });

  it('거리가 같으면 먼저 등록된 대상을 유지한다', () => {
    assert.equal(
      nearestHit(['first', 'second'], () => 5),
      'first',
    );
  });

  it('아무것도 맞지 않으면 null', () => {
    assert.equal(
      nearestHit(['a'], () => null),
      null,
    );
  });
});

describe('focusTarget', () => {
  it('이전 대상에서 나간 뒤 새 대상에 들어간다', () => {
    const calls: string[] = [];
    const [first, second] = recordedTargets(calls, 'first', 'second');
    assert.ok(first && second);
    focusTarget([first, second], first);
    focusTarget([first, second], second);
    assert.deepEqual(calls, ['first:enter', 'first:leave', 'second:enter']);
    assert.deepEqual([first.isIntersecting, second.isIntersecting], [false, true]);
  });

  it('이미 들어가 있는 대상은 다시 알리지 않는다', () => {
    const calls: string[] = [];
    const [only] = recordedTargets(calls, 'only');
    assert.ok(only);
    focusTarget([only], only);
    focusTarget([only], only);
    assert.deepEqual(calls, ['only:enter']);
  });
});

describe('isClickTravel', () => {
  it('포인터 이동 거리가 25px 미만이면 클릭이다', () => {
    assert.equal(isClickTravel({ x: 15, y: 19.9 }), true);
    assert.equal(isClickTravel({ x: 15, y: 20 }), false);
  });
});

describe('releaseTargets', () => {
  it('누른 대상 위에서 떼면 up 다음 click', () => {
    const calls: string[] = [];
    const [button] = recordedTargets(calls, 'button');
    assert.ok(button);
    focusTarget([button], button);
    pressTarget(button);
    releaseTargets([button], true);
    assert.deepEqual(calls, ['button:enter', 'button:down', 'button:up', 'button:click']);
    assert.equal(button.isDown, false);
  });

  it('up은 눌린 상태에서, click은 눌림이 풀린 뒤에 호출한다', () => {
    const states: string[] = [];
    const [button] = recordedTargets([], 'button');
    assert.ok(button);
    button.onUp = () => states.push(`up:${String(button.isDown)}`);
    button.onClick = () => states.push(`click:${String(button.isDown)}`);
    focusTarget([button], button);
    pressTarget(button);
    releaseTargets([button], true);
    assert.deepEqual(states, ['up:true', 'click:false']);
  });

  it('끌다 떼면 click 없이 up만', () => {
    const calls: string[] = [];
    const [button] = recordedTargets(calls, 'button');
    assert.ok(button);
    focusTarget([button], button);
    pressTarget(button);
    releaseTargets([button], false);
    assert.deepEqual(calls, ['button:enter', 'button:down', 'button:up']);
  });

  it('누른 뒤 벗어나서 떼면 leave 다음 up, click은 없다', () => {
    const calls: string[] = [];
    const [button] = recordedTargets(calls, 'button');
    assert.ok(button);
    focusTarget([button], button);
    pressTarget(button);
    focusTarget([button], null);
    releaseTargets([button], true);
    assert.deepEqual(calls, ['button:enter', 'button:down', 'button:leave', 'button:up']);
  });

  it('누르지 않은 대상도 위에 있으면 up을 받고, 꺼진 대상은 건너뛴다', () => {
    const calls: string[] = [];
    const [hovered, inactive] = recordedTargets(calls, 'hovered', 'inactive');
    assert.ok(hovered && inactive);
    focusTarget([hovered], hovered);
    inactive.isIntersecting = true;
    inactive.isDown = true;
    inactive.active = false;
    releaseTargets([hovered, inactive], true);
    assert.deepEqual(calls, ['hovered:enter', 'hovered:up']);
    assert.equal(inactive.isDown, true);
  });
});
