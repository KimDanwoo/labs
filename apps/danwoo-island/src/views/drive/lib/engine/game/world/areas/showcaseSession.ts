import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { getGame } from '../../gameContext';
import type { Action } from '../../inputs/inputTypes';
import type { BlackBoard } from './showcaseBlackBoard';
import { fadeShades, type Shades } from './showcaseVisuals';

export type ShowcaseState = 'closed' | 'opening' | 'open' | 'closing';

interface CinematicOffsets {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
}

interface ShowcaseSessionOptions {
  readonly anchor: THREE.Vector3;
  readonly offsets: CinematicOffsets;
  readonly shades: Shades;
  readonly blackBoard: BlackBoard;
  readonly setIntersectsActive: (isActive: boolean) => void;
}

interface ShowcaseControls {
  readonly isOpen: () => boolean;
  readonly previous: () => void;
  readonly next: () => void;
  readonly openUrl: () => void;
  readonly close: () => void;
}

const TRANSITION_DURATION = 1.5;
const RECOVER_POINTS_DELAY = 1;
const SHOWCASE_BUTTONS = ['previous', 'next', 'open', 'close'];

export class ShowcaseSession {
  #state: ShowcaseState = 'closed';
  #transition: gsap.core.Tween | null = null;
  readonly #game = getGame();
  readonly #position: THREE.Vector3;
  readonly #target: THREE.Vector3;
  readonly #shades: Shades;
  readonly #blackBoard: BlackBoard;
  readonly #setIntersectsActive: (isActive: boolean) => void;

  constructor({ anchor, offsets, shades, blackBoard, setIntersectsActive }: ShowcaseSessionOptions) {
    const ground = new THREE.Vector3(anchor.x, 0, anchor.z);
    this.#position = ground.clone().add(offsets.position);
    this.#target = ground.clone().add(offsets.target);
    this.#shades = shades;
    this.#blackBoard = blackBoard;
    this.#setIntersectsActive = setIntersectsActive;
  }

  get state(): ShowcaseState {
    return this.#state;
  }

  get isOpen(): boolean {
    return this.#state === 'open';
  }

  get isShown(): boolean {
    return this.#state === 'open' || this.#state === 'opening';
  }

  get isHidden(): boolean {
    return this.#state === 'closed' || this.#state === 'closing';
  }

  #transitionTo(transient: ShowcaseState, settled: ShowcaseState): void {
    this.#state = transient;
    this.#transition?.kill();
    this.#transition = gsap.delayedCall(TRANSITION_DURATION, () => {
      this.#state = settled;
      this.#transition = null;
    });
  }

  open(): void {
    if (this.isShown) return;
    this.#transitionTo('opening', 'open');
    const { inputs, view, interactivePoints, physicalVehicle, audio } = this.#game;
    inputs.filters.delete('wandering');
    inputs.filters.add('cinematic');
    view.cinematic.start(this.#position, this.#target);
    interactivePoints.temporaryHide();
    fadeShades(this.#shades, 'open');
    this.#blackBoard.resume();
    this.#setIntersectsActive(true);
    physicalVehicle.deactivate();
    inputs.interactiveButtons.clearItems();
    inputs.interactiveButtons.addItems(SHOWCASE_BUTTONS);
    audio.groups.get('click')?.play(true);
  }

  close(): void {
    if (this.isHidden) return;
    this.#transitionTo('closing', 'closed');
    const { inputs, view, interactivePoints, physicalVehicle, audio } = this.#game;
    inputs.filters.delete('cinematic');
    inputs.filters.add('wandering');
    view.cinematic.end();
    fadeShades(this.#shades, 'close');
    gsap.delayedCall(RECOVER_POINTS_DELAY, () => interactivePoints.recover());
    this.#setIntersectsActive(false);
    physicalVehicle.activate();
    inputs.interactiveButtons.clearItems();
    audio.groups.get('click')?.play(false);
  }
}

export function bindShowcaseInputs({ isOpen, previous, next, openUrl, close }: ShowcaseControls): void {
  const { inputs } = getGame();
  const whenActive = (handler: () => void) => (action: Action) => {
    if (action.active) handler();
  };
  inputs.events.on('left', whenActive(previous));
  inputs.events.on('right', whenActive(next));
  inputs.events.on('forward', (action: Action) => {
    if (action.active && !action.activeKeys.has('Gamepad.r2')) previous();
  });
  inputs.events.on('backward', (action: Action) => {
    if (action.active && !action.activeKeys.has('Gamepad.l2')) next();
  });
  inputs.events.on('interact', (action: Action) => {
    if (!action.active && isOpen()) openUrl();
  });

  const whenOpen = (handler: () => void) => () => {
    if (isOpen()) handler();
  };
  const buttons = inputs.interactiveButtons.events;
  buttons.on('previous', whenOpen(previous));
  buttons.on('next', whenOpen(next));
  buttons.on('open', whenOpen(openUrl));
  buttons.on('close', whenOpen(close));
}
