import { DRAG_START_PX, POINTER_TYPE, SNAP_RADIUS, TAP_MAX_DISTANCE } from '@views/slitherlink/config/boardView';
import {
  nearestEdge,
  nearestVertex,
  toLatticePoint,
  vertexWithin,
  type LatticePoint,
} from '@views/slitherlink/lib/boardHit';
import { getTopology } from '@views/slitherlink/lib/topology';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { useRef, useState, type PointerEvent, type RefObject } from 'react';

interface Gesture {
  pointerId: number;
  clientX: number;
  clientY: number;
  point: LatticePoint;
  isDragging: boolean;
}

type BoardPointerEvent = PointerEvent<SVGSVGElement>;

export interface BoardPointer {
  hoverEdge: number | null;
  handlers: {
    onPointerDown: (event: BoardPointerEvent) => void;
    onPointerMove: (event: BoardPointerEvent) => void;
    onPointerUp: (event: BoardPointerEvent) => void;
    onPointerCancel: (event: BoardPointerEvent) => void;
    onPointerLeave: () => void;
  };
}

export const useBoardPointer = (svgRef: RefObject<SVGSVGElement | null>): BoardPointer => {
  const game = useSlitherlinkContext();
  const gesture = useRef<Gesture | null>(null);
  const [hoverEdge, setHoverEdge] = useState<number | null>(null);
  const size = game.boardSize;
  const topology = getTopology(size);

  const pointOf = (event: BoardPointerEvent): LatticePoint | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect ? toLatticePoint(rect, size, event.clientX, event.clientY) : null;
  };

  const ownedGesture = (event: BoardPointerEvent): Gesture | null => {
    const active = gesture.current;
    const isSamePointer = active !== null && active.pointerId === event.pointerId;
    return isSamePointer ? active : null;
  };

  const updateHover = (event: BoardPointerEvent): void => {
    const point = pointOf(event);
    const isHoverable = game.isPlaying && event.pointerType === POINTER_TYPE.MOUSE && point !== null;
    setHoverEdge(isHoverable ? nearestEdge(topology, point, TAP_MAX_DISTANCE) : null);
  };

  const startDragIfMoved = (active: Gesture, event: BoardPointerEvent): boolean => {
    if (active.isDragging) return true;
    const moved = Math.hypot(event.clientX - active.clientX, event.clientY - active.clientY);
    if (moved < DRAG_START_PX) return false;
    active.isDragging = true;
    game.beginStroke(nearestVertex(size, active.point));
    return true;
  };

  const onPointerDown = (event: BoardPointerEvent): void => {
    const point = pointOf(event);
    const canStartGesture = event.isPrimary && game.isPlaying;
    if (!canStartGesture) return;
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      point,
      isDragging: false,
    };
    setHoverEdge(null);
  };

  const onPointerMove = (event: BoardPointerEvent): void => {
    const active = ownedGesture(event);
    if (!gesture.current) updateHover(event);
    if (!active) return;
    if (!startDragIfMoved(active, event)) return;
    const point = pointOf(event);
    const vertex = point ? vertexWithin(size, point, SNAP_RADIUS) : null;
    if (vertex !== null) game.strokeTo(vertex);
  };

  const onPointerUp = (event: BoardPointerEvent): void => {
    const active = ownedGesture(event);
    if (!active) return;
    gesture.current = null;
    if (active.isDragging) {
      game.endStroke();
      return;
    }
    const edge = nearestEdge(topology, active.point, TAP_MAX_DISTANCE);
    if (edge !== null) game.tapEdge(edge);
  };

  const onPointerCancel = (event: BoardPointerEvent): void => {
    const active = ownedGesture(event);
    if (!active) return;
    gesture.current = null;
    if (active.isDragging) game.cancelStroke();
  };

  return {
    hoverEdge,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave: () => setHoverEdge(null) },
  };
};
