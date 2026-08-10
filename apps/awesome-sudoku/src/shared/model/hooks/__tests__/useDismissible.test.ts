import { useDismissible } from '@shared/model/hooks';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useDismissible', () => {
  it('조건이 참이면 열리고, 사용자가 닫으면 그 회차에는 다시 안 열린다', () => {
    const { result } = renderHook(({ open }) => useDismissible(open), { initialProps: { open: true } });
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.dismiss());
    expect(result.current.isOpen).toBe(false);
  });

  it('조건이 거짓으로 떨어졌다 돌아오면 다시 열린다 — 닫은 기억은 회차마다 리셋된다', () => {
    const { result, rerender } = renderHook(({ open }) => useDismissible(open), { initialProps: { open: true } });
    act(() => result.current.dismiss());
    expect(result.current.isOpen).toBe(false);

    rerender({ open: false }); // 새 판 시작
    rerender({ open: true }); // 다음 회차 종료

    expect(result.current.isOpen).toBe(true);
  });

  it('처음부터 조건이 거짓이면 닫혀 있다', () => {
    const { result } = renderHook(({ open }) => useDismissible(open), { initialProps: { open: false } });
    expect(result.current.isOpen).toBe(false);
  });
});
