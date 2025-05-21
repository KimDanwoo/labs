import { useSudokuStore } from "@entities/sudoku/model/stores";
import { useEffect } from "react";
import { GAME_LEVEL } from "../constants";

export const useInitializeGame = () => {
  const initializeGame = useSudokuStore((state) => state.initializeGame);
  const board = useSudokuStore((state) => state.board);

  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell.value === null && !cell.isInitial));

    if (isEmpty) {
      initializeGame(GAME_LEVEL.MEDIUM);
    }
  }, [board, initializeGame]);
};
