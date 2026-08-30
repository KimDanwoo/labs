import { CELL_MARK, DRAG_THRESHOLD_PX } from '@entities/stardoku/model/constants';
import type { CellPosition } from '@entities/stardoku/model/types';
import { cellKey, markAt } from '@entities/stardoku/model/utils';
import { eraseXCellAtom, marksAtom, paintXCellAtom, tapCellAtom } from '@features/stardoku-game/model/atoms';
import { useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useRef } from 'react';

/**
 * pending: 아직 탭인지 드래그인지 미정 / paint·erase: 드래그 확정 / dead: 드래그지만 할 일 없음(별에서 시작)
 * 임계값 전까지 탭 가능성을 열어두는 게 핵심 — 손가락이 굴러 옆 칸에 닿았다고 탭을 페인트로 바꾸면
 * 작은 셀(10×10에서 33px)에서 오조작이 상시 발생한다.
 */
const GESTURE_MODE = {
  PENDING: 'pending',
  PAINT: 'paint',
  ERASE: 'erase',
  DEAD: 'dead',
} as const;

type GestureMode = (typeof GESTURE_MODE)[keyof typeof GESTURE_MODE];

interface GestureState {
  start: CellPosition;
  originX: number;
  originY: number;
  mode: GestureMode;
  /** 이미 처리한 셀 — 같은 칸을 지나갈 때마다 토글되는 걸 막는다 */
  touched: Set<string>;
}

const cellFromPoint = (x: number, y: number): CellPosition | null => {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest<HTMLElement>('[data-stardoku-cell]');
  const row = cell?.dataset.row;
  const col = cell?.dataset.col;
  if (row === undefined || col === undefined) return null;
  return { row: Number(row), col: Number(col) };
};

/**
 * 보드 포인터 제스처.
 * - 임계값(DRAG_THRESHOLD_PX) 이전 = 탭 후보. 손을 떼면 탭으로 처리한다.
 * - 임계값을 넘으면 시작 칸의 상태로 드래그 성격이 정해진다: 빈칸 → ✕ 칠하기 / ✕ → 지우기 / ⭐ → 무시.
 *   드래그로 ⭐를 건드리지 않는 건 의도적이다 — 애써 놓은 별이 손가락 한 번에 쓸려나가면 안 된다.
 */
export const useBoardGestures = () => {
  const tapCell = useSetAtom(tapCellAtom);
  const paintX = useSetAtom(paintXCellAtom);
  const eraseX = useSetAtom(eraseXCellAtom);
  const readMark = useAtomCallback(
    useCallback((get, _set, position: CellPosition) => markAt(get(marksAtom), position.row, position.col), []),
  );
  const gestureRef = useRef<GestureState | null>(null);

  const applyAt = useCallback(
    (gesture: GestureState, position: CellPosition) => {
      const key = cellKey(position.row, position.col);
      if (gesture.touched.has(key)) return;
      gesture.touched.add(key);
      if (gesture.mode === GESTURE_MODE.PAINT) paintX(position);
      else if (gesture.mode === GESTURE_MODE.ERASE) eraseX(position);
    },
    [paintX, eraseX],
  );

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const position = cellFromPoint(event.clientX, event.clientY);
    if (!position) return;
    gestureRef.current = {
      start: position,
      originX: event.clientX,
      originY: event.clientY,
      mode: GESTURE_MODE.PENDING,
      touched: new Set(),
    };
    // 포인터 캡처 — 손가락이 보드 밖으로 나가도 드래그가 끊기지 않는다
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (gesture.mode === GESTURE_MODE.PENDING) {
        const movedFar = Math.hypot(event.clientX - gesture.originX, event.clientY - gesture.originY);
        if (movedFar < DRAG_THRESHOLD_PX) return;

        const startMark = readMark(gesture.start);
        if (startMark === CELL_MARK.EMPTY) gesture.mode = GESTURE_MODE.PAINT;
        else if (startMark === CELL_MARK.X) gesture.mode = GESTURE_MODE.ERASE;
        else gesture.mode = GESTURE_MODE.DEAD;
        applyAt(gesture, gesture.start);
      }

      if (gesture.mode === GESTURE_MODE.DEAD) return;
      const position = cellFromPoint(event.clientX, event.clientY);
      if (position) applyAt(gesture, position);
    },
    [applyAt, readMark],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture || gesture.mode !== GESTURE_MODE.PENDING) return;
      tapCell({ ...gesture.start, time: event.timeStamp });
    },
    [tapCell],
  );

  const handlePointerCancel = useCallback(() => {
    gestureRef.current = null;
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel };
};
