'use client';

import { useState } from 'react';

import { Button } from '@shared/ui/button';
import { PuzzleVictory } from '@shared/ui/puzzle-victory';

import { LOOP_BOARDS, LOOP_SLOTS } from '@views/game-library/config/quickLoop';
import styles from '@views/game-library/ui/GameLibrary.module.css';

export function QuickLoop() {
  const [position, setPosition] = useState(0);
  const [lines, setLines] = useState(LOOP_BOARDS[0].start);
  const board = LOOP_BOARDS[position] ?? LOOP_BOARDS[0];
  const hasAllLines = lines.length === board.solution.length;
  const isSolved = hasAllLines && board.solution.every((line) => lines.includes(line));

  function handleLine(id: number): void {
    setLines((current) => (current.includes(id) ? current.filter((line) => line !== id) : [...current, id]));
  }

  function handleReset(): void {
    const next = (position + 1) % LOOP_BOARDS.length;
    setPosition(next);
    setLines((LOOP_BOARDS[next] ?? LOOP_BOARDS[0]).start);
  }

  return (
    <div className={styles.playArea}>
      <div className={styles.stage}>
        <div className={styles.loopBoard} role="group" aria-label="슬리더링크 판">
          {LOOP_SLOTS.map((slot) => {
            if (slot.kind === 'dot') return <span key={slot.id} className={styles.loopDot} aria-hidden="true" />;
            if (slot.kind === 'clue') return <span key={slot.id}>{board.clues[slot.clue]}</span>;
            return (
              <button
                key={slot.id}
                type="button"
                aria-label={`${slot.label} ${slot.isHorizontal ? '가로선' : '세로선'}`}
                aria-pressed={lines.includes(slot.id)}
                data-direction={slot.isHorizontal ? 'horizontal' : 'vertical'}
                disabled={board.start.includes(slot.id) || isSolved}
                onClick={() => handleLine(slot.id)}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.feedback}>
        <p role="status">{isSolved ? <PuzzleVictory /> : '선을 누르면 켜거나 지울 수 있어요.'}</p>
        <div className={styles.actions}>
          <Button variant="surface" size="s" onClick={handleReset}>
            다른 판
          </Button>
        </div>
      </div>
    </div>
  );
}
