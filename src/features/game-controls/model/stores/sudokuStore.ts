import { NUMBER_COUNTS } from "@entities/board/model/constants";
import { SudokuBoard } from "@entities/board/model/types";
import { GAME_LEVEL, GAME_MODE, HINTS_REMAINING } from "@entities/game/model/constants";
import { Difficulty, GameMode, KillerCage, SudokuState } from "@entities/game/model/types";
import {
  calculateHighlights,
  canFillCell,
  checkConflicts,
  checkGameCompletion,
  checkKillerConflicts,
  createEmptyBoard,
  createEmptyHighlights,
  findEmptyCells,
  generateBoard,
  generateKillerBoard,
  generateSolution,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
  resetInitialBoard,
  selectBoardCell,
  updateCellValue,
  validateBoard,
} from "@features/game-board/model/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SudokuActions {
  // 게임 초기화
  initializeGame: (difficulty?: Difficulty) => void;

  // 사용자 입력 초기화
  resetUserInputs: () => void;

  // 셀 선택
  selectCell: (row: number, col: number) => void;

  // 셀 선택 해제
  deselectCell: () => void;

  // 선택된 셀에 값 입력
  fillCell: (value: number | null) => void;

  // 노트 토글
  toggleNote: (value: number) => void;

  // 힌트 표시
  getHint: () => void;

  // 정답 확인
  checkSolution: () => void;

  // 게임 재시작
  restartGame: () => void;

  // 타이머 증가
  incrementTimer: () => void;

  // 타이머 토글
  toggleTimer: (isActive?: boolean) => void;

  // 하이라이트 업데이트
  updateHighlights: (row: number, col: number) => void;

  // 노트 모드 토글
  toggleNoteMode: () => void;

  // 보드 숫자 카운트
  countBoardNumbers: () => void;

  // 게임 모드 전환
  switchGameMode: (mode: GameMode, difficulty?: Difficulty) => void;

  // 키 입력 처리
  handleKeyInput: (key: string) => void;
}

const initialState: SudokuState = {
  board: createEmptyBoard(),
  isNoteMode: false,
  solution: Array(9)
    .fill(null)
    .map(() => Array(9).fill(null)),
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

// 스도쿠 스토어 정의
export const useSudokuStore = create<SudokuState & SudokuActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 게임 초기화
      initializeGame: (difficulty = GAME_LEVEL.MEDIUM) => {
        const solution = generateSolution();
        const { gameMode } = get();

        let board: SudokuBoard;
        let cages: KillerCage[] = [];

        if (gameMode === GAME_MODE.KILLER) {
          // 킬러 모드 보드 생성

          const killerResult = generateKillerBoard(solution, difficulty);
          board = killerResult.board;
          cages = killerResult.cages;
        } else {
          // 일반 모드 보드 생성
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

      // 게임 모드 전환
      switchGameMode: (mode: GameMode, difficulty?: Difficulty) => {
        const currentDifficulty = difficulty || get().difficulty;
        set({ gameMode: mode });
        get().initializeGame(currentDifficulty);
      },

      resetUserInputs: () => {
        const { board } = get();
        const newBoard = resetInitialBoard(board);
        const emptyHighlights = createEmptyHighlights();

        set({ board: newBoard, highlightedCells: emptyHighlights, hintsRemaining: HINTS_REMAINING });
        get().countBoardNumbers();
      },

      selectCell: (row, col) => {
        const { board } = get();

        const newBoard = selectBoardCell(board, row, col);

        set({ board: newBoard, selectedCell: { row, col } });
        get().updateHighlights(row, col);
      },

      fillCell: (value) => {
        const { board, selectedCell, solution, gameMode, cages } = get();

        if (!canFillCell(selectedCell, board)) return;

        const { row, col } = selectedCell!;

        const updatedBoard = updateCellValue(board, { row, col }, value);

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

      // 셀 선택 해제
      deselectCell: () => {
        const { board } = get();
        const newBoard = board.map((r) => r.map((c) => ({ ...c, isSelected: false })));
        set({ board: newBoard, selectedCell: null });
      },

      // 노트 토글
      toggleNote: (value) => {
        const { board, selectedCell } = get();

        if (!selectedCell) return;

        const { row, col } = selectedCell;

        // 초기 셀이거나 값이 있으면 노트를 사용할 수 없음
        if (board[row][col].isInitial || board[row][col].value !== null) return;

        // 새 보드 복제
        const newBoard = structuredClone(board) as SudokuBoard;

        // 노트 토글
        const noteIndex = newBoard[row][col].notes.indexOf(value);
        if (noteIndex === -1) {
          newBoard[row][col].notes.push(value);
          newBoard[row][col].notes.sort((a, b) => a - b);
        } else {
          newBoard[row][col].notes.splice(noteIndex, 1);
        }

        set({ board: newBoard });
      },

      // 노트 모드 토글
      toggleNoteMode: () => {
        set((state) => ({ isNoteMode: !state.isNoteMode }));
      },

      // 힌트 표시
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

        // 무작위 빈 셀 선택
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        const value = solution[row][col];

        // 새 보드 생성 (기존 보드의 깊은 복사)
        const newBoard = structuredClone(board) as SudokuBoard;

        // 선택된 셀에 정답 값 입력
        newBoard[row][col].value = value;
        newBoard[row][col].notes = []; // 노트 제거

        // 충돌 확인
        // 게임 모드에 따른 충돌 확인
        let boardWithConflicts: SudokuBoard;

        if (gameMode === GAME_MODE.KILLER) {
          boardWithConflicts = checkKillerConflicts(newBoard, cages);
        } else {
          boardWithConflicts = checkConflicts(newBoard);
        }

        // 게임 완료 확인
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

      // 게임 재시작
      restartGame: () => {
        const { difficulty } = get();
        get().initializeGame(difficulty);
      },

      // 타이머 증가
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

      // 보드 숫자 카운트
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

      // 정답 확인
      checkSolution: () => {
        const { board, solution, gameMode, cages } = get();
        const isCorrect = isBoardCorrect(board, solution);

        // 게임 모드에 따른 충돌 확인
        let boardWithConflicts: SudokuBoard;

        if (gameMode === GAME_MODE.KILLER) {
          boardWithConflicts = checkKillerConflicts(board, cages);
        } else {
          boardWithConflicts = checkConflicts(board);
        }

        // 게임 모드에 따른 완료 확인
        let completed = false;
        if (gameMode === GAME_MODE.KILLER) {
          completed = isKillerBoardComplete(boardWithConflicts, cages);
        } else {
          completed = isBoardComplete(boardWithConflicts);
        }

        set({
          board: boardWithConflicts,
          isCompleted: completed,
          isSuccess: isCorrect && completed,
          timerActive: false,
        });
      },

      handleKeyInput: (key) => {
        if (key === "Backspace" || key === "Delete") {
          get().fillCell(null);
          return;
        }

        if (/^[1-9]$/.test(key)) {
          get().fillCell(parseInt(key) as number);
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
