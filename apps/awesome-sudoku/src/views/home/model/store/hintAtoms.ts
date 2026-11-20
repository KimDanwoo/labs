import { GAME_PHASE } from '@views/home/config/game';
import { atIndex, cellAt } from '@views/home/lib/gridAccess';
import { buildGameResultState, resolveBoardState } from '@views/home/model/services/gameResult';
import { updateCellValue, updateSingleCell } from '@views/home/model/services/update';
import { pushStateAtom } from '@views/home/model/store/historyAtoms';
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
} from '@views/home/model/store/primitives';
import { updateHighlightsAtom } from '@views/home/model/store/selectionAtoms';
import { countBoardNumbersAtom, gamePhaseAtom } from '@views/home/model/store/statusAtoms';
import { atom } from 'jotai';

export const getHintAtom = atom(null, (get, set) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;
  const board = get(boardAtom);
  const solution = get(solutionAtom);
  const hintsRemaining = get(hintsRemainingAtom);
  const gameMode = get(gameModeAtom);
  const cages = get(cagesAtom);
  const selectedCell = get(selectedCellAtom);

  // 힌트 소진·전부 정답이면 버튼이 이미 비활성이라 조용히 무시한다
  if (hintsRemaining <= 0) return;

  const isUnsolved = (r: number, c: number): boolean =>
    !cellAt(board, r, c).isInitial && cellAt(board, r, c).value !== cellAt(solution, r, c);
  const unsolvedCells = board.flatMap((cells, r) =>
    cells.flatMap((_, c) => (isUnsolved(r, c) ? [{ row: r, col: c }] : [])),
  );

  if (unsolvedCells.length === 0) return;

  const { row, col } =
    selectedCell && isUnsolved(selectedCell.row, selectedCell.col)
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
