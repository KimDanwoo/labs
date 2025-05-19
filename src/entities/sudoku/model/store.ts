import {
  checkConflicts,
  CLASSIC_MODE,
  createEmptyBoard,
  createEmptyHighlights,
  Difficulty,
  GameMode,
  generateBoard,
  generateKillerBoard,
  generateSolution,
  HINTS_REMAINING,
  isBoardComplete,
  isBoardCorrect,
  KILLER_MODE,
  KillerCage,
  MEDIUM,
  NUMBER_COUNTS,
  SudokuBoard,
  SudokuState,
} from "@entities/sudoku/model";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkKillerConflicts, isKillerBoardComplete } from "./utils/killer";

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
  difficulty: MEDIUM,
  highlightedCells: createEmptyHighlights(),
  numberCounts: NUMBER_COUNTS,
  hintsRemaining: HINTS_REMAINING,
  gameMode: CLASSIC_MODE,
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
      initializeGame: (difficulty = MEDIUM) => {
        const solution = generateSolution();
        const { gameMode } = get();

        let board: SudokuBoard;
        let cages: KillerCage[] = [];

        if (gameMode === KILLER_MODE) {
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

      // 사용자 입력 초기화
      resetUserInputs: () => {
        const { board } = get();

        // 새 보드 생성
        const newBoard = board.map((row) =>
          row.map((cell) => {
            if (cell.isInitial) {
              return {
                ...cell,
                isConflict: false,
                isSelected: false,
              };
            }

            // 사용자가 입력한 셀은 초기화 (노트도 함께 초기화)
            return {
              ...cell,
              value: null,
              notes: [],
              isConflict: false,
              isSelected: false,
            };
          }),
        );

        const emptyHighlights = createEmptyHighlights();

        set({ board: newBoard, highlightedCells: emptyHighlights, hintsRemaining: 3 });
        get().countBoardNumbers();
      },

      // 셀 선택
      selectCell: (row, col) => {
        const { board } = get();

        // 새 보드 생성 및 선택 상태 업데이트
        const newBoard = board.map((r, rowIdx) =>
          r.map((cell, colIdx) => ({
            ...cell,
            isSelected: rowIdx === row && colIdx === col,
          })),
        );

        set({
          board: newBoard,
          selectedCell: { row, col },
        });

        get().updateHighlights(row, col);
      },

      // 셀에 값 입력
      fillCell: (value) => {
        const { board, selectedCell, solution, gameMode, cages } = get();

        if (!selectedCell) return;

        const { row, col } = selectedCell;

        // 초기 셀은 수정할 수 없음
        if (board[row][col].isInitial) return;

        // 새 보드 복제 및 셀 값 업데이트
        const newBoard = JSON.parse(JSON.stringify(board)) as SudokuBoard;
        newBoard[row][col].value = value;
        newBoard[row][col].notes = []; // 값을 입력하면 노트 제거

        let boardWithConflicts: SudokuBoard;

        // 충돌 확인
        if (gameMode === KILLER_MODE) {
          boardWithConflicts = checkKillerConflicts(newBoard, cages);
        } else {
          boardWithConflicts = checkConflicts(newBoard);
        }

        // 게임 완료 확인
        let completed = false;
        if (gameMode === KILLER_MODE) {
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
        });

        if (success) {
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
        const newBoard = JSON.parse(JSON.stringify(board)) as SudokuBoard;

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

        // 남은 힌트가 없으면 알림
        // if (hintsRemaining <= 0) {
        //   alert("더 이상 힌트를 사용할 수 없습니다!");
        //   return;
        // }

        // 무작위 빈 셀 선택 (빈 셀 = 값이 null인 셀)
        const emptyCells: { row: number; col: number }[] = [];

        // 보드를 순회하며 빈 셀 찾기
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (board[row][col].value === null) {
              emptyCells.push({ row, col });
            }
          }
        }

        // 빈 셀이 없으면 알림
        if (emptyCells.length === 0) {
          alert("모든 칸이 이미 채워져 있습니다!");
          return;
        }

        // 무작위 빈 셀 선택
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        const value = solution[row][col];

        // 새 보드 생성 (기존 보드의 깊은 복사)
        const newBoard = JSON.parse(JSON.stringify(board)) as SudokuBoard;

        // 선택된 셀에 정답 값 입력
        newBoard[row][col].value = value;
        newBoard[row][col].notes = []; // 노트 제거

        // 충돌 확인
        // 게임 모드에 따른 충돌 확인
        let boardWithConflicts: SudokuBoard;

        if (gameMode === KILLER_MODE) {
          boardWithConflicts = checkKillerConflicts(newBoard, cages);
        } else {
          boardWithConflicts = checkConflicts(newBoard);
        }

        // 게임 완료 확인
        let completed = false;
        if (gameMode === KILLER_MODE) {
          completed = isKillerBoardComplete(boardWithConflicts, cages);
        } else {
          completed = isBoardComplete(boardWithConflicts);
        }
        const success = completed && isBoardCorrect(boardWithConflicts, solution);

        // 상태 업데이트 (힌트 횟수 감소 포함)
        set({
          board: boardWithConflicts,
          isCompleted: completed,
          isSuccess: success,
          timerActive: !completed,
          hintsRemaining: hintsRemaining - 1, // 힌트 횟수 감소
          selectedCell: { row, col }, // 선택한 셀 업데이트
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

      // 하이라이트 업데이트
      updateHighlights: (row, col) => {
        const { board } = get();
        const newHighlights = createEmptyHighlights(); // 모든 하이라이트 초기화
        const selectedValue = board[row][col].value;

        // 1. 선택된 셀 표시
        const selectedKey = `${row}-${col}`;
        newHighlights[selectedKey].selected = true;

        // 2. 같은 행의 셀들 표시
        for (let c = 0; c < 9; c++) {
          const key = `${row}-${c}`;
          if (key !== selectedKey) {
            newHighlights[key].related = true;
          }
        }

        // 3. 같은 열의 셀들 표시
        for (let r = 0; r < 9; r++) {
          const key = `${r}-${col}`;
          if (key !== selectedKey) {
            newHighlights[key].related = true;
          }
        }

        // 4. 같은 3x3 블록 내 셀들 표시
        const blockStartRow = Math.floor(row / 3) * 3;
        const blockStartCol = Math.floor(col / 3) * 3;

        for (let r = blockStartRow; r < blockStartRow + 3; r++) {
          for (let c = blockStartCol; c < blockStartCol + 3; c++) {
            const key = `${r}-${c}`;
            if (key !== selectedKey) {
              newHighlights[key].related = true;
            }
          }
        }

        // 5. 같은 값을 가진 셀들 표시 (선택 셀의 값이 있을 경우)
        if (selectedValue !== null) {
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const key = `${r}-${c}`;
              if (key !== selectedKey && board[r][c].value === selectedValue) {
                newHighlights[key].sameValue = true;
              }
            }
          }
        }

        set({ highlightedCells: newHighlights });
      },

      // 보드 숫자 카운트
      countBoardNumbers: () => {
        const { board } = get();
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

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

        if (gameMode === KILLER_MODE) {
          boardWithConflicts = checkKillerConflicts(board, cages);
        } else {
          boardWithConflicts = checkConflicts(board);
        }

        // 게임 모드에 따른 완료 확인
        let completed = false;
        if (gameMode === KILLER_MODE) {
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
