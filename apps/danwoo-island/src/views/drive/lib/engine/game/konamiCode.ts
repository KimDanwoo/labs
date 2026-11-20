import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { isModel, modelResource } from '@views/drive/lib/engine/game/resourcesLoader';
import { VisualVehicle } from '@views/drive/lib/engine/game/world/visualVehicle';

const SEQUENCE: readonly (readonly string[])[] = [
  ['ArrowUp', 'KeyW'],
  ['ArrowUp', 'KeyW'],
  ['ArrowDown', 'KeyS'],
  ['ArrowDown', 'KeyS'],
  ['ArrowLeft', 'KeyA'],
  ['ArrowRight', 'KeyD'],
  ['ArrowLeft', 'KeyA'],
  ['ArrowRight', 'KeyD'],
  ['KeyB'],
  ['KeyQ', 'KeyA'],
];
const VEHICLE_MODELS = ['vehicle/oldSchool.glb', 'vehicle/default.glb'] as const;
const CONFETTI_OFFSETS = [new THREE.Vector3(), new THREE.Vector3(1, -1, 1.5), new THREE.Vector3(1, -1, -1.5)];

export class KonamiCode {
  #index = 0;
  #activationCount = 0;

  constructor() {
    document.addEventListener('keydown', (event) => this.#advance(event.code));
  }

  #advance(code: string): void {
    const isExpected = SEQUENCE[this.#index]?.includes(code) ?? false;
    this.#index = isExpected ? this.#index + 1 : 0;
    if (this.#index < SEQUENCE.length) return;
    this.#index = 0;
    void this.activate();
  }

  async activate(): Promise<void> {
    const game = getGame();
    const count = this.#activationCount;
    const path = VEHICLE_MODELS[count % VEHICLE_MODELS.length];
    const resources = await game.resourcesLoader.load([modelResource('vehicle', `${path}?cb=${count}`)]);
    const model = resources.vehicle;
    if (!model || !isModel(model)) throw new Error('Vehicle model failed to load');

    game.world.visualVehicle?.destroy();
    game.world.visualVehicle = new VisualVehicle(model.scene);
    const { confetti } = game.world;
    if (confetti) {
      for (const offset of CONFETTI_OFFSETS) confetti.pop(game.player.position.clone().add(offset));
    }
    this.#activationCount += 1;
  }
}
