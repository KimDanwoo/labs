import { SIDE } from '@views/gostop/config/game';
import { DEAL_FLIGHT_MS, FLIGHT_ORIGIN, FLIGHT_RATIO, SIZE_EPSILON_PX, STEP_KIND } from '@views/gostop/config/playback';
import type { FlightOrigin, PlaybackStep } from '@views/gostop/model/types/playback';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlightPlan {
  isDeal: boolean;
  origin: FlightOrigin;
  durationMs: number;
}

export function flightPlanOf(step: PlaybackStep | null, speedFactor: number, isReduced: boolean): FlightPlan | null {
  if (!step) return null;
  if (isReduced) return null;
  const isDeal = step.kind === STEP_KIND.DEAL;
  const isRivalPlay = step.kind === STEP_KIND.PLAY && step.side === SIDE.COMPUTER;
  return {
    isDeal,
    origin: isRivalPlay ? FLIGHT_ORIGIN.COMPUTER : FLIGHT_ORIGIN.DECK,
    durationMs: (isDeal ? DEAL_FLIGHT_MS : step.durationMs * FLIGHT_RATIO) * speedFactor,
  };
}

const isSameNumber = (a: number, b: number): boolean => Math.abs(a - b) < SIZE_EPSILON_PX;

function isSameBox(a: Box, b: Box): boolean {
  const isSamePlace = isSameNumber(a.x, b.x) && isSameNumber(a.y, b.y);
  const isSameSize = isSameNumber(a.width, b.width) && isSameNumber(a.height, b.height);
  return isSamePlace && isSameSize;
}

export function flightFrames(from: Box, to: Box, isEntering: boolean): Keyframe[] | null {
  const hasSize = to.width > 0 && to.height > 0;
  const isStill = !hasSize || isSameBox(from, to);
  if (isStill) return null;
  const transform = `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  const startOpacity = isEntering ? 0.4 : 1;
  return [
    { transform, transformOrigin: '0 0', opacity: startOpacity },
    { transform: 'none', transformOrigin: '0 0', opacity: 1 },
  ];
}

function offsetWithin(node: HTMLElement, root: HTMLElement, x: number, y: number): Box | null {
  if (node === root) return { x, y, width: 0, height: 0 };
  const parent = node.offsetParent;
  if (!(parent instanceof HTMLElement)) return null;
  return offsetWithin(parent, root, x + node.offsetLeft, y + node.offsetTop);
}

export function layoutBoxWithin(element: HTMLElement, root: HTMLElement): Box | null {
  const offset = offsetWithin(element, root, 0, 0);
  if (!offset) return null;
  return { ...offset, width: element.offsetWidth, height: element.offsetHeight };
}
