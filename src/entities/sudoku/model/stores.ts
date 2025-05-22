import { NUMBER_COUNTS } from "@entities/board/model/constants";
import { Grid, SudokuBoard } from "@entities/board/model/types";
import { SudokuCell } from "@entities/cell/model/types";
import { GAME_LEVEL, GAME_MODE, HINTS_REMAINING } from "@entities/game/model/constants";
import { Difficulty, GameMode, KillerCage, SudokuState } from "@entities/game/model/types";
import {
  checkConflicts,
  checkKillerConflicts,
  createEmptyBoard,
  createEmptyHighlights,
  generateBoard,
  generateKillerBoard,
  generateSolution,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
} from "@entities/sudoku/model/utils";
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

// 헬퍼 함수들
function validateGeneratedCages(cages: KillerCage[], solution: Grid): boolean {
  for (const cage of cages) {
    const values = cage.cells.map(([r, c]) => solution[r][c]);
    const uniqueValues = new Set(values);

    // 중복 숫자 검사
    if (values.length !== uniqueValues.size) {
      console.error(`케이지 ${cage.id}에 중복 숫자 발견:`, values);
      return false;
    }

    // 합계 검사
    const actualSum = values.reduce((sum, val) => sum + val, 0);
    if (actualSum !== cage.sum) {
      console.error(`케이지 ${cage.id}의 합이 맞지 않음: 계산값 ${actualSum}, 저장값 ${cage.sum}`);
      return false;
    }

    // 셀이 유효한 범위 내에 있는지 검사
    for (const [r, c] of cage.cells) {
      if (r < 0 || r >= 9 || c < 0 || c >= 9) {
        console.error(`케이지 ${cage.id}에 유효하지 않은 셀 위치: [${r}, ${c}]`);
        return false;
      }
    }
  }

  return true;
}

function validateCagesIntegrity(cages: KillerCage[], solution: Grid): boolean {
  // 모든 셀이 정확히 하나의 케이지에만 속하는지 확인
  const cellCageMap = new Map<string, number>();

  for (const cage of cages) {
    for (const [r, c] of cage.cells) {
      const key = `${r}-${c}`;
      if (cellCageMap.has(key)) {
        console.error(`셀 [${r}, ${c}]가 여러 케이지에 중복 할당됨`);
        return false;
      }
      cellCageMap.set(key, cage.id);
    }
  }

  // 모든 셀이 케이지에 할당되었는지 확인
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const key = `${r}-${c}`;
      if (!cellCageMap.has(key)) {
        console.error(`셀 [${r}, ${c}]가 어떤 케이지에도 할당되지 않음`);
        return false;
      }
    }
  }

  return true;
}

function findCageForCell(cages: KillerCage[], row: number, col: number): KillerCage | null {
  for (const cage of cages) {
    if (cage.cells.some(([r, c]) => r === row && c === col)) {
      return cage;
    }
  }
  return null;
}

