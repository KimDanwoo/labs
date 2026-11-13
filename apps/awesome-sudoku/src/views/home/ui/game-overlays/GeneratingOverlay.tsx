import { isGeneratingAtom } from '@entities/game';
import { cn } from '@shared/lib/cn';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';
import { SudokuLoader } from './SudokuLoader';

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
      <span className="text-sm font-normal text-[rgb(var(--color-text-secondary))]">새 퍼즐을 만드는 중…</span>
    </div>
  );
};

export default GeneratingOverlay;
