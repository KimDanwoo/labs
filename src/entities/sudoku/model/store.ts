import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CellHighlight, Difficulty, SudokuBoard, SudokuState } from "./types";
import { checkConflicts, generateBoard, generateSolution, getHint, isBoardComplete, isBoardCorrect } from "./utils";

interface SudokuActions {
  // 게임 초기화
  initializeGame: (difficulty?: Difficulty) => void;

  // 셀 선택
  selectCell: (row: number, col: number) => void;

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
}

// 빈 스도쿠 보드 생성 헬퍼 함수
const createEmptyBoard = (): SudokuBoard =>
  Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => ({
          value: null,
          isInitial: false,
          isSelected: false,
          isConflict: false,
          notes: [],
        })),
    );

const createEmptyHighlights = (): Record<string, CellHighlight> => {
  const highlights: Record<string, CellHighlight> = {};

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const key = `${row}-${col}`;
      highlights[key] = {
        selected: false,
        related: false,
        sameValue: false,
      };
    }
  }

  return highlights;
};

// 스도쿠 스토어 정의
export const useSudokuStore = create<SudokuState & SudokuActions>()(
  persist(
    (set, get) => ({
      // 초기 상태
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
      difficulty: "medium",
      highlightedCells: createEmptyHighlights(),

      // 액션들
      initializeGame: (difficulty = "medium") => {
        const solution = generateSolution();
        const board = generateBoard(solution, difficulty);

        set({
          board,
          solution,
          selectedCell: null,
          isCompleted: false,
          isSuccess: false,
          currentTime: 0,
          timerActive: true,
          difficulty,
          highlightedCells: createEmptyHighlights(),
        });
      },

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

      toggleNoteMode: () => {
        set((state) => ({ isNoteMode: !state.isNoteMode }));
      },

      fillCell: (value) => {
        const { board, selectedCell, solution } = get();

        if (!selectedCell) return;

        const { row, col } = selectedCell;

        // 초기 셀은 수정할 수 없음
        if (board[row][col].isInitial) return;

        // 새 보드 복제 및 셀 값 업데이트
        const newBoard = JSON.parse(JSON.stringify(board)) as SudokuBoard;
        newBoard[row][col].value = value;
        newBoard[row][col].notes = []; // 값을 입력하면 노트 제거

        // 충돌 확인
        const boardWithConflicts = checkConflicts(newBoard);

        // 게임 완료 확인
        const completed = isBoardComplete(boardWithConflicts);
        const success = completed && isBoardCorrect(boardWithConflicts, solution);

        set({
          board: boardWithConflicts,
          isCompleted: completed,
          isSuccess: success,
          timerActive: !completed,
        });
      },

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

      getHint: () => {
        const { board, solution } = get();
        const hint = getHint(board, solution);
        if (hint) {
          const { row, col, value } = hint;
          get().selectCell(row, col);
        }
      },

      checkSolution: () => {
        const { board, solution } = get();
        const isCorrect = isBoardCorrect(board, solution);

        set({
          isCompleted: true,
          isSuccess: isCorrect,
          timerActive: false,
        });
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
    }),
    {
      name: "sudoku-storage", // 로컬 스토리지 키 이름
      partialize: (state) => ({
        board: state.board,
        solution: state.solution,
        selectedCell: state.selectedCell,
        isCompleted: state.isCompleted,
        isSuccess: state.isSuccess,
        currentTime: state.currentTime,
        timerActive: state.timerActive,
        difficulty: state.difficulty,
      }),
    },
  ),
);
