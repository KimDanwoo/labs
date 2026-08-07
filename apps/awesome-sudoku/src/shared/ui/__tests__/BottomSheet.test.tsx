import { BottomSheet } from '@shared/ui';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const ANIMATION_MS = 500;

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('BottomSheet', () => {
  it('부모가 isOpen을 내려 닫으면 onClose를 통지하지 않는다 (결과 시트가 다음 판에 안 뜨던 버그)', async () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    const { rerender } = render(
      <BottomSheet isOpen onClose={handleClose}>
        내용
      </BottomSheet>,
    );

    await advance(ANIMATION_MS * 2);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(
      <BottomSheet isOpen={false} onClose={handleClose}>
        내용
      </BottomSheet>,
    );
    await advance(ANIMATION_MS * 2);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handleClose).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('사용자가 배경을 눌러 닫으면 onClose를 통지한다', async () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={handleClose} title="결과">
        내용
      </BottomSheet>,
    );

    await advance(ANIMATION_MS * 2);
    const backdrop = screen.getByRole('dialog').previousElementSibling;
    expect(backdrop).not.toBeNull();
    await act(async () => {
      fireEvent.click(backdrop as Element);
    });
    await advance(ANIMATION_MS * 2);

    expect(handleClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