// 스도쿠 스토어 정의
export const useSudokuStore = create<SudokuState & SudokuActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 게임 초기화 (개선된 버전)
      initializeGame: (difficulty = GAME_LEVEL.MEDIUM) => {
        const solution = generateSolution();
        const { gameMode } = get();

        let board: SudokuCell[][] = [];
        let cages: KillerCage[] = [];

        try {
          if (gameMode === GAME_MODE.KILLER) {
            // 킬러 모드 보드 생성 (에러 처리 추가)
            const maxRetries = 3;
            let retryCount = 0;

            while (retryCount < maxRetries) {
              try {
                const killerResult = generateKillerBoard(solution, difficulty);
                board = killerResult.board;
                cages = killerResult.cages;

                // 케이지 유효성 재검증
                const isValid = validateGeneratedCages(cages, solution);
                const isIntegrityValid = validateCagesIntegrity(cages, solution);

                if (isValid && isIntegrityValid) {
                  console.log("킬러 스도쿠 보드 생성 성공");
                  break;
                } else {
                  throw new Error("케이지 검증 실패");
                }
              } catch (error) {
                retryCount++;
                console.warn(`킬러 스도쿠 생성 재시도 ${retryCount}/${maxRetries}:`, error);

                if (retryCount >= maxRetries) {
                  console.error("킬러 스도쿠 생성 실패, 일반 모드로 전환");
                  // 일반 모드로 폴백
                  board = generateBoard(solution, difficulty);
                  cages = [];
                  // 게임 모드를 일반으로 변경
                  set({ gameMode: GAME_MODE.CLASSIC });
                  break;
                }
              }
            }
          } else {
            // 일반 모드 보드 생성
            board = generateBoard(solution, difficulty);
          }

          set({
            ...initialState,
            board,
            solution,
            difficulty,
            gameMode: get().gameMode, // 현재 게임 모드 유지
            cages,
          });

          get().toggleTimer(true);
          get().countBoardNumbers();
        } catch (error) {
          console.error("게임 초기화 실패:", error);
          // 에러 발생 시 기본 보드 생성
          board = generateBoard(solution, GAME_LEVEL.EASY);
          set({
            ...initialState,
            board,
            solution,
            difficulty: GAME_LEVEL.EASY,
            gameMode: GAME_MODE.CLASSIC,
            cages: [],
          });

          get().toggleTimer(true);
          get().countBoardNumbers();
        }
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

        set({
          board: newBoard,
          highlightedCells: emptyHighlights,
          hintsRemaining: HINTS_REMAINING,
          selectedCell: null,
        });
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

      // 셀에 값 입력 (개선된 버전)
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

        // 충돌 확인 (개선된 검증)
        if (gameMode === GAME_MODE.KILLER) {
          // 킬러 스도쿠 검증 전에 케이지 유효성 확인
          if (!validateCagesIntegrity(cages, solution)) {
            console.error("케이지 무결성 검사 실패");
            return; // 입력 중단
          }
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
        set({ board: newBoard, selectedCell: null, highlightedCells: createEmptyHighlights() });
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

      // 힌트 표시 (개선된 버전)
      getHint: () => {
        const { board, solution, hintsRemaining, gameMode, cages } = get();

        // 남은 힌트가 없으면 알림 (주석 처리)
        // if (hintsRemaining <= 0) {
        //   alert("더 이상 힌트를 사용할 수 없습니다!");
        //   return;
        // }

        // 무작위 빈 셀 선택 (빈 셀 = 값이 null인 셀)
        const emptyCells: { row: number; col: number; priority: number }[] = [];

        // 보드를 순회하며 빈 셀 찾기 (킬러 스도쿠에서는 우선순위 고려)
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (board[row][col].value === null) {
              let priority = 0;

              if (gameMode === GAME_MODE.KILLER) {
                // 킬러 스도쿠에서는 케이지 상황을 고려한 우선순위
                const cage = findCageForCell(cages, row, col);
                if (cage) {
                  const filledCellsInCage = cage.cells.filter(([r, c]) => board[r][c].value !== null).length;
                  const totalCellsInCage = cage.cells.length;

                  // 케이지에서 채워진 셀이 많을수록 우선순위 높음
                  priority = filledCellsInCage / totalCellsInCage;

                  // 작은 케이지일수록 우선순위 높음
                  if (totalCellsInCage <= 2) priority += 0.5;
                }
              }

              emptyCells.push({ row, col, priority });
            }
          }
        }

        // 빈 셀이 없으면 알림
        if (emptyCells.length === 0) {
          alert("모든 칸이 이미 채워져 있습니다!");
          return;
        }

        // 킬러 스도쿠에서는 우선순위가 높은 셀부터, 일반에서는 무작위
        let selectedCellInfo;
        if (gameMode === GAME_MODE.KILLER) {
          // 우선순위 정렬 후 상위 30% 중에서 무작위 선택
          emptyCells.sort((a, b) => b.priority - a.priority);
          const topCells = emptyCells.slice(0, Math.max(1, Math.floor(emptyCells.length * 0.3)));
          selectedCellInfo = topCells[Math.floor(Math.random() * topCells.length)];
        } else {
          // 완전 무작위 선택
          selectedCellInfo = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }

        const { row, col } = selectedCellInfo;
        const value = solution[row][col];

        // 새 보드 생성 (기존 보드의 깊은 복사)
        const newBoard = JSON.parse(JSON.stringify(board)) as SudokuBoard;

        // 선택된 셀에 정답 값 입력
        newBoard[row][col].value = value;
        newBoard[row][col].notes = []; // 노트 제거

        // 충돌 확인
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

        // 상태 업데이트 (힌트 횟수 감소 포함)
        set({
          board: boardWithConflicts,
          isCompleted: completed,
          isSuccess: success,
          timerActive: !completed,
          hintsRemaining: Math.max(0, hintsRemaining - 1), // 힌트 횟수 감소 (음수 방지)
          selectedCell: { row, col }, // 선택한 셀 업데이트
        });

        if (success) {
          get().deselectCell();
          get().toggleTimer(false);
        }

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

      // 타이머 토글
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

      // 키 입력 처리
      handleKeyInput: (key) => {
        const { selectedCell } = get();

        // 선택된 셀이 없으면 아무것도 하지 않음
        if (!selectedCell) return;

        if (key === "Backspace" || key === "Delete") {
          get().fillCell(null);
          return;
        }

        // 화살표 키 처리
        if (key.startsWith("Arrow")) {
          const { row, col } = selectedCell;
          let newRow = row;
          let newCol = col;

          switch (key) {
            case "ArrowUp":
              newRow = Math.max(0, row - 1);
              break;
            case "ArrowDown":
              newRow = Math.min(8, row + 1);
              break;
            case "ArrowLeft":
              newCol = Math.max(0, col - 1);
              break;
            case "ArrowRight":
              newCol = Math.min(8, col + 1);
              break;
          }

          if (newRow !== row || newCol !== col) {
            get().selectCell(newRow, newCol);
          }
          return;
        }

        // 숫자 키 처리
        if (/^[1-9]$/.test(key)) {
          const number = parseInt(key) as number;
          const { isNoteMode } = get();

          if (isNoteMode) {
            get().toggleNote(number);
          } else {
            get().fillCell(number);
          }
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
