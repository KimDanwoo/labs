import { GAME_PHASE } from '@entities/sudoku/config/game';
import { atIndex, cellAt } from '@entities/sudoku/lib/gridAccess';
import { buildGameResultState, resolveBoardState } from '@entities/sudoku/model/services/gameResult';
import { updateCellValue, updateSingleCell } from '@entities/sudoku/model/services/update';
import { pushStateAtom } from '@entities/sudoku/model/store/historyAtoms';
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
} from '@entities/sudoku/model/store/primitives';
import { updateHighlightsAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { countBoardNumbersAtom, gamePhaseAtom } from '@entities/sudoku/model/store/statusAtoms';
import { atom } from 'jotai';

export const getHintAtom = atom(null, (get, set) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;
  const board = get(boardAtom);
  const solution = get(solutionAtom);
  const hintsRemaining = get(hintsRemainingAtom);
  const gameMode = get(gameModeAtom);
  const cages = get(cagesAtom);
  const selectedCell = get(selectedCellAtom);

  if (hintsRemaining <= 0) return;

  const isUnsolved = (r: number, c: number): boolean =>
    !cellAt(board, r, c).isInitial && cellAt(board, r, c).value !== cellAt(solution, r, c);
  const unsolvedCells = board.flatMap((cells, r) =>
    cells.flatMap((_, c) => (isUnsolved(r, c) ? [{ row: r, col: c }] : [])),
  );

  if (unsolvedCells.length === 0) return;

  const isSelectedUnsolved = selectedCell !== null && isUnsolved(selectedCell.row, selectedCell.col);
  const { row, col } = isSelectedUnsolved
    ? selectedCell
    : atIndex(unsolvedCells, Math.floor(Math.random() * unsolvedCells.length));
  const value = cellAt(solution, row, col);

  let updatedBoard = updateCellValue(board, row, col, value);
  updatedBoard = updateSingleCell(updatedBoard, row, col, { isHint: true });
  const { result } = resolveBoardState(updatedBoard, solution, gameMode, cages);
  const state = buildGameResultState(result);

  set(pushStateAtom, board);
  set(boardAtom, state.board);
  set(isCompletedAtom, state.isCompleted);
  set(isSuccessAtom, state.isSuccess);
  set(timerActiveAtom, state.timerActive);
  set(hintsRemainingAtom, hintsRemaining - 1);
  set(selectedCellAtom, { row, col });

  set(countBoardNumbersAtom);
  set(updateHighlightsAtom, { row, col });
});
