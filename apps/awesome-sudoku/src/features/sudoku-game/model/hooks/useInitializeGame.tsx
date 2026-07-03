import { GAME_LEVEL } from '@entities/game/model/constants';
import { boardAtom, initializeGameAtom } from '@features/sudoku-game/model/atoms';
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
