import { CELL_MARK, DOUBLE_TAP_MS, GAME_OVER_PENALTY, MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { CellPosition, MarkGrid, StardokuPuzzle } from '@entities/stardoku/model/types';
import {
  cellKey,
  createEmptyMarks,
  isPuzzleSolved,
  markAt,
  violatingStarKeys,
  withMark,
} from '@entities/stardoku/model/utils';
import { Getter, Setter, atom } from 'jotai';
import { requestStagePuzzle } from '../services/puzzleGenerator';
import { hintsRemainingAtom, lastXTapAtom, livesAtom, marksAtom, puzzleAtom, scoreAtom, stageAtom } from './primitives';
import { isClearedAtom, isGameOverAtom } from './statusAtoms';

interface TapPayload extends CellPosition {
  /** 이벤트 timeStamp — 연속 탭(더블탭) 판정용 */
  time: number;
}

/** 클리어 순간 1회 정산: 획득 점수 = 남은 힌트 */
const settleIfCleared = (get: Getter, set: Setter, marks: MarkGrid, puzzle: StardokuPuzzle): void => {
  if (!isPuzzleSolved(marks, puzzle.size, puzzle.regions)) return;
  set(scoreAtom, get(scoreAtom) + get(hintsRemainingAtom));
};

/**
 * 스테이지 시작: 퍼즐 생성 + 마킹·목숨·힌트 초기화 (누적 점수는 유지).
 * 생성은 워커에서 돌아 비동기다 — 도착 전까지 보드는 로딩 자리표시를 띄운다.
 */
export const initializeStageAtom = atom(null, async (get, set, stage?: number) => {
  const targetStage = stage ?? get(stageAtom);
  const puzzle = await requestStagePuzzle(targetStage);

  set(stageAtom, targetStage);
  set(puzzleAtom, puzzle);
  set(marksAtom, createEmptyMarks(puzzle.size));
  set(livesAtom, MAX_LIVES);
  set(hintsRemainingAtom, MAX_HINTS);
  set(lastXTapAtom, null);
});

export const nextStageAtom = atom(null, (get, set) => set(initializeStageAtom, get(stageAtom) + 1));

/** 게임 오버 후퇴: 이전 스테이지로 (감점은 목숨 소진 순간 이미 반영됨) */
export const retreatStageAtom = atom(null, (get, set) => set(initializeStageAtom, Math.max(1, get(stageAtom) - 1)));

/**
 * 마킹만 지운다 — 꼬인 판을 정리하는 용도. 게임 오버 상태면 후퇴가 우선.
 *
 * 목숨·힌트는 **일부러 복구하지 않는다.** 점수 = 클리어 시 남은 힌트라서, 힌트를 쓰고 답을 파악한 뒤
 * 리셋해 만점을 받는 파밍이 가능했다. 누적 점수가 랭킹이므로 회차 내 자원은 회차가 끝날 때까지 유지한다.
 */
export const restartBoardAtom = atom(null, (get, set) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle) return undefined;
  if (get(isGameOverAtom)) return set(retreatStageAtom);
  set(marksAtom, createEmptyMarks(puzzle.size));
  set(lastXTapAtom, null);
  return undefined;
});

/**
 * 별을 놓는다. 정답 여부는 판정하지 않는다 — 게임이 대신 검증해주면 시행착오로 풀 수 있어 논리 퍼즐이 아니게 된다.
 * 규칙 위반(행·열·구역 중복 / 인접) 배치만 목숨 1을 깎는다. 별 자체는 남고 붉게 표시되어 사용자가 직접 고친다.
 */
const placeStar = (get: Getter, set: Setter, marks: MarkGrid, puzzle: StardokuPuzzle, at: CellPosition): void => {
  const nextMarks = withMark(marks, at.row, at.col, CELL_MARK.STAR);
  set(marksAtom, nextMarks);

  if (violatingStarKeys(nextMarks, puzzle.regions).has(cellKey(at.row, at.col))) {
    const nextLives = Math.max(0, get(livesAtom) - 1);
    set(livesAtom, nextLives);
    if (nextLives === 0) set(scoreAtom, get(scoreAtom) - GAME_OVER_PENALTY);
    return;
  }

  settleIfCleared(get, set, nextMarks, puzzle);
};

/** 셀 탭: 빈칸 → ✕ / ✕ 연속 탭 → 별 / ✕ 단독 탭 → 제거 / 별 탭 → 제거 */
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

  placeStar(get, set, marks, puzzle, { row, col });
});

/**
 * 힌트: 아직 없는 정답 별 하나를 공개하고 힌트 1개 소모.
 * 그 자리를 막고 있던 잘못된 별은 함께 치운다 — 힌트가 규칙 위반을 새로 만들면 안 된다.
 */
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

  const revealed = withMark(marks, target.row, target.col, CELL_MARK.STAR);
  const conflicting = violatingStarKeys(revealed, puzzle.regions);
  const nextMarks = revealed.map((rowMarks, row) =>
    rowMarks.map((mark, col) => {
      const isRevealed = row === target.row && col === target.col;
      if (isRevealed || !conflicting.has(cellKey(row, col))) return mark;
      return CELL_MARK.EMPTY;
    }),
  );

  set(marksAtom, nextMarks);
  set(hintsRemainingAtom, hintsRemaining - 1);
  settleIfCleared(get, set, nextMarks, puzzle);
});

/** 드래그 페인트: 빈칸에만 ✕ (더블탭 승격 대상 아님) */
export const paintXCellAtom = atom(null, (get, set, { row, col }: CellPosition) => {
  if (get(isGameOverAtom) || get(isClearedAtom)) return;
  const marks = get(marksAtom);
  if (markAt(marks, row, col) !== CELL_MARK.EMPTY) return;
  set(marksAtom, withMark(marks, row, col, CELL_MARK.X));
});

/** 드래그 지우개: ✕만 지운다. 별은 건드리지 않는다 — 손가락 한 번에 쓸려나가면 안 된다 */
export const eraseXCellAtom = atom(null, (get, set, { row, col }: CellPosition) => {
  if (get(isGameOverAtom) || get(isClearedAtom)) return;
  const marks = get(marksAtom);
  if (markAt(marks, row, col) !== CELL_MARK.X) return;
  set(marksAtom, withMark(marks, row, col, CELL_MARK.EMPTY));
});
