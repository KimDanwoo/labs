import { SudokuState, Difficulty, GameMode } from "@entities/game/model/types";
import { StoreApi } from "zustand";

/**
 * 스도쿠 게임 액션 인터페이스
 */
export interface SudokuActions {
  /** 새 게임 초기화 */
  initializeGame: (difficulty?: Difficulty) => void;
  /** 사용자 입력 초기화 (초기 셀 유지) */
  resetUserInputs: () => void;
  /** 셀 선택 */
  selectCell: (row: number, col: number) => void;
  /** 셀 선택 해제 */
  deselectCell: () => void;
  /** 선택된 셀에 값 입력 */
  fillCell: (value: number | null) => void;
  /** 노트 토글 */
  toggleNote: (value: number) => void;
  /** 힌트 제공 */
  getHint: () => void;
  /** 솔루션 확인 */
  checkSolution: () => void;
  /** 게임 재시작 */
  restartGame: () => void;
  /** 타이머 1초 증가 */
  incrementTimer: () => void;
  /** 타이머 토글 */
  toggleTimer: (isActive?: boolean) => void;
  /** 하이라이트 업데이트 */
  updateHighlights: (row: number, col: number) => void;
  /** 노트 모드 토글 */
  toggleNoteMode: () => void;
  /** 보드 숫자 카운트 */
  countBoardNumbers: () => void;
  /** 게임 모드 전환 */
  switchGameMode: (mode: GameMode, difficulty?: Difficulty) => void;
  /** 키보드 입력 처리 */
  handleKeyInput: (key: string) => void;
}

/** 스도쿠 스토어 전체 타입 */
export type SudokuStore = SudokuState & SudokuActions;

/** Zustand 스토어 API 타입 */
export type SudokuStoreApi = StoreApi<SudokuStore>;

/** 스토어 setState 타입 */
export type SudokuStoreSet = SudokuStoreApi["setState"];

/** 스토어 getState 타입 */
export type SudokuStoreGet = SudokuStoreApi["getState"];

/** 액션 생성자 타입 */
export type SudokuStoreActionCreator<Keys extends keyof SudokuActions> = (
  set: SudokuStoreSet,
  get: SudokuStoreGet,
) => Pick<SudokuActions, Keys>;
