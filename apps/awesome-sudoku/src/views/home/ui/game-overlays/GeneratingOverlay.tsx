import { useAtomValue } from 'jotai';
import type { FC } from 'react';
import { isGeneratingAtom } from '../../model/store/primitives';
import { SudokuLoader } from './SudokuLoader';

export const GeneratingOverlay: FC = () => {
  const isGenerating = useAtomValue(isGeneratingAtom);

  if (!isGenerating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="새 퍼즐을 만드는 중"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-glass/(--overlay-opacity) backdrop-blur-md"
    >
      <SudokuLoader size="lg" />
      <span className="text-sm font-normal text-text-secondary">새 퍼즐을 만드는 중…</span>
    </div>
  );
};

export default GeneratingOverlay;
