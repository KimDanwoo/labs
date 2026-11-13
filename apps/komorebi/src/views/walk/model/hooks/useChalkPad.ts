import { useEffect, useRef, type PointerEvent, type RefObject } from 'react';
import {
  CHALK_TOOL,
  canAddPoint,
  canAddStroke,
  isFarEnough,
  paintChalk,
  paintStroke,
  roundCoordinate,
  type ChalkColor,
  type ChalkStroke,
} from '../../lib/chalkboard';
import { chalkboardStore } from '../store/chalkboard';

export type ChalkBrush = ChalkColor | typeof CHALK_TOOL.eraser;

export const CHALK_NOTICE = {
  full: '칠판이 가득 찼어요. 지우개나 되돌리기로 자리를 만들어 주세요.',
  unsaved: '이번 산책에서는 남아 있지만, 다음에 다시 오면 지워져 있을 수 있어요.',
} as const;
export type ChalkNotice = (typeof CHALK_NOTICE)[keyof typeof CHALK_NOTICE];

type Options = {
  strokes: readonly ChalkStroke[];
  brush: ChalkBrush;
  onNotice: (notice: ChalkNotice) => void;
};

const startStroke = (brush: ChalkBrush, x: number, y: number): ChalkStroke =>
  brush === CHALK_TOOL.eraser
    ? { tool: CHALK_TOOL.eraser, points: [x, y] }
    : { tool: CHALK_TOOL.chalk, color: brush, points: [x, y] };

function boardPoint(event: PointerEvent<HTMLCanvasElement>) {
  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  return {
    x: roundCoordinate((event.clientX - rect.left - canvas.clientLeft) / canvas.clientWidth),
    y: roundCoordinate((event.clientY - rect.top - canvas.clientTop) / canvas.clientHeight),
  };
}

export function useChalkPad(canvasRef: RefObject<HTMLCanvasElement | null>, { strokes, brush, onNotice }: Options) {
  const draft = useRef<ChalkStroke | null>(null);
  // Only the pointer that started the stroke may extend or end it; a second finger is ignored.
  const activePointer = useRef<number | null>(null);
  const committed = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) paintChalk(ctx, strokes);
  }, [canvasRef, strokes]);

  function redrawDraft(canvas: HTMLCanvasElement, stroke: ChalkStroke) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !committed.current) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(committed.current, 0, 0);
    paintStroke(ctx, stroke);
  }

  function snapshot(canvas: HTMLCanvasElement) {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext('2d')?.drawImage(canvas, 0, 0);
    return copy;
  }

  const isActive = (event: PointerEvent<HTMLCanvasElement>) => event.pointerId === activePointer.current;

  function finish() {
    const stroke = draft.current;
    draft.current = null;
    activePointer.current = null;
    committed.current = null;
    if (!stroke) return;
    if (!chalkboardStore.set([...strokes, stroke])) onNotice(CHALK_NOTICE.unsaved);
  }

  function finishIfActive(event: PointerEvent<HTMLCanvasElement>) {
    if (isActive(event)) finish();
  }

  return {
    onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
      if (event.button !== 0 || draft.current) return;
      if (!canAddStroke(strokes) || !canAddPoint(strokes, [])) {
        onNotice(CHALK_NOTICE.full);
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointer.current = event.pointerId;
      const { x, y } = boardPoint(event);
      committed.current = snapshot(event.currentTarget);
      draft.current = startStroke(brush, x, y);
      redrawDraft(event.currentTarget, draft.current);
    },
    onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
      const stroke = draft.current;
      if (!stroke || !isActive(event)) return;
      const { x, y } = boardPoint(event);
      if (!isFarEnough(stroke.points, x, y)) return;
      if (!canAddPoint(strokes, stroke.points)) {
        onNotice(CHALK_NOTICE.full);
        finish();
        return;
      }
      stroke.points.push(x, y);
      redrawDraft(event.currentTarget, stroke);
    },
    onPointerUp: finishIfActive,
    onPointerCancel: finishIfActive,
    onLostPointerCapture: finishIfActive,
  };
}
