'use client';

import { useState } from 'react';

import { PuzzleVictory } from '@shared/ui/puzzle-victory';

import {
  CHECK_MESSAGES,
  INITIAL_SUDOKU_STATE,
  QUICK_SUDOKU_BOARDS,
  type QuickSudokuMode,
} from '@views/game-library/config/quickPuzzle';
import styles from '@views/game-library/ui/GameLibrary.module.css';
import { QuickBoard } from '@views/game-library/ui/QuickBoard';
import { QuickSudokuKeys } from '@views/game-library/ui/QuickSudokuKeys';

interface QuickPuzzleProps {
  mode?: QuickSudokuMode;
}

export function QuickPuzzle({ mode = 'classic' }: QuickPuzzleProps) {
  const [progress, setProgress] = useState(INITIAL_SUDOKU_STATE);
  const { boards, initial } = QUICK_SUDOKU_BOARDS[mode];
  const board = boards[progress.boardIndex] ?? initial;
  const isSolved = progress.result === 'solved';
  const canEnter = Boolean(progress.active) && !isSolved;

  function handleNumber(value: number): void {
    const { active, entries } = progress;
    if (!active) return;
    setProgress({ ...progress, entries: { ...entries, [active]: value }, result: 'playing' });
  }

  function handleSelect(id: string): void {
    setProgress({ ...progress, active: id, result: 'playing' });
  }

  function handleCheck(): void {
    const blanks = board.flatMap((row) => row.cells).filter((cell) => cell.isBlank);
    const isComplete = blanks.every((cell) => progress.entries[cell.id] !== undefined);
    if (!isComplete) {
      setProgress({ ...progress, result: 'incomplete' });
      return;
    }
    const isCorrect = blanks.every((cell) => progress.entries[cell.id] === cell.value);
    setProgress({ ...progress, result: isCorrect ? 'solved' : 'incorrect' });
  }

  function handleReset(): void {
    setProgress({ ...INITIAL_SUDOKU_STATE, boardIndex: (progress.boardIndex + 1) % boards.length });
  }

  return (
    <div className={styles.playArea}>
      <QuickBoard mode={mode} rows={board} selection={progress} onSelect={handleSelect} />
      <QuickSudokuKeys canEnter={canEnter} onNumber={handleNumber} />
      <div className={styles.feedback}>
        <p role="status">{isSolved ? <PuzzleVictory /> : CHECK_MESSAGES[progress.result]}</p>
        <button type="button" onClick={handleCheck} disabled={isSolved}>
          정답 확인
        </button>
        <button type="button" onClick={handleReset}>
          다른 판
        </button>
      </div>
    </div>
  );
}
