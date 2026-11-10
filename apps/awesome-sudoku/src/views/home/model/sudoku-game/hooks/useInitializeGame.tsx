import { GAME_LEVEL, boardAtom, initializeGameAtom } from '@entities/game';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

export const useInitializeGame = () => {
  const initializeGame = useSetAtom(initializeGameAtom);
  const board = useAtomValue(boardAtom);

  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell.value === null && !cell.isInitial));

    if (isEmpty) {
      initializeGame(GAME_LEVEL.MEDIUM);
    }
  }, [board, initializeGame]);
};
