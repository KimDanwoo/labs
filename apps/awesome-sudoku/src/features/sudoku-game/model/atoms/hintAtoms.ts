import { buildGameResultState, resolveBoardState } from '@features/sudoku-game/model/helpers/gameResult';
import { findEmptyCells, updateCellValue, updateSingleCell } from '@features/sudoku-game/model/utils';
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

/** 힌트 제공 */
export const getHintAtom = atom(null, (get, set) => {
  const board = get(boardAtom);
  const solution = get(solutionAtom);
  const hintsRemaining = get(hintsRemainingAtom);
  const gameMode = get(gameModeAtom);
  const cages = get(cagesAtom);

  if (hintsRemaining <= 0) {
    alert('더 이상 힌트를 사용할 수 없습니다!');
    return;
  }

  const emptyCells = findEmptyCells(board);

  if (emptyCells.length === 0) {
    alert('모든 칸이 이미 채워져 있습니다!');
    return;
  }

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const { row, col } = emptyCells[randomIndex];
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
