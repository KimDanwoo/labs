import { NUMBER_COUNTS } from "@entities/board/model/constants";
import { GAME_LEVEL, GAME_MODE, HINTS_REMAINING } from "@entities/game/model/constants";
import { SudokuState } from "@entities/game/model/types";
import {
  createEmptyBoard,
  createEmptyGrid,
  createEmptyHighlights,
} from "@features/sudoku-game/model/utils";

export const initialSudokuState: SudokuState = {
  board: createEmptyBoard(),
  isNoteMode: false,
  solution: createEmptyGrid(),
  selectedCell: null,
  isCompleted: false,
  isSuccess: false,
  isRecordSaved: false,
  currentTime: 0,
  timerActive: false,
  difficulty: GAME_LEVEL.MEDIUM,
  highlightedCells: createEmptyHighlights(),
  numberCounts: NUMBER_COUNTS,
  hintsRemaining: HINTS_REMAINING,
  mistakeCount: 0,
  gameMode: GAME_MODE.CLASSIC,
  cages: [],
};

export const SUDOKU_STORAGE_KEYS: (keyof SudokuState)[] = [
  "board",
  "solution",
  "selectedCell",
  "isCompleted",
  "isSuccess",
  "isRecordSaved",
  "currentTime",
  "timerActive",
  "difficulty",
  "numberCounts",
  "hintsRemaining",
  "mistakeCount",
  "gameMode",
  "cages",
];
