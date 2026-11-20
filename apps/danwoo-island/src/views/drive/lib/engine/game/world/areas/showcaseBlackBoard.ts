import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { INPUT_MODE } from '@views/drive/lib/engine/game/inputs/inputTypes';
import { QUARTER_TURN } from '@views/drive/lib/engine/game/world/islandGeometry';
import { islandModelMesh, islandPaletteMaterial } from '@views/drive/lib/engine/game/world/islandModels';

type Require = (name: string) => THREE.Object3D;

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
const LABEL_PREFIX = /^refBlackboardLabels/;
const MENU_SIGN_OFFSET = 0.34;

function showGamepadLabels({ xbox, playstation }: Labels): void {
  const isXbox = getGame().inputs.gamepad.type === 'xbox';
  xbox.visible = isXbox;
  playstation.visible = !isXbox;
}

function dressMenuSign(board: THREE.Object3D): void {
  for (const child of board.children) {
    const isUnlabeledMesh = child instanceof THREE.Mesh && !LABEL_PREFIX.test(child.name);
    if (isUnlabeledMesh) child.geometry.setDrawRange(0, 0);
  }
  const matrix = new THREE.Matrix4()
    .makeTranslation(MENU_SIGN_OFFSET, 0, 0)
    .multiply(new THREE.Matrix4().makeRotationY(QUARTER_TURN));
  const sign = islandModelMesh('surfMenuSign', matrix);
  sign.material = islandPaletteMaterial('surfMenuSign');
  board.add(sign);
}

function bindBlackBoardLabels(require: Require): void {
  const group = require('blackBoard');
  const parent = group.parent;
  const labels: Labels = {
    playstation: require('blackboardLabelsGamepadPlaystation'),
    xbox: require('blackboardLabelsGamepadXbox'),
    mouseKeyboard: require('blackboardLabelsMouseKeyboard'),
  };
  for (const label of Object.values(labels)) label.castShadow = false;
  labels.playstation.visible = false;
  labels.xbox.visible = false;

  const { inputs } = getGame();
  inputs.modeEvents.on('change', () => {
    if (inputs.mode === INPUT_MODE.gamepad) {
      showGamepadLabels(labels);
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
    if (inputs.mode === INPUT_MODE.gamepad) showGamepadLabels(labels);
  });
}

export function setUpBlackBoard(require: Require): void {
  dressMenuSign(require('blackBoard'));
  bindBlackBoardLabels(require);
}

export class BlackBoard {
  isActive = true;
  readonly #timeline: gsap.core.Timeline;

  constructor(require: Require, isIdle: () => boolean) {
    const group = require('blackBoard');
    this.#timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: REPEAT_DELAY,
      paused: true,
      onRepeat: () => {
        const shouldPauseTimeline = isIdle() || !this.isActive;
        if (shouldPauseTimeline) this.#timeline.pause();
      },
    });
    this.#timeline.to(group.position, { y: JUMP.height, ease: 'power2.out', duration: JUMP.duration }, JUMP.start);
    this.#timeline.to(group.position, { y: 0, ease: 'power2.in', duration: JUMP.duration }, JUMP.duration + JUMP.start);
    for (const { x, at, duration } of WOBBLE) this.#timeline.to(group.rotation, { x, duration }, at + JUMP.start);
    setUpBlackBoard(require);
  }

  resume(): void {
    if (!this.isActive) return;
    this.#timeline.repeat(-1);
    this.#timeline.resume();
  }
}
