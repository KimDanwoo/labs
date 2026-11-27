import { describe, expect, it } from 'vitest';

import { keyToPosition, stepPosition } from '@shared/lib/rovingIndex';

const LENGTH = 6;

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
