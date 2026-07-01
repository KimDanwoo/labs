import { NUMBER_COUNTS } from "@entities/board/model/constants";
import {
  buildGameResultState,
  resolveBoardState,
} from "@features/sudoku-game/model/helpers/gameResult";
import { atom } from "jotai";
import {
  boardAtom,
  cagesAtom,
  gameModeAtom,
  isCompletedAtom,
  isSuccessAtom,
  numberCountsAtom,
  solutionAtom,
  timerActiveAtom,
} from "./primitives";

/** 보드 숫자 카운트 */
export const countBoardNumbersAtom = atom(
  null,
  (get, set) => {
    const board = get(boardAtom);
    const counts = structuredClone(NUMBER_COUNTS);

    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value !== null) {
          counts[cell.value as keyof typeof counts]++;
        }
      });
    });

    set(numberCountsAtom, counts);
  },
);

/** 솔루션 확인 */
export const checkSolutionAtom = atom(
  null,
  (get, set) => {
    const board = get(boardAtom);
    const solution = get(solutionAtom);
    const gameMode = get(gameModeAtom);
    const cages = get(cagesAtom);
    const { result } = resolveBoardState(board, solution, gameMode, cages);
    const state = buildGameResultState(result);

    set(boardAtom, state.board);
    set(isCompletedAtom, state.isCompleted);
    set(isSuccessAtom, state.isSuccess);
    set(timerActiveAtom, state.timerActive);
  },
);
