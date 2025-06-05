import { NUMBER_COUNTS } from "@entities/board/model/constants";
import { SudokuBoard } from "@entities/board/model/types";
import { GAME_LEVEL, GAME_MODE, HINTS_REMAINING } from "@entities/game/model/constants";
import { Difficulty, GameMode, KillerCage, SudokuState } from "@entities/game/model/types";
import {
  checkConflicts,
  createEmptyBoard,
  createEmptyGrid,
  createEmptyHighlights,
  generateBoard,
  generateKillerBoard,
  generateSolution,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
  validateKillerCages,
} from "@features/game-board/model/utils";
import {
  calculateHighlights,
  canFillCell,
  checkGameCompletion,
  findEmptyCells,
  resetUserInputs as resetUserInputsOptimized,
  updateCellNotes,
  updateCellSelection,
  updateCellValue,
  updateSingleCell,
  validateBoard,
} from "@features/game-controls/model/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SudokuActions {
  initializeGame: (difficulty?: Difficulty) => void;

  resetUserInputs: () => void;

  selectCell: (row: number, col: number) => void;

  deselectCell: () => void;

  fillCell: (value: number | null) => void;

  toggleNote: (value: number) => void;

  getHint: () => void;

  checkSolution: () => void;

  restartGame: () => void;

  incrementTimer: () => void;

  toggleTimer: (isActive?: boolean) => void;

  updateHighlights: (row: number, col: number) => void;

  toggleNoteMode: () => void;

  countBoardNumbers: () => void;

  switchGameMode: (mode: GameMode, difficulty?: Difficulty) => void;

  handleKeyInput: (key: string) => void;
}

const initialState: SudokuState = {
  board: createEmptyBoard(),
  isNoteMode: false,
  solution: createEmptyGrid(),
  selectedCell: null,
  isCompleted: false,
  isSuccess: false,
  currentTime: 0,
  timerActive: false,
  difficulty: GAME_LEVEL.MEDIUM,
  highlightedCells: createEmptyHighlights(),
  numberCounts: NUMBER_COUNTS,
  hintsRemaining: HINTS_REMAINING,
  gameMode: GAME_MODE.CLASSIC,
  cages: [],
};

const savedStorageKeys = [
  "board",
  "solution",
  "selectedCell",
  "isCompleted",
  "isSuccess",
  "currentTime",
  "timerActive",
  "difficulty",
  "numberCounts",
  "hintsRemaining",
  "gameMode",
  "cages",
];

