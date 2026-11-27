import { describe, expect, it } from 'vitest';

import { centeredScrollLeft, keyToPosition, stepPosition, swipeStep } from '@views/game-library/lib/trialNavigation';

const LENGTH = 6;
const MIN_SWIPE = 48;

describe('stepPosition', () => {
  it('처음에서 뒤로 가면 마지막으로 돈다', () => {
    expect(stepPosition(0, -1, LENGTH)).toBe(5);
  });

  it('마지막에서 앞으로 가면 처음으로 돈다', () => {
    expect(stepPosition(5, 1, LENGTH)).toBe(0);
  });
});

describe('keyToPosition', () => {
  it('화살표·Home·End를 위치로 바꾼다', () => {
    expect(keyToPosition('ArrowRight', 2, LENGTH)).toBe(3);
    expect(keyToPosition('ArrowLeft', 0, LENGTH)).toBe(5);
    expect(keyToPosition('Home', 4, LENGTH)).toBe(0);
    expect(keyToPosition('End', 1, LENGTH)).toBe(5);
  });

  it('다른 키는 무시한다', () => {
    expect(keyToPosition('Enter', 1, LENGTH)).toBeNull();
  });
});

describe('swipeStep', () => {
  it('왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전이다', () => {
    expect(swipeStep({ x: 200, y: 0 }, { x: 100, y: 10 }, MIN_SWIPE)).toBe(1);
    expect(swipeStep({ x: 100, y: 0 }, { x: 200, y: 10 }, MIN_SWIPE)).toBe(-1);
  });

  it('짧거나 세로로 더 움직이면 넘기지 않는다', () => {
    expect(swipeStep({ x: 100, y: 0 }, { x: 130, y: 0 }, MIN_SWIPE)).toBeNull();
    expect(swipeStep({ x: 100, y: 0 }, { x: 160, y: 120 }, MIN_SWIPE)).toBeNull();
  });
});

describe('centeredScrollLeft', () => {
  it('항목이 가운데 오도록 스크롤 위치를 구한다', () => {
    expect(centeredScrollLeft(400, 100, 300)).toBe(300);
  });

  it('앞쪽 항목은 0보다 작게 가지 않는다', () => {
    expect(centeredScrollLeft(20, 80, 390)).toBe(0);
  });
});
