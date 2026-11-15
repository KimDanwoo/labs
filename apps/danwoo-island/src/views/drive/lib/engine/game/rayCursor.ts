import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import type { ActionTrigger } from './inputs/inputs';

export type IntersectShape = THREE.Sphere | THREE.Box3 | THREE.Plane | THREE.Mesh;

export interface IntersectDescription {
  active: boolean;
  shape: IntersectShape;
  onEnter?: () => void;
  onLeave?: () => void;
  onDown?: () => void;
  onUp?: () => void;
  onClick?: () => void;
}

export interface Intersect extends IntersectDescription {
  readonly position: THREE.Vector3 | null;
  isIntersecting: boolean;
  isDown: boolean;
}

const CLICK_TOLERANCE = 25;
const POINTER_CATEGORIES = ['intro', 'wandering', 'racing', 'cinematic'];

function positionOf(shape: IntersectShape): THREE.Vector3 | null {
  if (shape instanceof THREE.Mesh) return shape.getWorldPosition(new THREE.Vector3());
  return shape instanceof THREE.Sphere ? shape.center : null;
}

function isHit(raycaster: THREE.Raycaster, shape: IntersectShape): boolean {
  if (shape instanceof THREE.Sphere) return raycaster.ray.intersectsSphere(shape);
  if (shape instanceof THREE.Box3) return raycaster.ray.intersectsBox(shape);
  if (shape instanceof THREE.Plane) return raycaster.ray.intersectsPlane(shape);
  return raycaster.intersectObject(shape).length > 0;
}

export class RayCursor {
  readonly game = getGame();
  #isAnyIntersecting = false;
  #intersects: Intersect[] = [];
  #current: Intersect | null = null;
  #needsTest = false;
  readonly #raycaster = new THREE.Raycaster();
  readonly #travel = { x: 0, y: 0 };

  constructor() {
    this.game.inputs.addActions([{ name: 'rayPointer', categories: POINTER_CATEGORIES, keys: ['Pointer.any'] }]);
    this.game.inputs.events.on('rayPointer', (action) => {
      if (action.trigger) this.#test(action.trigger);
    });
  }

  addIntersect(description: IntersectDescription): Intersect {
    const intersect: Intersect = {
      ...description,
      position: positionOf(description.shape),
      isIntersecting: false,
      isDown: false,
    };
    this.#intersects.push(intersect);
    this.#needsTest = intersect.active;
    if (this.#needsTest) this.game.ticker.wait(1, () => this.#testPending());
    return intersect;
  }

  removeIntersect(intersect: Intersect): void {
    this.#intersects = this.#intersects.filter((candidate) => candidate !== intersect);
  }

  #testPending(): void {
    if (!this.#needsTest) return;
    this.#test('change');
    this.#needsTest = false;
  }

  #test(trigger: ActionTrigger): void {
    if (trigger === 'end') {
      this.#release();
      return;
    }
    this.#trackTravel(trigger);
    this.#hover();
    if (trigger === 'start' && this.#current) {
      this.#current.isDown = true;
      this.#current.onDown?.();
    }
  }

  #trackTravel(trigger: Exclude<ActionTrigger, 'end'>): void {
    if (trigger === 'start') {
      this.#travel.x = 0;
      this.#travel.y = 0;
      return;
    }
    const { delta } = this.game.inputs.pointer;
    this.#travel.x += Math.abs(delta.x);
    this.#travel.y += Math.abs(delta.y);
  }

  #isWithinReach({ position }: Intersect): boolean {
    if (!position) return true;
    const { focusPoint, optimalArea } = this.game.view;
    return Math.hypot(focusPoint.position.x - position.x, focusPoint.position.z - position.z) <= optimalArea.radius;
  }

  #hover(): void {
    const candidates = this.#intersects.filter((intersect) => intersect.active && this.#isWithinReach(intersect));
    if (candidates.length === 0) return;

    this.#aimRaycaster();
    const hits: Intersect[] = [];
    for (const intersect of candidates) {
      const isIntersecting = isHit(this.#raycaster, intersect.shape);
      if (isIntersecting !== intersect.isIntersecting) this.#setIntersecting(intersect, isIntersecting);
      if (isIntersecting) hits.push(intersect);
    }

    const isAnyIntersecting = hits.length > 0;
    if (isAnyIntersecting !== this.#isAnyIntersecting) {
      this.#isAnyIntersecting = isAnyIntersecting;
      this.game.canvasElement.style.cursor = isAnyIntersecting ? 'pointer' : '';
    }
    this.#current = this.#nearest(hits);
  }

  #nearest(hits: readonly Intersect[]): Intersect | null {
    const { origin } = this.#raycaster.ray;
    const distanceOf = ({ position }: Intersect): number => position?.distanceTo(origin) ?? Infinity;
    return hits.reduce<Intersect | null>(
      (nearest, hit) => (nearest === null || distanceOf(hit) < distanceOf(nearest) ? hit : nearest),
      null,
    );
  }

  #aimRaycaster(): void {
    const { pointer } = this.game.inputs;
    const { viewport } = this.game;
    const ndc = new THREE.Vector2(
      (pointer.current.x / viewport.width) * 2 - 1,
      -((pointer.current.y / viewport.height) * 2 - 1),
    );
    this.#raycaster.setFromCamera(ndc, this.game.view.camera);
  }

  #setIntersecting(intersect: Intersect, isIntersecting: boolean): void {
    intersect.isIntersecting = isIntersecting;
    if (!isIntersecting) {
      intersect.onLeave?.();
      return;
    }
    intersect.onEnter?.();
  }

  #release(): void {
    const isClick = Math.hypot(this.#travel.x, this.#travel.y) < CLICK_TOLERANCE;
    for (const intersect of this.#intersects.filter(({ active }) => active)) {
      if (intersect.isIntersecting) intersect.onUp?.();
      if (!intersect.isDown) continue;
      intersect.isDown = false;
      if (intersect.isIntersecting && isClick) intersect.onClick?.();
      if (!intersect.isIntersecting) intersect.onUp?.();
    }
  }
}
