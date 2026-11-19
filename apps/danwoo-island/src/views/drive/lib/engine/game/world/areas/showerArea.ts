import * as THREE from 'three/webgpu';

import { rebuildVillageProps } from '../islandVillage';
import { rebuildShowerStation, SHOWER_PARTS } from '../shoreStructures';
import { SHOWER_SCALE } from '../showerBay';
import { ShowerWater } from '../showerWater';
import { Area } from './area';

const LANE = { halfWidth: 1.2 * SHOWER_SCALE, halfLength: 1.1 * SHOWER_SCALE } as const;
const SOUND = { path: 'sounds/rain/soundjay_rain-on-leaves_main-01.mp3', volume: 0.6, distanceFade: 14 } as const;

function requireChild(parent: THREE.Object3D, name: string): THREE.Object3D {
  const child = parent.getObjectByName(name);
  if (!child) throw new Error(`Shower part is missing: ${name}`);
  return child;
}

export class ShowerArea extends Area {
  readonly #water = new ShowerWater();
  readonly #station: THREE.Object3D;
  readonly #local = new THREE.Vector3();

  constructor(model: THREE.Object3D) {
    super(model);
    this.#station = this.requireReference('cabin');
    requireChild(this.#station, SHOWER_PARTS.waterAnchor).add(this.#water.group);
    this.#watchNight(requireChild(this.#station, SHOWER_PARTS.lanternGlow));
    this.#registerSound(this.#station.position);
  }

  override setObjects(): void {
    rebuildShowerStation(this.model);
    rebuildVillageProps(this.model);
    super.setObjects();
  }

  #watchNight(glow: THREE.Object3D): void {
    const { dayCycles } = this.game;
    glow.visible = dayCycles.isInInterval('night');
    dayCycles.events.on('night', (isNight) => {
      glow.visible = isNight;
    });
  }

  #registerSound(position: THREE.Vector3): void {
    this.game.audio.register({
      path: SOUND.path,
      autoplay: true,
      loop: true,
      volume: 0,
      positions: position,
      distanceFade: SOUND.distanceFade,
      onPlaying: (item) => {
        item.volume = this.#water.flow * SOUND.volume;
      },
    });
  }

  #isUnderShower(): boolean {
    const local = this.#station.worldToLocal(this.#local.copy(this.game.physicalVehicle.position));
    return Math.abs(local.x) < LANE.halfWidth && Math.abs(local.z) < LANE.halfLength;
  }

  override update(): void {
    this.#water.update({ isRunning: this.#isUnderShower(), delta: this.game.ticker.deltaScaled });
  }
}
