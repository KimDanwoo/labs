import gsap from 'gsap';
import type * as THREE from 'three/webgpu';

import { getGame } from '../../gameContext';
import { INPUT_MODE } from '../../inputs/inputs';

interface Labels {
  readonly playstation: THREE.Object3D;
  readonly xbox: THREE.Object3D;
  readonly mouseKeyboard: THREE.Object3D;
}

const JUMP = { start: 2, height: 0.25, duration: 0.7 } as const;
const WOBBLE = [
  { x: 0.1, at: 0, duration: 0.15 },
  { x: -0.1, at: 0.15, duration: 0.3 },
  { x: 0.1, at: 0.45, duration: 0.3 },
  { x: -0.1, at: 0.75, duration: 0.3 },
  { x: 0, at: 1.05, duration: 0.3 },
] as const;
const REPEAT_DELAY = 5;

export class BlackBoard {
  isActive = true;
  readonly #timeline: gsap.core.Timeline;
  readonly #game = getGame();

  constructor(require: (name: string) => THREE.Object3D, isIdle: () => boolean) {
    const group = require('blackBoard');
    const parent = group.parent;
    this.#timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: REPEAT_DELAY,
      paused: true,
      onRepeat: () => {
        if (isIdle() || !this.isActive) this.#timeline.pause();
      },
    });
    this.#timeline.to(group.position, { y: JUMP.height, ease: 'power2.out', duration: JUMP.duration }, JUMP.start);
    this.#timeline.to(group.position, { y: 0, ease: 'power2.in', duration: JUMP.duration }, JUMP.duration + JUMP.start);
    for (const { x, at, duration } of WOBBLE) this.#timeline.to(group.rotation, { x, duration }, at + JUMP.start);

    const labels: Labels = {
      playstation: require('blackboardLabelsGamepadPlaystation'),
      xbox: require('blackboardLabelsGamepadXbox'),
      mouseKeyboard: require('blackboardLabelsMouseKeyboard'),
    };
    for (const label of Object.values(labels)) label.castShadow = false;
    labels.playstation.visible = false;
    labels.xbox.visible = false;

    const { inputs } = this.#game;
    inputs.modeEvents.on('change', () => {
      if (inputs.mode === INPUT_MODE.gamepad) {
        this.#showGamepadLabels(labels);
        labels.mouseKeyboard.visible = false;
        parent?.add(group);
      } else if (inputs.mode === INPUT_MODE.mouseKeyboard) {
        labels.xbox.visible = false;
        labels.playstation.visible = false;
        labels.mouseKeyboard.visible = true;
        parent?.add(group);
      } else if (inputs.mode === INPUT_MODE.touch) {
        parent?.remove(group);
      }
    });
    inputs.gamepad.events.on('typeChange', () => {
      if (inputs.mode === INPUT_MODE.gamepad) this.#showGamepadLabels(labels);
    });
  }

  #showGamepadLabels({ xbox, playstation }: Labels): void {
    const isXbox = this.#game.inputs.gamepad.type === 'xbox';
    xbox.visible = isXbox;
    playstation.visible = !isXbox;
  }

  resume(): void {
    if (!this.isActive) return;
    this.#timeline.repeat(-1);
    this.#timeline.resume();
  }
}
