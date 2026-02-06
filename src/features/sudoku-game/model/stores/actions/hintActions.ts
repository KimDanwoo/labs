import { SudokuStoreActionCreator } from "@features/sudoku-game/model/stores/types";
import { buildGameResultState, resolveBoardState } from "@features/sudoku-game/model/stores/helpers/gameResult";
import {
  findEmptyCells, updateCellValue, updateSingleCell,
} from "@features/sudoku-game/model/utils";

export const createHintActions: SudokuStoreActionCreator<"getHint"> = (set, get) => ({
  getHint: () => {
    const { board, solution, hintsRemaining, gameMode, cages } = get();

    if (hintsRemaining <= 0) {
      alert("더 이상 힌트를 사용할 수 없습니다!");
      return;
    }

    const emptyCells = findEmptyCells(board);

    if (emptyCells.length === 0) {
      alert("모든 칸이 이미 채워져 있습니다!");
      return;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    const value = solution[row][col];

    let updatedBoard = updateCellValue(board, row, col, value);
    updatedBoard = updateSingleCell(
      updatedBoard, row, col, { isHint: true },
    );
    const { result } = resolveBoardState(
      updatedBoard, solution, gameMode, cages,
    );

    set({
      ...buildGameResultState(result),
      hintsRemaining: hintsRemaining - 1,
      selectedCell: { row, col },
    });

    get().countBoardNumbers();
    get().updateHighlights(row, col);
  },
});
