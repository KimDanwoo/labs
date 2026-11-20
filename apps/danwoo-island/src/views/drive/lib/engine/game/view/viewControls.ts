import * as THREE from 'three/webgpu';

import type { Action } from '@views/drive/lib/engine/game/inputs/inputTypes';
import { Pointer } from '@views/drive/lib/engine/game/inputs/pointer';
import { clamp, lerp, remap } from '@views/drive/lib/engine/game/utilities/maths';
import type { View } from '@views/drive/lib/engine/game/view';
import {
  FOCUS,
  FOCUS_ACTIONS,
  type FocusPoint,
  MAP_DRAG,
  MIN_PAN_TOUCHES,
  SPHERICAL,
  type Spherical,
  ZOOM,
  type Zoom,
} from '@views/drive/lib/engine/game/view/viewConfig';

export function listenFocusActions(view: View): void {
  view.game.inputs.events.on('actionStart', (action) => {
    if (FOCUS_ACTIONS.has(action.name)) view.focusPoint.isTracking = true;
  });
}

export function listenZoom(view: View): void {
  view.game.inputs.addActions([
    { name: 'zoom', categories: ['wandering', 'racing'], keys: ['Wheel.roll'] },
    { name: 'zoomToggle', categories: ['wandering', 'racing'], keys: ['Gamepad.r3'] },
  ]);
  view.game.inputs.events.on('zoom', ({ value }) => {
    if (typeof value === 'number') nudgeZoom(view.zoom, -value * ZOOM.wheelSensitivity);
  });
  view.game.inputs.events.on('zoomToggle', ({ active }) => {
    if (!active) {
      view.zoom.toggle = 0;
      return;
    }
    view.zoom.toggle -= view.zoom.toggleLast;
    view.zoom.toggleLast = view.zoom.toggle;
  });
}

export function nudgeZoom(zoom: Zoom, amount: number): void {
  zoom.baseRatio = clamp(zoom.baseRatio + amount, 0, 1);
}

export function listenMapDrag(view: View): void {
  view.game.inputs.addActions([{ name: 'viewMapPointer', categories: ['intro', 'wandering'], keys: ['Pointer.any'] }]);
  view.game.inputs.events.on('viewMapPointer', (action) => dragMap(view, action));
}

function dragMap(view: View, { active }: Action): void {
  if (!active) return;
  const { pointer } = view.game.inputs;
  const isPanning = pointer.mode === Pointer.MODE_MOUSE || pointer.touches.length >= MIN_PAN_TOUCHES;
  if (isPanning) {
    view.focusPoint.isTracking = false;
    const smallestSide = Math.min(view.game.viewport.width, view.game.viewport.height);
    const movement = new THREE.Vector2(pointer.delta.x, pointer.delta.y)
      .rotateAround(new THREE.Vector2(), -view.spherical.theta)
      .multiplyScalar(MAP_DRAG.scale / smallestSide);
    view.focusPoint.position.x -= movement.x * MAP_DRAG.multiplier;
    view.focusPoint.position.z -= movement.y * MAP_DRAG.multiplier;
  }
  nudgeZoom(view.zoom, pointer.pinch.distanceDelta * ZOOM.pinchSensitivity);
}

export function panWithGamepad(view: View, delta: number): void {
  const { right } = view.game.inputs.gamepad.joysticks;
  if (!right.active) return;
  if (view.cinematic.active) return;
  view.focusPoint.isTracking = false;
  const movement = new THREE.Vector2(right.x, right.y)
    .rotateAround(new THREE.Vector2(), -view.spherical.theta)
    .multiplyScalar(MAP_DRAG.gamepadSpeed * delta);
  view.focusPoint.position.x += movement.x;
  view.focusPoint.position.z += movement.y;
}

export function followTarget(focusPoint: FocusPoint, delta: number): void {
  const { position, trackedPosition, magnet } = focusPoint;
  if (focusPoint.isTracking) {
    position.x = trackedPosition.x;
    position.z = trackedPosition.z;
  }
  if (!magnet.active) return;
  const dx = trackedPosition.x - position.x;
  const dz = trackedPosition.z - position.z;
  const strength = Math.hypot(dx, dz) * magnet.multiplier;
  position.x += strength * dx * delta;
  position.z += strength * dz * delta;
}

export function smoothFocus(focusPoint: FocusPoint, delta: number): number {
  const { smoothedPosition, position, easing } = focusPoint;
  const ratio = remap(easing, [0, 1], [1, delta * FOCUS.easingSpeed]);
  const next = smoothedPosition.clone().lerp(position, ratio);
  const moved = next.clone().sub(smoothedPosition);
  smoothedPosition.copy(next);
  return Math.hypot(moved.x, moved.z) / delta;
}

export function createSpherical(phi: number, smoothedRatio: number): Spherical {
  const spherical = {
    phi,
    theta: SPHERICAL.theta,
    radius: { current: lerp(SPHERICAL.radius.min, SPHERICAL.radius.max, 1 - smoothedRatio) },
    offset: new THREE.Vector3(),
  };
  spherical.offset.setFromSphericalCoords(spherical.radius.current, spherical.phi, spherical.theta);
  return spherical;
}
