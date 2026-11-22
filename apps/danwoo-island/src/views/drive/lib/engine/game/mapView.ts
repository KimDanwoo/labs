import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import {
  COMPACT_SCREEN,
  FLIGHT,
  FRAME_INSETS,
  HIDDEN_CLASS,
  LABEL_FLIP_MARGIN,
  LABEL_LEFT_CLASS,
  PAN_REACH,
} from '@views/drive/lib/engine/game/mapConfig';
import type { OverviewFrame, ScreenInsets } from '@views/drive/lib/engine/game/view/overviewFrame';

export function mapInsets(width: number, height: number): ScreenInsets {
  const isNarrow = width <= COMPACT_SCREEN.width;
  const isShort = height <= COMPACT_SCREEN.height;
  const isShortAndWide = isShort && !isNarrow;
  if (isShortAndWide) return FRAME_INSETS.short;
  return isNarrow ? FRAME_INSETS.compact : FRAME_INSETS.wide;
}

export function flyFocus(target: THREE.Vector3, duration: number): void {
  gsap.to(getGame().view.focusPoint.position, {
    x: target.x,
    z: target.z,
    duration,
    ease: FLIGHT.ease,
    overwrite: true,
  });
}

export function panWithin(bounds: OverviewFrame, focus: THREE.Vector3): void {
  const offset = new THREE.Vector2(focus.x - bounds.center.x, focus.z - bounds.center.z);
  offset.clampLength(0, bounds.radius * PAN_REACH);
  const { position } = getGame().view.focusPoint;
  position.x = bounds.center.x + offset.x;
  position.z = bounds.center.z + offset.y;
}

export function placeOnScreen(
  element: HTMLElement,
  world: THREE.Vector3,
  projected: THREE.Vector3,
  placements: WeakMap<HTMLElement, string>,
): void {
  const { camera } = getGame().view;
  const { width, height } = getGame().viewport;
  projected.copy(world).project(camera);
  const isVisible = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
  const x = (projected.x * 0.5 + 0.5) * width;
  const y = (-projected.y * 0.5 + 0.5) * height;
  const placement = isVisible ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` : HIDDEN_CLASS;
  if (placements.get(element) === placement) return;
  placements.set(element, placement);
  element.classList.toggle(HIDDEN_CLASS, !isVisible);
  const isNearRightEdge = x > width - LABEL_FLIP_MARGIN;
  const hasLeftLabel = isNearRightEdge || element.dataset.labelSide === 'left';
  element.classList.toggle(LABEL_LEFT_CLASS, hasLeftLabel);
  if (isVisible) element.style.transform = placement;
}
