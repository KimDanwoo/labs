import { CELL_MARK } from '@entities/stardoku/model/constants';
import { CellPosition } from '@entities/stardoku/model/types';
import { markAt } from '@entities/stardoku/model/utils';
import { marksAtom, paintXCellAtom, tapCellAtom } from '@features/stardoku-game/model/atoms';
import { useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useRef } from 'react';

interface GestureState {
  start: CellPosition;
  moved: boolean;
  painting: boolean;
}

const cellFromPoint = (x: number, y: number): CellPosition | null => {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest<HTMLElement>('[data-stardoku-cell]');
  const row = cell?.dataset.row;
  const col = cell?.dataset.col;
  if (row === undefined || col === undefined) return null;
  return { row: Number(row), col: Number(col) };
};

/** 보드 포인터 제스처: 탭은 tapCellAtom으로, 빈칸에서 시작한 드래그는 ✕ 페인트로 */
export const useBoardGestures = () => {
  const tapCell = useSetAtom(tapCellAtom);
  const paintX = useSetAtom(paintXCellAtom);
  const readMark = useAtomCallback(
    useCallback((get, _set, position: CellPosition) => markAt(get(marksAtom), position.row, position.col), []),
  );
  const gestureRef = useRef<GestureState | null>(null);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const position = cellFromPoint(event.clientX, event.clientY);
    if (!position) return;
    gestureRef.current = { start: position, moved: false, painting: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      const position = cellFromPoint(event.clientX, event.clientY);
      if (!position) return;

      const isStartCell = position.row === gesture.start.row && position.col === gesture.start.col;
      if (!gesture.moved && !isStartCell) {
        gesture.moved = true;
        if (readMark(gesture.start) === CELL_MARK.EMPTY) {
          gesture.painting = true;
          paintX(gesture.start);
        }
      }
      if (gesture.painting) paintX(position);
    },
    [paintX, readMark],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture || gesture.moved) return;
      tapCell({ ...gesture.start, time: event.timeStamp });
    },
    [tapCell],
  );

  const handlePointerCancel = useCallback(() => {
    gestureRef.current = null;
  }, []);

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel };
};
