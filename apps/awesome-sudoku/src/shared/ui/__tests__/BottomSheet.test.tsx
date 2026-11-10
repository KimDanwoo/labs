import { BottomSheet } from '@shared/ui/bottom-sheet';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('BottomSheet 상호작용', () => {
  const SHEET_HEIGHT = 400;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(SHEET_HEIGHT);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderOpen = async () => {
    const handleClose = vi.fn();
    const view = render(
      <BottomSheet isOpen onClose={handleClose} title="결과">
        <button>첫째</button>
        <button>둘째</button>
      </BottomSheet>,
    );
    await advance(ANIMATION_MS * 2);
    return { ...view, handleClose };
  };

  const drag = async (distance: number, durationMs: number) => {
    const handle = screen.getByRole('dialog').firstElementChild as Element;
    await act(async () => {
      fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    });
    await advance(durationMs);
    await act(async () => {
      fireEvent.pointerMove(handle, { clientY: 100 + distance, pointerId: 1 });
      fireEvent.pointerUp(handle, { pointerId: 1 });
    });
  };

  it('Escape로 닫으면 onClose를 통지하고 열기 전 포커스로 돌아간다', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { handleClose } = await renderOpen();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await advance(ANIMATION_MS * 2);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('Tab은 시트 안의 첫 요소와 마지막 요소 사이를 순환한다', async () => {
    await renderOpen();
    const first = screen.getByText('첫째');
    const last = screen.getByText('둘째');

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('열려 있는 동안 배경 스크롤을 막고, 닫히면 푼다', async () => {
    const { rerender, handleClose } = await renderOpen();
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <BottomSheet isOpen={false} onClose={handleClose}>
        내용
      </BottomSheet>,
    );
    await advance(ANIMATION_MS * 2);

    expect(document.body.style.overflow).toBe('');
  });

  it('시트 높이의 임계 비율을 넘게 끌어내리면 닫힌다', async () => {
    const { handleClose } = await renderOpen();
    await drag(SHEET_HEIGHT * 0.5, 1000);
    await advance(ANIMATION_MS * 2);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('짧게 끌어도 빠르게 튕기면 닫힌다', async () => {
    const { handleClose } = await renderOpen();
    await drag(SHEET_HEIGHT * 0.15, 50);
    await advance(ANIMATION_MS * 2);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('조금만 천천히 끌면 제자리로 돌아오고 닫히지 않는다', async () => {
    const { handleClose } = await renderOpen();
    await drag(SHEET_HEIGHT * 0.1, 1000);
    await advance(ANIMATION_MS * 2);

    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog').style.transform).toBe('translateY(0)');
  });
});
