import * as THREE from 'three/webgpu';

import { Events } from '@views/drive/lib/engine/game/events';
import { getGame } from '@views/drive/lib/engine/game/gameContext';
import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';
import { References } from '@views/drive/lib/engine/game/references';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { circleIntersectsPolygon } from '@views/drive/lib/engine/game/utilities/maths';

type AreaEvents = { boundingIn: []; boundingOut: []; frustumIn: []; frustumOut: [] };

interface AreaFrustum {
  readonly position: THREE.Vector2;
  readonly radius: number;
  isIn: boolean | null;
  alwaysVisible: boolean;
}

function numberData(object: THREE.Object3D, key: string): number | undefined {
  const value: unknown = object.userData[key];
  return typeof value === 'number' ? value : undefined;
}

export class Area {
  readonly game = getGame();
  readonly model: THREE.Object3D;
  readonly events = new Events<AreaEvents>();
  readonly references = new References();
  readonly objects: { items: WorldObject[]; hideable: THREE.Object3D[] } = { items: [], hideable: [] };
  isIn = false;
  frustum: AreaFrustum | null = null;

  constructor(model: THREE.Object3D) {
    this.model = model;
    this.setObjects();
    this.#watchBounding();
    this.frustum = this.#createFrustum();
    this.game.ticker.events.on(
      'tick',
      () => {
        this.#testFrustum();
        const isInView = !this.frustum || this.frustum.isIn;
        if (isInView) this.update();
      },
      TICK_ORDER.area,
    );
  }

  setObjects(): void {
    for (const child of [...this.model.children]) {
      const preventAutoAdd: unknown = child.userData.preventAutoAdd;
      const shouldAutoAdd = preventAutoAdd === undefined || preventAutoAdd === false;
      if (shouldAutoAdd) this.#addChild(child);
      this.references.parse(child);
    }
  }

  #addChild(child: THREE.Object3D): void {
    const object = this.game.objects.addFromModel(
      child,
      {},
      {
        position: child.position.applyQuaternion(this.model.quaternion).add(this.model.position),
        rotation: child.quaternion.premultiply(this.model.quaternion),
        sleeping: true,
        mass: numberData(child, 'mass'),
      },
    );
    this.objects.items.push(object);

    const preventFrustum: unknown = child.userData.preventFrustum;
    const isStaticVisual = Boolean(object.visual) && (!object.physical || object.physical.type === 'fixed');
    const isHideable = (isStaticVisual && preventFrustum === undefined) || preventFrustum === false;
    if (!isHideable) return;
    if (object.visual) this.objects.hideable.push(object.visual.object3D);
  }

  requireReference(name: string): THREE.Object3D {
    const reference = this.references.items.get(name)?.[0];
    if (!reference) throw new Error(`Area reference is missing: ${name}`);
    return reference;
  }

  update(): void {}

  #watchBounding(): void {
    const reference = this.references.items.get('zoneBounding')?.[0];
    if (!reference) return;
    const zone = this.game.zones.create('cylinder', reference.position.clone(), reference.scale.x);
    zone.events.on('enter', () => {
      this.isIn = true;
      this.events.trigger('boundingIn');
    });
    zone.events.on('leave', () => {
      this.isIn = false;
      this.events.trigger('boundingOut');
    });
  }

  #createFrustum(): AreaFrustum | null {
    const reference = this.references.items.get('zoneFrustum')?.[0];
    if (!reference) return null;
    return {
      position: new THREE.Vector2(reference.position.x, reference.position.z),
      radius: reference.scale.x,
      isIn: null,
      alwaysVisible: false,
    };
  }

  #testFrustum(): void {
    const { frustum } = this;
    if (!frustum) return;
    const { quad2 } = this.game.view.optimalArea;
    const isVisible =
      frustum.alwaysVisible ||
      circleIntersectsPolygon(
        { center: frustum.position, radius: frustum.radius },
        quad2.map(({ offseted }) => offseted),
      );
    if (isVisible === frustum.isIn) return;

    for (const object3D of this.objects.hideable) object3D.visible = isVisible;
    frustum.isIn = isVisible;
    this.events.trigger(isVisible ? 'frustumIn' : 'frustumOut');
  }
}
