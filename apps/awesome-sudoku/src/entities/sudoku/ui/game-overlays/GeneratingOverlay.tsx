import { isGeneratingAtom } from '@entities/sudoku/model/store/primitives';
import { SudokuLoader } from '@entities/sudoku/ui/game-overlays/SudokuLoader';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';

export const GeneratingOverlay: FC = () => {
  const isGenerating = useAtomValue(isGeneratingAtom);

  if (!isGenerating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="새 퍼즐을 만드는 중"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-surface-primary/95"
    >
      <SudokuLoader size="lg" />
      <span className="text-sm font-normal text-text-secondary">새 퍼즐을 만드는 중…</span>
    </div>
  );
};

export default GeneratingOverlay;
