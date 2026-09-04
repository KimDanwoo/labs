import { isGeneratingAtom } from '@features/sudoku-game/model/atoms';
import { cn } from '@shared/model/utils';
import { SudokuLoader } from '@shared/ui';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';

/** 워커가 새 판을 만드는 동안 보드를 덮는다 — 이전 판을 건드리지 못하게 포인터도 막는다 */
export const GeneratingOverlay: FC = () => {
  const isGenerating = useAtomValue(isGeneratingAtom);

  if (!isGenerating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="새 퍼즐을 만드는 중"
      className={cn(
        'absolute inset-0 z-30',
        'flex flex-col items-center justify-center gap-4',
        'bg-[rgb(var(--color-glass))]/(--overlay-opacity) backdrop-blur-md',
      )}
    >
      <SudokuLoader size="lg" />
      <span className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">새 퍼즐을 만드는 중…</span>
    </div>
  );
};

export default GeneratingOverlay;
