import gsap from 'gsap';
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import type { AudioItem } from '@views/drive/lib/engine/game/audioItem';
import { ISLAND_PLACES } from '@views/drive/lib/engine/game/islandPlaces';
import { Player } from '@views/drive/lib/engine/game/player';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import {
  arrivalNotice,
  LIFT,
  NOTICE_DURATION,
  ORIGIN,
  SPIN,
  TRIGGER,
  VISIT,
} from '@views/drive/lib/engine/game/world/areas/altarAreaConfig';
import { createDebris, createDust, createFunnel } from '@views/drive/lib/engine/game/world/areas/altarEffects';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { pickTornadoDestination } from '@views/drive/lib/engine/game/world/areas/tornadoRoute';
import { rebuildSurfPoint } from '@views/drive/lib/engine/game/world/shoreStructures';

export class AltarArea extends Area {
  readonly #position: THREE.Vector3;
  readonly #spin = uniform(SPIN.idle);
  readonly #swirlTime = uniform(0);
  readonly #lift: AudioItem;
  readonly #visited = new Set<string>();
  #lastTrigger = -Infinity;
  #travelSequence: number | null = null;
  #liftCall: gsap.core.Tween | null = null;
  #visitTimer = 0;

  constructor(model: THREE.Object3D) {
    super(model);
    this.#position = this.requireReference('altar').position.clone();
    const { audio } = this.game;
    audio.register({
      path: 'sounds/wind/13582-wind-in-forest-loop.mp3',
      autoplay: true,
      loop: true,
      volume: 0.35,
      positions: this.#position,
      distanceFade: 22,
    });
    this.#lift = audio.register({ path: 'sounds/swoosh/Swoosh 02.mp3', autoplay: false, loop: false, volume: 0.6 });
    const effects = { area: this, position: this.#position, swirlTime: this.#swirlTime };
    createFunnel(effects, 1, 1);
    createFunnel(effects, 0.72, -1.4);
    createDust(effects);
    createDebris(effects);
    this.#createTrigger();
    this.game.ticker.events.on('tick', () => this.#tick(), TICK_ORDER.altar);
  }

  override setObjects(): void {
    rebuildSurfPoint(this.model);
    super.setObjects();
  }

  #createTrigger(): void {
    const zone = this.game.zones.create('cylinder', this.#position.clone(), TRIGGER.radius);
    zone.events.on('enter', () => this.#startTravel());
  }

  #startTravel(): void {
    const { player, physicalVehicle, ticker } = this.game;
    const isAirborne = player.position.y - this.#position.y > TRIGGER.maxHeight;
    const isCoolingDown = ticker.elapsed - this.#lastTrigger < TRIGGER.cooldown;
    if (this.#travelSequence !== null || isAirborne || isCoolingDown) return;
    this.#lastTrigger = ticker.elapsed;
    this.#travelSequence = player.respawnSequence;
    player.state = Player.STATE_LOCKED;
    physicalVehicle.launch({ upward: LIFT.upward, spin: LIFT.spin, carry: LIFT.carry });
    this.#lift.play();
    this.#surge();
    this.#liftCall = gsap.delayedCall(LIFT.duration, () => this.#teleport());
  }

  #teleport(): void {
    const { player, view, notifications } = this.game;
    this.#liftCall = null;
    const destination = pickTornadoDestination({
      places: ISLAND_PLACES.map(({ respawnName }) => respawnName),
      visited: this.#visited,
      origin: ORIGIN,
      random: Math.random,
    });
    const place = ISLAND_PLACES.find(({ respawnName }) => respawnName === destination);
    const isInterrupted = player.respawnSequence !== this.#travelSequence;
    if (isInterrupted || !place) {
      this.#endTravel();
      if (!isInterrupted) player.state = Player.STATE_DEFAULT;
      return;
    }
    player.respawn(place.respawnName, () => {
      view.focusPoint.isTracking = true;
      this.#visited.add(place.respawnName);
      this.#endTravel();
      notifications.show(arrivalNotice(place), { type: 'arrival', duration: NOTICE_DURATION });
    });
    this.#travelSequence = player.respawnSequence;
  }

  #endTravel(): void {
    this.#liftCall?.kill();
    this.#liftCall = null;
    this.#travelSequence = null;
  }

  #surge(): void {
    gsap.to(this.#spin, {
      value: SPIN.surge,
      duration: SPIN.surgeIn,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(this.#spin, { value: SPIN.idle, duration: SPIN.surgeOut, ease: 'power2.inOut' });
      },
    });
  }

  #tick(): void {
    const { ticker, player, respawns } = this.game;
    this.#swirlTime.value += ticker.deltaScaled * this.#spin.value;
    if (this.#travelSequence !== null && player.respawnSequence !== this.#travelSequence) this.#endTravel();
    if (this.#liftCall) this.game.physicalVehicle.launch({ upward: LIFT.updraft * ticker.deltaScaled });
    this.#visitTimer -= ticker.delta;
    if (this.#visitTimer > 0) return;
    this.#visitTimer = VISIT.interval;
    for (const { respawnName } of ISLAND_PLACES) {
      const { position } = respawns.getByName(respawnName);
      if (Math.hypot(position.x - player.position.x, position.z - player.position.z) < VISIT.radius) {
        this.#visited.add(respawnName);
      }
    }
  }
}
