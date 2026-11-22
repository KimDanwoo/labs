import gsap from 'gsap';
import { float, Fn, instancedArray, step, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { INPUT_MODE, type InputMode } from '@views/drive/lib/engine/game/inputs/inputTypes';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { replaceBonfireBase } from '@views/drive/lib/engine/game/world/islandStructures';
import { rebuildVillageProps } from '@views/drive/lib/engine/game/world/islandVillage';
import { rebuildKeyboardDeck, rebuildKiosk } from '@views/drive/lib/engine/game/world/villageStructures';

const EMBERS = { count: 30, elevation: 5, size: 0.5, segments: 8, hideAt: 0.8, hideLift: 100 } as const;
const BURN_DELAY = 2;
const EMBER_BOUNDS = { centerY: 2, radius: 2, delayFrames: 2 } as const;
const TIME_SPEED = 0.1;
const CONTROLS_TAB: Record<InputMode, string> = {
  [INPUT_MODE.gamepad]: 'gamepad',
  [INPUT_MODE.mouseKeyboard]: 'mouse-keyboard',
  [INPUT_MODE.touch]: 'touch',
};

function emberData(): { positions: Float32Array; scales: Float32Array } {
  const positions = new Float32Array(EMBERS.count * 3);
  const scales = new Float32Array(EMBERS.count);
  for (let index = 0; index < EMBERS.count; index += 1) {
    const angle = Math.PI * 2 * Math.random();
    const radius = Math.random() ** 1.5 * 1;
    positions.set([Math.cos(angle) * radius, Math.random(), Math.sin(angle) * radius], index * 3);
    scales[index] = 0.02 + Math.random() * 0.06;
  }
  return { positions, scales };
}

const NAME_LETTERS = /^refLettersPhysicalDynamic/;

function removeNameLetters(model: THREE.Object3D): void {
  for (const letter of model.children.filter(({ name }) => NAME_LETTERS.test(name))) model.remove(letter);
}

export class LandingArea extends Area {
  readonly #localTime = uniform(0);

  constructor(model: THREE.Object3D) {
    super(model);
    this.#createKioskPoint();
    this.#createControlsPoint();
    this.#createBonfire();
  }

  override setObjects(): void {
    replaceBonfireBase(this.model);
    rebuildVillageProps(this.model);
    removeNameLetters(this.model);
    rebuildKiosk(this.model, this.game.texture('islandMapTexture'));
    rebuildKeyboardDeck(this.model);
    super.setObjects();
  }

  #interactButtons(): { onReveal: () => void; onConceal: () => void; onHide: () => void } {
    const { interactiveButtons } = this.game.inputs;
    return {
      onReveal: () => interactiveButtons.addItems(['interact']),
      onConceal: () => interactiveButtons.removeItems(['interact']),
      onHide: () => interactiveButtons.removeItems(['interact']),
    };
  }

  #createKioskPoint(): void {
    this.game.interactivePoints.create({
      position: this.requireReference('kioskInteractivePoint').position,
      text: '지도',
      align: 'right',
      state: 'concealed',
      onInteract: () => {
        this.game.inputs.interactiveButtons.clearItems();
        this.game.modals.open('map');
      },
      ...this.#interactButtons(),
    });
  }

  #createControlsPoint(): void {
    const { inputs, menu } = this.game;
    const point = this.game.interactivePoints.create({
      position: this.requireReference('controlsInteractivePoint').position,
      text: '조작법',
      align: 'right',
      state: 'concealed',
      onInteract: () => {
        inputs.interactiveButtons.clearItems();
        menu.open('controls');
        point.hide();
      },
      ...this.#interactButtons(),
    });
    const controls = menu.items.get('controls');
    if (!controls) return;
    controls.events.on('close', () => point.show());
    controls.events.on('open', () => controls.tabs?.goTo(CONTROLS_TAB[inputs.mode]));
  }

  #createEmbers(position: THREE.Vector3): THREE.Mesh {
    const { materials, wind } = this.game;
    const { positions, scales } = emberData();
    const positionAttribute = instancedArray(positions, 'vec3').toAttribute();
    const scaleAttribute = instancedArray(scales, 'float').toAttribute();
    const elevation = uniform(EMBERS.elevation);
    const material = new THREE.SpriteNodeMaterial();
    material.outputNode = materials.emissiveOutput('emissiveOrangeRadialGradient');

    const progress = float(0).toVar();
    material.positionNode = Fn(() => {
      const newPosition = positionAttribute.toVar();
      progress.assign(newPosition.y.add(this.#localTime.mul(newPosition.y)).fract());
      newPosition.y.assign(progress.mul(elevation));
      newPosition.xz.addAssign(wind.direction.mul(progress));
      newPosition.y.addAssign(step(EMBERS.hideAt, progress).mul(EMBERS.hideLift));
      return newPosition;
    })();
    material.scaleNode = Fn(() => scaleAttribute.mul(progress.remapClamp(0.5, 1, 1, 0)))();

    const embers = new THREE.Mesh(new THREE.CircleGeometry(EMBERS.size, EMBERS.segments), material);
    embers.visible = false;
    embers.position.copy(position);
    embers.count = EMBERS.count;
    this.game.scene.add(embers);
    return embers;
  }

  #createBonfire(): void {
    const position = this.requireReference('bonfireHashes').position;
    const embers = this.#createEmbers(position);
    const burn = this.requireReference('bonfireBurn');
    burn.visible = false;

    this.game.interactivePoints.create({
      position: this.requireReference('bonfireInteractivePoint').position,
      text: '초기화',
      align: 'right',
      state: 'concealed',
      onInteract: () => {
        this.game.reset();
        gsap.delayedCall(BURN_DELAY, () => {
          embers.visible = true;
          burn.visible = true;
          this.game.ticker.wait(EMBER_BOUNDS.delayFrames, () => {
            const bounds = embers.geometry.boundingSphere;
            if (!bounds) return;
            bounds.center.y = EMBER_BOUNDS.centerY;
            bounds.radius = EMBER_BOUNDS.radius;
          });
          this.game.audio.groups.get('campfire')?.items[0]?.positions?.push(position);
        });
      },
      ...this.#interactButtons(),
    });
  }

  override update(): void {
    this.#localTime.value += this.game.ticker.deltaScaled * TIME_SPEED;
  }
}
