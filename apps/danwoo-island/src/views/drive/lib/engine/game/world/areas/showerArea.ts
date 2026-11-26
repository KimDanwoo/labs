import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { interactButtons } from '@views/drive/lib/engine/game/world/areas/areaPoint';
import { rebuildVillageProps } from '@views/drive/lib/engine/game/world/islandVillage';
import { COVE } from '@views/drive/lib/engine/game/world/layout/tideCove';
import { rebuildShowerStation, SHOWER_PARTS } from '@views/drive/lib/engine/game/world/shoreStructures';
import { SHOWER_SCALE } from '@views/drive/lib/engine/game/world/showerBay';
import { ShowerWater } from '@views/drive/lib/engine/game/world/showerWater';
import { TideHarbor } from '@views/drive/lib/engine/game/world/tideHarbor';

const LANE = { halfWidth: 1.2 * SHOWER_SCALE, halfLength: 1.1 * SHOWER_SCALE } as const;
const SOUND = { path: 'sounds/rain/soundjay_rain-on-leaves_main-01.mp3', volume: 0.6, distanceFade: 14 } as const;

function requireChild(parent: THREE.Object3D, name: string): THREE.Object3D {
  const child = parent.getObjectByName(name);
  if (!child) throw new Error(`Shower part is missing: ${name}`);
  return child;
}

export class ShowerArea extends Area {
  readonly #harbor: TideHarbor;
  readonly #water = new ShowerWater();
  readonly #station: THREE.Object3D;
  #returnCamera: gsap.core.Tween | null = null;
  readonly #local = new THREE.Vector3();

  constructor(model: THREE.Object3D) {
    super(model);
    this.#station = this.requireReference('cabin');
    requireChild(this.#station, SHOWER_PARTS.waterAnchor).add(this.#water.group);
    this.#harbor = new TideHarbor();
    const valve = this.#harbor.valve.position.clone();
    this.game.interactivePoints.create({
      position: valve,
      text: '밸브 돌리기',
      align: 'right',
      state: 'concealed',
      onInteract: () => this.#turnValve(),
      ...interactButtons(this),
    });
    this.#watchNight(requireChild(this.#station, SHOWER_PARTS.lanternGlow));
    this.#registerSound(this.#station.position);
  }

  #turnValve(): void {
    const { water, view, modals } = this.game;
    water.toggleTide();
    const shouldPan = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!shouldPan) return;
    const focus = view.focusPoint;
    focus.isTracking = false;
    focus.magnet.active = false;
    gsap.to(focus.position, {
      x: COVE.islandX,
      z: COVE.islandZ,
      duration: 1.45,
      ease: 'power2.inOut',
      overwrite: true,
    });
    this.#returnCamera?.kill();
    this.#returnCamera = gsap.delayedCall(7.5, () => {
      if (modals.items.get('map')?.isOpen) return;
      focus.isTracking = true;
      focus.magnet.active = true;
    });
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
    this.#harbor.update();
    this.#water.update({ isRunning: this.#isUnderShower(), delta: this.game.ticker.deltaScaled });
  }
}