export const useSudokuStore = create<SudokuState & SudokuActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      initializeGame: (difficulty = GAME_LEVEL.MEDIUM) => {
        const solution = generateSolution();
        const { gameMode } = get();

        let board: SudokuBoard;
        let cages: KillerCage[] = [];

        if (gameMode === GAME_MODE.KILLER) {
          const killerResult = generateKillerBoard(solution, difficulty);
          board = killerResult.board;
          cages = killerResult.cages;
        } else {
          board = generateBoard(solution, difficulty);
        }

        set({
          ...initialState,
          board,
          solution,
          difficulty,
          gameMode,
          cages,
        });

        get().toggleTimer(true);
        get().countBoardNumbers();
      },

      switchGameMode: (mode: GameMode, difficulty?: Difficulty) => {
        const currentDifficulty = difficulty || get().difficulty;
        set({ gameMode: mode });
        get().initializeGame(currentDifficulty);
      },

      resetUserInputs: () => {
        const { board } = get();
        const newBoard = resetUserInputsOptimized(board);
        const emptyHighlights = createEmptyHighlights();

        set({
          board: newBoard,
          highlightedCells: emptyHighlights,
          hintsRemaining: HINTS_REMAINING,
          currentTime: 0,
          isCompleted: false,
          isSuccess: false,
        });

        get().toggleTimer(true);
        get().countBoardNumbers();
      },

      selectCell: (row, col) => {
        const { board } = get();
        const newBoard = updateCellSelection(board, row, col);

        set({ board: newBoard, selectedCell: { row, col } });
        get().updateHighlights(row, col);
      },

      fillCell: (value) => {
        const { board, selectedCell, solution, gameMode, cages } = get();

        if (!canFillCell(selectedCell, board)) return;

        const { row, col } = selectedCell!;

        const updatedBoard = updateCellValue(board, row, col, value);
        const boardWithConflicts = validateBoard(updatedBoard, gameMode, cages);
        const gameResult = checkGameCompletion(boardWithConflicts, solution, gameMode, cages);

        set({
          board: boardWithConflicts,
          isCompleted: gameResult.completed,
          isSuccess: gameResult.success,
          timerActive: !gameResult.completed,
        });

        if (gameResult.success) {
          get().deselectCell();
          get().toggleTimer(false);
        }

        get().countBoardNumbers();
        get().updateHighlights(row, col);
      },

      deselectCell: () => {
        const { board } = get();
        const { selectedCell } = get();
        if (!selectedCell) {
          set({ highlightedCells: createEmptyHighlights() });
          return;
        }

        const newBoard = updateSingleCell(board, selectedCell.row, selectedCell.col, { isSelected: false });

        set({ board: newBoard, selectedCell: null, highlightedCells: createEmptyHighlights() });
      },

      toggleNote: (value) => {
        const { board, selectedCell } = get();

        if (!selectedCell) return;

        const { row, col } = selectedCell;

        if (board[row][col].isInitial || board[row][col].value !== null) return;

        const currentNotes = board[row][col].notes;
        const noteIndex = currentNotes.indexOf(value);

        let newNotes: number[];
        if (noteIndex === -1) {
          newNotes = [...currentNotes, value].sort((a, b) => a - b);
        } else {
          newNotes = currentNotes.filter((note) => note !== value);
        }

        const newBoard = updateCellNotes(board, row, col, newNotes);

        set({ board: newBoard });
      },

      toggleNoteMode: () => {
        set((state) => ({ isNoteMode: !state.isNoteMode }));
      },

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

        const newBoard = updateCellValue(board, row, col, value);

        let boardWithConflicts: SudokuBoard;
        if (gameMode === GAME_MODE.KILLER) {
          boardWithConflicts = validateKillerCages(newBoard, cages);
        } else {
          boardWithConflicts = checkConflicts(newBoard);
        }

        let completed = false;
        if (gameMode === GAME_MODE.KILLER) {
          completed = isKillerBoardComplete(boardWithConflicts, cages);
        } else {
          completed = isBoardComplete(boardWithConflicts);
        }
        const success = completed && isBoardCorrect(boardWithConflicts, solution);

        set({
          board: boardWithConflicts,
          isCompleted: completed,
          isSuccess: success,
          timerActive: !completed,
          hintsRemaining: hintsRemaining - 1,
          selectedCell: { row, col },
        });

        get().countBoardNumbers();
        get().updateHighlights(row, col);
      },

      restartGame: () => {
        const { difficulty } = get();
        get().initializeGame(difficulty);
      },

      incrementTimer: () => {
        const { currentTime, timerActive } = get();
        if (timerActive) {
          set({ currentTime: currentTime + 1 });
        }
      },

      toggleTimer: (isActive) => {
        if (isActive !== undefined) {
          set({ timerActive: isActive });
        } else {
          set((state) => ({ timerActive: !state.timerActive }));
        }
      },

      updateHighlights: (row, col) => {
        const { board } = get();
        const newHighlights = calculateHighlights(board, row, col);
        set({ highlightedCells: newHighlights });
      },

      countBoardNumbers: () => {
        const { board } = get();
        const counts = structuredClone(NUMBER_COUNTS);

        board.forEach((row) => {
          row.forEach((cell) => {
            if (cell.value !== null) {
              counts[cell.value as keyof typeof counts]++;
            }
          });
        });

        set({ numberCounts: counts });
      },

      checkSolution: () => {
        const { board, solution, gameMode, cages } = get();

        const isCorrect = isBoardCorrect(board, solution);

        let boardWithConflicts: SudokuBoard;
        if (gameMode === GAME_MODE.KILLER) {
          boardWithConflicts = validateKillerCages(board, cages);
        } else {
          boardWithConflicts = checkConflicts(board);
        }

        let completed = false;
        if (gameMode === GAME_MODE.KILLER) {
          completed = isKillerBoardComplete(boardWithConflicts, cages);
        } else {
          completed = isBoardComplete(boardWithConflicts);
        }

        const success = isCorrect && completed;

        set({
          board: boardWithConflicts,
          isCompleted: completed,
          isSuccess: success,
          timerActive: !completed,
        });
      },

      handleKeyInput: (key) => {
        const { isNoteMode } = get();

        if (key === "Backspace" || key === "Delete") {
          get().fillCell(null);
          return;
        }

        if (/^[1-9]$/.test(key)) {
          const value = parseInt(key) as number;
          if (isNoteMode) {
            get().toggleNote(value);
          } else {
            get().fillCell(value);
          }
        }

        if (key.startsWith("Arrow")) {
          const { selectedCell } = get();
          if (!selectedCell) return;

          let { row, col } = selectedCell;

          if (key === "ArrowUp") {
            row = Math.max(0, row - 1);
          } else if (key === "ArrowDown") {
            row = Math.min(8, row + 1);
          } else if (key === "ArrowLeft") {
            col = Math.max(0, col - 1);
          } else if (key === "ArrowRight") {
            col = Math.min(8, col + 1);
          }

          get().selectCell(row, col);
        }
      },
    }),
    {
      name: "awesome-sudoku-storage",
      partialize: (state) => ({
        ...Object.fromEntries(savedStorageKeys.map((key) => [key, state[key as keyof SudokuState]])),
      }),
    },
  ),
);
