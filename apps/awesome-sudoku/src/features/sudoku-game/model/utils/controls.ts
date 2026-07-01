import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";

/**
 * @description 힌트 제공
 * @param {SudokuBoard} board - 보드
 * @param {Grid} solution - 솔루션
 * @returns {GridPosition | null} 힌트 위치
 */
export function getHint(board: SudokuBoard, solution: Grid): { row: number; col: number; value: number } | null {
  const emptyCells: GridPosition[] = [];

  board.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.value === null) {
        emptyCells.push([rowIdx, colIdx]);
      }
    });
  });

  if (emptyCells.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const [row, col] = emptyCells[randomIndex];

  return { row, col, value: solution[row][col] };
}
