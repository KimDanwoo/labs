import { KEY_NUMBER } from '@entities/sudoku/config/board';
import { cn } from '@shared/lib/cn';
import { memo } from 'react';

interface CellNotesProps {
  notes: number[];
  hasCageLabel: boolean;
}

export const CellNotes = memo(function CellNotes({ notes, hasCageLabel }: CellNotesProps) {
  return (
    <div className={cn('grid grid-cols-3 grid-rows-3 gap-0 w-full h-full p-0.5', hasCageLabel && 'pt-3.5')}>
      {KEY_NUMBER.map((num) => (
        <div key={num} className="flex items-center justify-center w-full h-full">
          {notes.includes(num) && (
            <span className="text-[9px] lg:text-[10px] leading-none text-accent-text font-normal">{num}</span>
          )}
        </div>
      ))}
    </div>
  );
});

CellNotes.displayName = 'CellNotes';
