import gsap from 'gsap';
import { color, uniform, vec2 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import { InteractivePoint } from './interactivePoint';
import { type InteractivePointOptions, type PointRegistry, type SharedParts } from './interactivePointShared';
import { createKeyIcon, KEY_ICON_SCALE } from './keyIcon';
import { lastVisiblePoint, nearbyPoints, needsRetest } from './pointProximity';
import { TICK_ORDER } from './tickOrder';

export class InteractivePoints implements PointRegistry {
  readonly #items: InteractivePoint[] = [];
  readonly #shared: SharedParts;
  #activeItem: InteractivePoint | null = null;
  #isTemporarilyHidden = true;
  #needsTest = false;

  constructor() {
    const game = getGame();
    const plane = new THREE.PlaneGeometry(2, 2);
    const label = new THREE.PlaneGeometry(1, 1, 1, 1);
    label.translate(0.5, 0, 0);
    const frontColor = uniform(color('#ffffff'));
    this.#shared = {
      plane,
      label,
      frontColor,
      backColor: uniform(color('#251f2b')),
      playerPosition: uniform(vec2()),
      keyIcon: createKeyIcon(plane, frontColor),
      sounds: {
        reveal: game.audio.register({
          group: 'reveal',
          path: 'sounds/paper/PaperMovement_fNAyV_01-3.mp3',
          autoplay: false,
          volume: 0.25,
        }),
        conceal: game.audio.register({
          group: 'reveal',
          path: 'sounds/paper/PaperMovement_fNAyV_01-2.mp3',
          autoplay: false,
          volume: 0.25,
        }),
      },
    };
    this.#bindInteract();
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.interactivePoints);
  }

  #bindInteract(): void {
    const { inputs } = getGame();
    const interactWithActive = (): void => {
      if (this.#activeItem?.state === 'open') this.#activeItem.interact();
    };
    inputs.events.on('interact', (action) => {
      if (action.active) interactWithActive();
    });
    inputs.interactiveButtons.events.on('interact', interactWithActive);
  }

  create(options: InteractivePointOptions): InteractivePoint {
    const item = new InteractivePoint(this, this.#shared, options, this.#isTemporarilyHidden);
    this.#items.push(item);
    return item;
  }

  isActive(item: InteractivePoint): boolean {
    return this.#activeItem === item;
  }

  focus(item: InteractivePoint): void {
    if (item.state === 'hidden') return;
    if (this.#activeItem && this.#activeItem !== item) this.#activeItem.conceal();
    this.#activeItem = item;
    item.reveal();
  }

  blur(item: InteractivePoint): void {
    if (this.#activeItem !== item || item.state === 'hidden') return;
    item.conceal();
    this.#activeItem = null;
  }

  release(item: InteractivePoint): void {
    if (this.#activeItem === item) this.#activeItem = null;
  }

  requestTest(): void {
    this.#needsTest = true;
  }

  growKeyIcon(): void {
    const { keyIcon } = this.#shared;
    keyIcon.visible = true;
    keyIcon.scale.setScalar(0);
    const scale = KEY_ICON_SCALE;
    gsap.to(keyIcon.scale, {
      x: scale,
      y: scale,
      z: scale,
      ease: 'elastic.out(1.3,0.8)',
      duration: 1.5,
      delay: 0.6,
      overwrite: true,
    });
  }

  shrinkKeyIcon(): void {
    const { keyIcon } = this.#shared;
    gsap.to(keyIcon.scale, {
      x: 0,
      y: 0,
      z: 0,
      ease: 'power2.in',
      duration: 0.6,
      overwrite: true,
      onComplete: () => {
        keyIcon.visible = false;
      },
    });
  }

  update(): void {
    const { player } = getGame();
    const { playerPosition } = this.#shared;
    const traveled = playerPosition.value.distanceTo(player.position2);
    if (!needsRetest(traveled, this.#needsTest)) return;
    this.#needsTest = false;
    playerPosition.value.copy(player.position2);

    const nearby = nearbyPoints(this.#items, player.position2);
    for (const item of this.#items) {
      if (nearby.includes(item) || !item.isIn) continue;
      item.isIn = false;
      if (item.state !== 'hidden') item.conceal();
    }

    const nextActive = lastVisiblePoint(nearby);
    if (!nextActive) {
      this.#activeItem = null;
      return;
    }
    if (this.#activeItem && nextActive !== this.#activeItem) {
      this.#activeItem.isIn = false;
      this.#activeItem.conceal();
    }
    if (!nextActive.isIn || this.#activeItem === null) {
      this.#activeItem = nextActive;
      nextActive.isIn = true;
      nextActive.reveal();
    }
  }

  temporaryHide(): void {
    this.#isTemporarilyHidden = true;
    for (const item of this.#items) {
      item.recoveryState = item.state;
      item.hide();
    }
  }

  recover(): void {
    this.#isTemporarilyHidden = false;
    for (const item of this.#items) {
      if (item.recoveryState !== 'hidden') item.show();
    }
  }
}
