import { isKeyboardClick, shouldFocusHand } from '@views/gostop/lib/focus';
import { describe, expect, it } from 'vitest';

describe('딜 뒤 손패 포커스', () => {
  it('키보드로 누른 클릭만 키보드 시작으로 본다', () => {
    expect(isKeyboardClick({ detail: 0 })).toBe(true);
    expect(isKeyboardClick({ detail: 1 })).toBe(false);
  });

  it('요청이 있고 딜 재생이 끝났으며 손패가 있을 때만 옮긴다', () => {
    expect(shouldFocusHand(true, true, 10)).toBe(true);
    expect(shouldFocusHand(false, true, 10)).toBe(false);
    expect(shouldFocusHand(true, false, 10)).toBe(false);
    expect(shouldFocusHand(true, true, 0)).toBe(false);
  });
});
