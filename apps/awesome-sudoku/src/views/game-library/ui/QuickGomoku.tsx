'use client';

import { useState } from 'react';

import { Button } from '@shared/ui/button';
import { PuzzleVictory } from '@shared/ui/puzzle-victory';

import {
  INITIAL_GOMOKU,
  QUICK_GOMOKU_BOARDS,
  QUICK_GOMOKU_CELLS,
  TURN_TEXT,
} from '@views/game-library/config/quickGomoku';
import styles from '@views/game-library/ui/GameLibrary.module.css';

export function QuickGomoku() {
  const [game, setGame] = useState(INITIAL_GOMOKU);
  const board = QUICK_GOMOKU_BOARDS[game.position] ?? QUICK_GOMOKU_BOARDS[0];
  const isOpening = game.turn === 'opening';
  const isSolved = game.turn === 'solved';
  const black = isOpening ? board.black : [...board.black, board.setup];
  const white = isOpening ? board.white : [...board.white, board.defense];

  const status = game.hasMistake ? '이 자리로는 두 수 안에 이을 수 없어요.' : TURN_TEXT[game.turn];

  function handleMove(id: number): void {
    const target = isOpening ? board.setup : board.winning;
    if (id !== target) {
      setGame({ ...game, hasMistake: true });
      return;
    }
    setGame({ ...game, turn: isOpening ? 'finish' : 'solved', hasMistake: false });
  }

  function handleReset(): void {
    setGame({ ...INITIAL_GOMOKU, position: (game.position + 1) % QUICK_GOMOKU_BOARDS.length });
  }

  return (
    <div className={styles.playArea}>
      <div className={styles.gomokuBoard} role="group" aria-label="오목판">
        {QUICK_GOMOKU_CELLS.map(({ id, row, column }) => {
          const isWinningStone = isSolved && id === board.winning;
          const isBlack = black.includes(id) || isWinningStone;
          const isWhite = white.includes(id);
          const stone = isBlack ? '흑돌' : '빈 교차점';
          const content = isWhite ? '백돌' : stone;
          const isOccupied = isBlack || isWhite;

          return (
            <button
              key={id}
              type="button"
              aria-label={`${row}행 ${column}열 ${content}`}
              disabled={isOccupied || isSolved}
              data-stone={content}
              data-winning={isWinningStone}
              onClick={() => handleMove(id)}
            />
          );
        })}
      </div>
      <div className={styles.feedback}>
        <p role="status">{isSolved ? <PuzzleVictory /> : status}</p>
        <Button variant="surface" size="s" onClick={handleReset}>
          다른 판
        </Button>
      </div>
    </div>
  );
}
