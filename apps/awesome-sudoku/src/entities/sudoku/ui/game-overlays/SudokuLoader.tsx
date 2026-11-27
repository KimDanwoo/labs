'use client';

import { memo } from 'react';

import { cn } from '@shared/lib/cn';

import {
  LOADER_DELAY_STEP_S,
  LOADER_GRID_DIVISIONS,
  LOADER_SIZE,
  SUDOKU_NUMBERS,
  type LoaderSize,
} from '@entities/sudoku/config/loader';
import styles from '@entities/sudoku/ui/game-overlays/SudokuLoader.module.css';

interface SudokuLoaderProps {
  size?: LoaderSize;
  className?: string;
}

export const SudokuLoader = memo<SudokuLoaderProps>(({ size = 'md', className }) => {
  const config = LOADER_SIZE[size];
  const lineSpacing = config.grid / LOADER_GRID_DIVISIONS;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(styles.grid, 'relative grid grid-cols-3 rounded-lg overflow-hidden')}
        style={{ width: config.grid, height: config.grid, gap: config.gap, padding: config.gap }}
      >
        {SUDOKU_NUMBERS.map((num, index) => (
          <div
            key={num}
            className={cn(
              'flex items-center justify-center bg-surface-primary rounded-sm font-bold text-accent animate-[sudokuPulse_1.8s_ease-in-out_infinite]',
              config.text,
            )}
            style={{ animationDelay: `${index * LOADER_DELAY_STEP_S}s` }}
          >
            {num}
          </div>
        ))}

        <div
          className={cn(styles.gridLines, 'absolute inset-0 pointer-events-none')}
          style={{ backgroundSize: `${lineSpacing}px ${lineSpacing}px` }}
        />
      </div>
    </div>
  );
});

SudokuLoader.displayName = 'SudokuLoader';
