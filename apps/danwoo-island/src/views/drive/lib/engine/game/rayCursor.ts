import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { ActionTrigger } from '@views/drive/lib/engine/game/inputs/inputTypes';
import {
  focusTarget,
  isClickTravel,
  nearestHit,
  pressTarget,
  type RayTarget,
  releaseTargets,
} from '@views/drive/lib/engine/game/rayTargets';

type IntersectShape = THREE.Sphere | THREE.Box3 | THREE.Plane | THREE.Mesh;

interface IntersectDescription extends Omit<RayTarget, 'isIntersecting' | 'isDown'> {
  shape: IntersectShape;
}

export interface Intersect extends IntersectDescription, RayTarget {
  readonly position: THREE.Vector3 | null;
}

const POINTER_CATEGORIES = ['intro', 'wandering', 'racing', 'cinematic'];

function positionOf(shape: IntersectShape): THREE.Vector3 | null {
  if (shape instanceof THREE.Mesh) return shape.getWorldPosition(new THREE.Vector3());
  return shape instanceof THREE.Sphere ? shape.center : null;
}

function rayPoint(raycaster: THREE.Raycaster, shape: Exclude<IntersectShape, THREE.Mesh>): THREE.Vector3 | null {
  const { ray } = raycaster;
  const point = new THREE.Vector3();
  if (shape instanceof THREE.Sphere) return ray.intersectSphere(shape, point);
  if (shape instanceof THREE.Box3) return ray.intersectBox(shape, point);
  return ray.intersectPlane(shape, point);
}

function hitDistance(raycaster: THREE.Raycaster, shape: IntersectShape): number | null {
  if (shape instanceof THREE.Mesh) return raycaster.intersectObject(shape)[0]?.distance ?? null;
  return rayPoint(raycaster, shape)?.distanceTo(raycaster.ray.origin) ?? null;
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
    if (trigger === 'start' && this.#current) pressTarget(this.#current);
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
    const nearest = nearestHit(candidates, ({ shape }) => hitDistance(this.#raycaster, shape));
    focusTarget(candidates, nearest);

    const isAnyIntersecting = nearest !== null;
    if (isAnyIntersecting !== this.#isAnyIntersecting) {
      this.#isAnyIntersecting = isAnyIntersecting;
      this.game.canvasElement.style.cursor = isAnyIntersecting ? 'pointer' : '';
    }
    this.#current = nearest;
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

  #release(): void {
    releaseTargets(this.#intersects, isClickTravel(this.#travel));
  }
}
