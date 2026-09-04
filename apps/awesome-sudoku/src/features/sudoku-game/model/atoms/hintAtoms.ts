import { buildGameResultState, resolveBoardState } from '@features/sudoku-game/model/helpers';
import { updateCellValue, updateSingleCell } from '@features/sudoku-game/model/utils';
import { atom } from 'jotai';
import {
  boardAtom,
  cagesAtom,
  gameModeAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isSuccessAtom,
  selectedCellAtom,
  solutionAtom,
  timerActiveAtom,
} from './primitives';
import { updateHighlightsAtom } from './selectionAtoms';
import { countBoardNumbersAtom } from './statusAtoms';

/** 힌트 제공 — 선택한 칸이 비었거나 틀렸으면 그 칸을, 아니면 아직 못 맞힌 칸 중 하나를 채운다 */
export const getHintAtom = atom(null, (get, set) => {
  const board = get(boardAtom);
  const solution = get(solutionAtom);
  const hintsRemaining = get(hintsRemainingAtom);
  const gameMode = get(gameModeAtom);
  const cages = get(cagesAtom);
  const selectedCell = get(selectedCellAtom);

  if (hintsRemaining <= 0) {
    alert('더 이상 힌트를 사용할 수 없습니다!');
    return;
  }

  const isUnsolved = (r: number, c: number): boolean => !board[r][c].isInitial && board[r][c].value !== solution[r][c];
  const unsolvedCells = board.flatMap((cells, r) =>
    cells.flatMap((_, c) => (isUnsolved(r, c) ? [{ row: r, col: c }] : [])),
  );

  if (unsolvedCells.length === 0) {
    alert('모든 칸이 이미 맞게 채워져 있습니다!');
    return;
  }

  const { row, col } =
    selectedCell && isUnsolved(selectedCell.row, selectedCell.col)
      ? selectedCell
      : unsolvedCells[Math.floor(Math.random() * unsolvedCells.length)];
  const value = solution[row][col];

  let updatedBoard = updateCellValue(board, row, col, value);
  updatedBoard = updateSingleCell(updatedBoard, row, col, { isHint: true });
  const { result } = resolveBoardState(updatedBoard, solution, gameMode, cages);
  const state = buildGameResultState(result);

  set(boardAtom, state.board);
  set(isCompletedAtom, state.isCompleted);
  set(isSuccessAtom, state.isSuccess);
  set(timerActiveAtom, state.timerActive);
  set(hintsRemainingAtom, hintsRemaining - 1);
  set(selectedCellAtom, { row, col });

  set(countBoardNumbersAtom);
  set(updateHighlightsAtom, { row, col });
});
