import { CELL_MARK, DOUBLE_TAP_MS, GAME_OVER_PENALTY, MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { boardSizeForStage, generatePuzzle } from '@entities/stardoku/model/generator';
import { CellPosition, MarkGrid } from '@entities/stardoku/model/types';
import { countStars, createEmptyMarks, markAt, withMark } from '@entities/stardoku/model/utils';
import {
  hintsRemainingAtom,
  lastXTapAtom,
  livesAtom,
  marksAtom,
  puzzleAtom,
  scoreAtom,
  stageAtom,
  wrongFlashAtom,
} from '@features/stardoku-game/model/atoms/primitives';
import { isClearedAtom, isGameOverAtom } from '@features/stardoku-game/model/atoms/statusAtoms';
import { Getter, Setter, atom } from 'jotai';

interface TapPayload extends CellPosition {
  /** 이벤트 timeStamp — 연속 탭(더블탭) 판정용 */
  time: number;
}

/** 클리어 순간 1회 정산: 획득 점수 = 남은 힌트 */
const settleIfCleared = (get: Getter, set: Setter, marks: MarkGrid, size: number): void => {
  if (countStars(marks) !== size) return;
  set(scoreAtom, get(scoreAtom) + get(hintsRemainingAtom));
};

/** 스테이지 시작: 퍼즐 생성 + 마킹·목숨·힌트 초기화 (누적 점수는 유지) */
export const initializeStageAtom = atom(null, (get, set, stage?: number) => {
  const targetStage = stage ?? get(stageAtom);
  const puzzle = generatePuzzle(boardSizeForStage(targetStage));

  set(stageAtom, targetStage);
  set(puzzleAtom, puzzle);
  set(marksAtom, createEmptyMarks(puzzle.size));
  set(livesAtom, MAX_LIVES);
  set(hintsRemainingAtom, MAX_HINTS);
  set(wrongFlashAtom, null);
  set(lastXTapAtom, null);
});

export const nextStageAtom = atom(null, (get, set) => {
  set(initializeStageAtom, get(stageAtom) + 1);
});

/** 게임 오버 후퇴: 이전 스테이지로 (감점은 목숨 소진 순간 이미 반영됨) */
export const retreatStageAtom = atom(null, (get, set) => {
  set(initializeStageAtom, Math.max(1, get(stageAtom) - 1));
});

/** 같은 스테이지에서 새 퍼즐 재생성. 게임 오버 상태면 후퇴가 우선(감점 회피 방지) */
export const regeneratePuzzleAtom = atom(null, (get, set) => {
  if (get(isGameOverAtom)) {
    set(retreatStageAtom);
    return;
  }
  set(initializeStageAtom, get(stageAtom));
});

/** 현재 퍼즐 그대로 마킹·목숨·힌트만 리셋. 게임 오버 상태면 후퇴가 우선 */
export const restartBoardAtom = atom(null, (get, set) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle) return;
  if (get(isGameOverAtom)) {
    set(retreatStageAtom);
    return;
  }
  set(marksAtom, createEmptyMarks(puzzle.size));
  set(livesAtom, MAX_LIVES);
  set(hintsRemainingAtom, MAX_HINTS);
  set(wrongFlashAtom, null);
  set(lastXTapAtom, null);
});

/**
 * 셀 탭: 빈칸 → ✕ / ✕ 연속 탭 → 별 배치 시도 / ✕ 단독 탭 → 제거 / 별 탭 → 제거.
 * 오답 별은 거부되고 목숨 −1, 목숨 소진 시 게임 오버 감점.
 */
export const tapCellAtom = atom(null, (get, set, { row, col, time }: TapPayload) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle || get(isGameOverAtom) || get(isClearedAtom)) return;

  const marks = get(marksAtom);
  const mark = markAt(marks, row, col);

  if (mark === CELL_MARK.STAR) {
    set(marksAtom, withMark(marks, row, col, CELL_MARK.EMPTY));
    set(lastXTapAtom, null);
    return;
  }

  if (mark === CELL_MARK.EMPTY) {
    set(marksAtom, withMark(marks, row, col, CELL_MARK.X));
    set(lastXTapAtom, { row, col, time });
    return;
  }

  const lastTap = get(lastXTapAtom);
  set(lastXTapAtom, null);
  const isDoubleTap =
    lastTap !== null && lastTap.row === row && lastTap.col === col && time - lastTap.time < DOUBLE_TAP_MS;

  if (!isDoubleTap) {
    set(marksAtom, withMark(marks, row, col, CELL_MARK.EMPTY));
    return;
  }

  if (puzzle.solution[row] === col) {
    const nextMarks = withMark(marks, row, col, CELL_MARK.STAR);
    set(marksAtom, nextMarks);
    settleIfCleared(get, set, nextMarks, puzzle.size);
    return;
  }

  set(marksAtom, withMark(marks, row, col, CELL_MARK.EMPTY));
  const nextLives = Math.max(0, get(livesAtom) - 1);
  set(livesAtom, nextLives);
  set(wrongFlashAtom, { row, col });
  if (nextLives === 0) set(scoreAtom, get(scoreAtom) - GAME_OVER_PENALTY);
});

/** 힌트: 아직 없는 정답 별 하나를 공개하고 힌트 1개 소모 */
export const applyHintAtom = atom(null, (get, set) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle || get(isGameOverAtom) || get(isClearedAtom)) return;
  const hintsRemaining = get(hintsRemainingAtom);
  if (hintsRemaining <= 0) return;

  const marks = get(marksAtom);
  const targets: CellPosition[] = [];
  puzzle.solution.forEach((col, row) => {
    if (markAt(marks, row, col) !== CELL_MARK.STAR) targets.push({ row, col });
  });
  const target = targets[Math.floor(Math.random() * targets.length)];
  if (!target) return;

  const nextMarks = withMark(marks, target.row, target.col, CELL_MARK.STAR);
  set(marksAtom, nextMarks);
  set(hintsRemainingAtom, hintsRemaining - 1);
  settleIfCleared(get, set, nextMarks, puzzle.size);
});

/** 드래그 페인트: 빈칸에만 ✕ (더블탭 승격 대상 아님) */
export const paintXCellAtom = atom(null, (get, set, { row, col }: CellPosition) => {
  if (get(isGameOverAtom) || get(isClearedAtom)) return;
  const marks = get(marksAtom);
  if (markAt(marks, row, col) !== CELL_MARK.EMPTY) return;
  set(marksAtom, withMark(marks, row, col, CELL_MARK.X));
});
