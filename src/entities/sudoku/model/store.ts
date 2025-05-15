import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SudokuState,
  SudokuBoard,
  Difficulty,
} from './types';
import {
  generateSolution,
  generateBoard,
  checkConflicts,
  isBoardComplete,
  isBoardCorrect,
  getHint
} from './utils';

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
}

// 빈 스도쿠 보드 생성 헬퍼 함수
const createEmptyBoard = (): SudokuBoard => 
  Array(9).fill(null).map(() => 
    Array(9).fill(null).map(() => ({
      value: null,
      isInitial: false,
      isSelected: false,
      isConflict: false,
      notes: []
    }))
  );

// 스도쿠 스토어 정의
export const useSudokuStore = create<SudokuState & SudokuActions>()(
  persist(  
    (set, get) => ({
      // 초기 상태
      board: createEmptyBoard(),
      solution: Array(9).fill(null).map(() => Array(9).fill(null)),
      selectedCell: null,
      isCompleted: false,
      isSuccess: false,
      currentTime: 0,
      timerActive: false,
      difficulty: 'medium',

      // 액션들
      initializeGame: (difficulty = 'medium') => {
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
          difficulty
        });
      },

      selectCell: (row, col) => {
        const { board } = get();
        
        // 새 보드 생성 및 선택 상태 업데이트
        const newBoard = board.map((r, rowIdx) =>
          r.map((cell, colIdx) => ({
            ...cell,
            isSelected: rowIdx === row && colIdx === col
          }))
        );
        
        set({
          board: newBoard,
          selectedCell: { row, col }
        });
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
          timerActive: !completed
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
          timerActive: false
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
          set(state => ({ timerActive: !state.timerActive }));
        }
      }
    }),
    {
      name: 'sudoku-storage', // 로컬 스토리지 키 이름
      partialize: (state) => ({
        // 지속할 상태 선택 (게임 상태 저장)
        board: state.board,
        solution: state.solution,
        selectedCell: state.selectedCell,
        isCompleted: state.isCompleted,
        isSuccess: state.isSuccess,
        currentTime: state.currentTime,
        timerActive: state.timerActive,
        difficulty: state.difficulty
      })
    }
  )
);